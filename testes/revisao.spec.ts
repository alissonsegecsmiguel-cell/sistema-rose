import { test, expect, type Page } from '@playwright/test';
import { abrirCaixa, alterarStatusEncomenda, carregarDadosDeTeste, dataRelativa, finalizarVenda, obterCaixa, registrarPagamentoEncomenda, resumoCaixa } from '../src/lib/dados';
import { conferenciaReceita, dreDoMes, liquidacao, mesAnterior, realizado, recebimentos } from '../src/lib/financeiro';
import { faturamentoTotal, periodoRelatorio } from '../src/lib/relatorios';
import { necessidadeItem } from '../src/lib/estoque';

async function entrar(page: Page, perfil: string, largura = 1440) {
  await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar');
  await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await expect(page).toHaveURL(/visao-geral/);
}
const semRolagem = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

test('conferência dos números: caixa, fluxo, relatório, DRE e baixa de estoque', () => {
  let d = carregarDadosDeTeste(); const u = d.usuarios[0].id, hoje = dataRelativa(0);
  // 1. Pagamentos de encomendas + vendas do PDV = total recebido no caixa do dia.
  d = abrirCaixa(d, 'matriz', u, 10000); const caixa = obterCaixa(d, 'matriz')!;
  d = finalizarVenda(d, caixa.id, u, { itens: [{ id: 'x', tipo: 'produto', produtoId: 'brigadeiro', quantidade: 10, valorUnitarioCentavos: 250, observacao: '' }], descontoCentavos: 0, taxaCartaoCentavos: 0, pagamentos: [{ formaPagamentoId: 'dinheiro', valorCentavos: 2500, recebidoCentavos: 3000 }] }).dados;
  const enc = d.encomendas.find(e => e.lojaId === 'matriz' && e.status === 'confirmado')!; d = registrarPagamentoEncomenda(d, 'matriz', enc.id, 'pix', 1000, u);
  const r = resumoCaixa(d, obterCaixa(d, 'matriz')!), pagamentosHoje = d.encomendas.filter(e => e.lojaId === 'matriz').flatMap(e => e.pagamentos).filter(p => dataRelativa(0, new Date(p.data)) === hoje).reduce((s, p) => s + p.valorCentavos, 0);
  expect(r.vendas + r.recebimentos).toBe(2500 + pagamentosHoje); expect(r.total).toBe(10000 + 2500 + pagamentosHoje);
  // 2. Total do caixa = receita do fluxo realizado (dinheiro e Pix caem no dia; cartão na liquidação, sem a taxa).
  const doDia = recebimentos(d, 'matriz').filter(x => x.data === hoje), entradasHoje = realizado(d, 'matriz', hoje, hoje, hoje).filter(l => l.tipo === 'entrada' && l.origem === 'Recebimento').reduce((s, l) => s + l.valor, 0);
  expect(doDia.reduce((s, x) => s + x.valor, 0)).toBe(r.vendas + r.recebimentos);
  expect(entradasHoje).toBe(recebimentos(d, 'matriz').filter(x => liquidacao(d, x).data === hoje && x.valor > 0).reduce((s, x) => s + liquidacao(d, x).liquido, 0));
  // 3. Faturamento do relatório = receita bruta do DRE do mês anterior, e a conferência com os caixas fecha.
  const [inicio, fim] = periodoRelatorio('mes-anterior'), mes = mesAnterior(hoje.slice(0, 7));
  for (const loja of ['matriz', 'filial', 'consolidado']) { expect(faturamentoTotal(d, { inicio, fim, lojaId: loja })).toBe(dreDoMes(d, loja, mes).receitaBruta); expect(conferenciaReceita(d, loja, mes).diferenca).toBe(0); }
  // 4. Baixas da produção = soma das fichas dos itens marcados como prontos.
  const emProducao = d.encomendas.find(e => e.lojaId === 'matriz' && e.status === 'em_producao')!, esperado = new Map<string, number>();
  emProducao.itens.forEach(i => necessidadeItem(d, i).insumos.forEach((q, id) => esperado.set(id, (esperado.get(id) ?? 0) + q)));
  d = alterarStatusEncomenda(d, 'matriz', emProducao.id, 'pronto', u);
  const baixas = d.movimentosEstoque.filter(m => m.referencia?.id === emProducao.id && m.tipo === 'saida_producao');
  expect(baixas.length).toBe([...esperado.values()].filter(q => Math.round(q * 100) / 100 > 0).length);
  for (const m of baixas) expect(m.quantidade).toBeCloseTo(esperado.get(m.insumoId)!, 1);
});

for (const perfil of ['Atendimento Matriz', 'Atendimento Filial']) test(`dia completo de ${perfil}`, async ({ page }) => {
  test.setTimeout(120000); await entrar(page, perfil);
  await page.goto('/caixa'); await page.getByRole('button', { name: 'Abrir caixa', exact: true }).click(); await expect(page.getByRole('button', { name: 'Finalizar venda' })).toBeVisible();
  // Orçamento com bolo e docinhos.
  await page.goto('/encomendas/nova?tipo=orcamento'); await page.getByLabel('Cliente', { exact: true }).selectOption({ index: 1 });
  await page.getByLabel('Data da entrega ou retirada').fill(dataRelativa(5)); await page.getByLabel('Hora da entrega ou retirada').fill('15:00');
  await page.getByRole('button', { name: 'Adicionar bolo', exact: true }).click(); const b = page.getByRole('dialog', { name: 'Montar bolo', exact: true });
  await b.getByRole('radio', { name: 'Redondo', exact: true }).check(); await b.getByRole('radio', { name: /^P •/ }).check(); await b.getByRole('radio', { name: 'Branca', exact: true }).check(); await b.getByRole('checkbox', { name: 'Ninho', exact: true }).check(); await b.getByRole('button', { name: /Adicionar bolo à encomenda/ }).click();
  await page.getByRole('button', { name: 'Salvar como orçamento', exact: true }).first().click(); await expect(page.getByRole('heading', { name: /^Encomenda nº/ })).toBeVisible();
  // Converter com adiantamento.
  await page.getByRole('button', { name: 'Converter em encomenda' }).click(); await expect(page.locator('main')).toContainText('Confirmado');
  await page.getByRole('button', { name: 'Mais ações' }).click(); await page.getByRole('menuitem', { name: 'Registrar pagamento' }).click(); const pg = page.getByRole('dialog', { name: 'Registrar pagamento' }); await pg.getByLabel('Valor a receber').fill('R$ 40,00'); await pg.getByRole('button', { name: 'Confirmar pagamento' }).click();
  await expect(page.locator('main')).toContainText('Parcial');
  // Produção: iniciar e marcar pronto pelo quadro; receber saldo ao entregar.
  const url = page.url(); await page.getByRole('button', { name: 'Iniciar produção' }).click(); await page.getByRole('button', { name: 'Marcar como pronto' }).click();
  await page.getByRole('button', { name: /Marcar como (retirado|entregue)/ }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Registrar pagamento agora' }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Confirmar pagamento' }).click();
  await expect(page.locator('main')).toContainText('Pago'); await page.goto(url); await expect(page.locator('main')).toContainText(/Retirado|Entregue/);
  // Venda no balcão.
  await page.goto('/caixa'); await page.getByRole('tab', { name: 'Docinhos', exact: true }).click(); await page.getByRole('button', { name: /^Brigadeiro/ }).click();
  await page.getByLabel('Valor nesta forma', { exact: true }).fill('250'); await page.getByLabel('Valor recebido em dinheiro').fill('500'); await page.getByRole('button', { name: 'Adicionar forma à venda' }).click(); await page.getByRole('button', { name: 'Finalizar venda', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Imprimir cupom', exact: true })).toBeVisible();
  // Produção do dia e cadastro de cliente.
  await page.goto('/producao'); await expect(page.getByRole('heading', { name: 'Produção', level: 1 })).toBeVisible();
  await page.goto('/clientes/novo'); await page.getByLabel('Nome', { exact: true }).fill(`Cliente Fluxo ${perfil} (teste)`); await page.getByLabel('Telefone').fill(perfil.endsWith('Matriz') ? '(00) 91111-0001' : '(00) 91111-0002'); await page.getByRole('button', { name: /Salvar cliente/ }).click(); await expect(page.locator('main')).toContainText('Cliente Fluxo');
  // Fechar o caixa.
  await page.goto('/caixa'); await page.getByRole('tab', { name: 'Fechamento', exact: true }).click(); await page.getByLabel('Observação do fechamento').fill('Conferência do dia de teste'); await page.getByRole('button', { name: 'Fechar caixa', exact: true }).click(); await page.getByRole('button', { name: 'Confirmar fechamento', exact: true }).click();
  await expect(page.locator('main')).toContainText(/fechado|Fechado/);
  await semRolagem(page);
});

test('percurso do Administrativo pelos módulos nas duas lojas e no Consolidado', async ({ page }) => {
  test.setTimeout(180000); await entrar(page, 'Administrativo');
  for (const loja of ['matriz', 'filial', 'consolidado']) {
    await page.getByLabel('Loja selecionada').selectOption(loja);
    for (const [rota, titulo] of [['/visao-geral', 'Visão geral'], ['/encomendas', 'Encomendas'], ['/producao', 'Produção'], ['/caixa', 'Caixa'], ['/clientes', 'Clientes'], ['/produtos', 'Produtos'], ['/ficha-tecnica', 'Ficha técnica'], ['/estoque', 'Estoque'], ['/compras', 'Compras'], ['/financeiro', 'Financeiro'], ['/relatorios', 'Relatórios'], ['/configuracoes', 'Configurações']]) {
      await page.goto(rota); await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible(); await expect(page.locator('main')).not.toContainText(/undefined|NaN|Error|TypeError/); await semRolagem(page);
    }
  }
  await page.goto('/compras?aba=nova'); await page.getByRole('tabpanel', { name: 'Nova compra' }).getByRole('button', { name: 'Usar XML de exemplo' }).click(); await expect(page.getByText('Fornecedor ainda não cadastrado')).toBeVisible();
  await page.goto('/financeiro?aba=dre'); await expect(page.getByText('Bate com os caixas')).toBeVisible();
  await page.goto('/relatorios/faturamento-loja'); await expect(page.getByRole('table', { name: 'Matriz e Filial lado a lado' })).toBeVisible();
});

test('entrada mostra como explorar o protótipo', async ({ page }) => {
  for (const largura of [1440, 390]) { await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar'); const bloco = page.getByRole('region', { name: 'Como explorar este protótipo' }); await expect(bloco).toBeVisible(); await expect(bloco.getByRole('listitem')).toHaveCount(4); await semRolagem(page); await page.screenshot({ path: `relatorios/fila/evidencias-16/entrar-${largura}.png`, fullPage: true }); }
});

for (const largura of [390]) for (const [rota, nome] of [['/encomendas/nova', 'nova-encomenda'], ['/caixa', 'caixa'], ['/producao', 'producao']]) test(`${nome} em ${largura}px: alvos de 44px e nada atrás da barra fixa`, async ({ page }) => {
  await entrar(page, 'Atendimento Matriz', largura); await page.goto(rota); if (rota === '/caixa') await page.getByRole('button', { name: 'Abrir caixa', exact: true }).click();
  const pequenos = await page.evaluate(() => Array.from(document.querySelectorAll('main button, main a.botao, main input:not([type=checkbox]):not([type=radio]), main select')).filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 43.5; }).map(e => (e.textContent || e.getAttribute('aria-label') || e.tagName).slice(0, 30)));
  expect(pequenos).toEqual([]); await semRolagem(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const sobreposto = await page.evaluate(() => { const barra = document.querySelector('.barra-resumo-movel'); if (!barra || !barra.getBoundingClientRect().height) return false; const topo = barra.getBoundingClientRect().top, botoes = Array.from(document.querySelectorAll('main button, main a.botao')).filter(b => !barra.contains(b) && b.getBoundingClientRect().height > 0); const ultimo = botoes.at(-1)!.getBoundingClientRect(); return ultimo.bottom > topo + 1; });
  expect(sobreposto).toBe(false);
  await page.screenshot({ path: `relatorios/fila/evidencias-16/${nome}-${largura}.png`, fullPage: true });
});
