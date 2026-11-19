import { test, expect, type Page } from '@playwright/test';
import { carregarDadosDeTeste, dataRelativa, pagarConta, salvarContaPagar, novaContaPagar } from '../src/lib/dados';
import { conciliacao, conferenciaReceita, dreDoMes, fluxoDeCaixa, mesAnterior, previsto, realizado, recebidoEmCaixasFechados } from '../src/lib/financeiro';
import { criarAleatorio, gerarHistorico } from '../src/lib/historico-teste';

async function entrar(page: Page, perfil = 'Administrativo', largura = 1440) {
  await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar');
  await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await expect(page).toHaveURL(/visao-geral/);
}
const hoje = dataRelativa(0), passado = mesAnterior(hoje.slice(0, 7));

test('histórico determinístico e DRE do mês passado batendo com os caixas fechados', () => {
  const a = criarAleatorio(42), b = criarAleatorio(42); expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  const d = carregarDadosDeTeste(), h1 = gerarHistorico(d, n => dataRelativa(-n)), h2 = gerarHistorico(d, n => dataRelativa(-n));
  expect(JSON.stringify(h1)).toBe(JSON.stringify(h2)); expect(h1.vendas.length).toBeGreaterThan(300); expect(h1.encomendas.length).toBeGreaterThan(50);
  const retrasado = mesAnterior(passado);
  for (const loja of ['matriz', 'filial', 'consolidado']) {
    const dre = dreDoMes(d, loja, passado); expect(dre.receitaBruta).toBeGreaterThan(0); const c = conferenciaReceita(d, loja, passado); expect(c.diferenca).toBe(0); expect(c.receitaBruta).toBe(dre.receitaBruta);
    // Mês só com histórico gerado (todas as encomendas pagas na entrega): receita igual aos caixas fechados.
    if (conferenciaReceita(d, loja, retrasado).saldo === 0 && conferenciaReceita(d, loja, retrasado).outras === 0) expect(dreDoMes(d, loja, retrasado).receitaBruta).toBe(recebidoEmCaixasFechados(d, loja, retrasado));
  }
  const dre = dreDoMes(d, 'matriz', passado);
  expect(dre.receitaLiquida).toBe(dre.receitaBruta - dre.descontos - dre.taxas); expect(dre.taxas).toBeGreaterThan(0); expect(dre.cmv).toBeGreaterThan(0);
  expect(dre.lucroBruto).toBe(dre.receitaLiquida - dre.cmv); expect(dre.operacionais.find(x => x.id === 'aluguel')?.valor).toBe(120000);
  expect(dre.resultado).toBe(dre.lucroBruto - [...dre.operacionais, ...dre.financeiras, ...dre.outras].reduce((s, x) => s + x.valor, 0));
  expect(dre.operacionais.some(x => x.id === 'insumos' || x.id === 'embalagens')).toBe(false);
});

test('pagar conta de compra sai do a pagar e entra no realizado; recorrência gera 3 próximas; conciliação de crédito', () => {
  let d = carregarDadosDeTeste(); const u = d.usuarios[0].id, conta = d.contasPagar.find(c => c.status === 'aberta' && c.origem === 'compra')!;
  expect(previsto(d, conta.lojaId, '2000-01-01', '2999-12-31', hoje).some(l => l.descricao === conta.descricao && l.valor === conta.valorCentavos)).toBe(true);
  d = pagarConta(d, conta.id, { data: hoje, formaPagamentoId: 'pix', origem: 'Conta bancária' }, u).dados;
  expect(d.contasPagar.find(c => c.id === conta.id)!.status).toBe('paga');
  expect(realizado(d, conta.lojaId, hoje, hoje, hoje).some(l => l.tipo === 'saida' && l.descricao === conta.descricao)).toBe(true);
  expect(previsto(d, conta.lojaId, '2000-01-01', '2999-12-31', hoje).some(l => l.descricao === conta.descricao && l.valor === conta.valorCentavos && l.tipo === 'saida')).toBe(false);
  const nova = { ...novaContaPagar(d, 'matriz'), descricao: 'Internet da loja (teste)', valorCentavos: 12000, vencimento: '2026-01-31', recorrencia: { tipo: 'mensal' as const, dia: 31 } };
  const r = salvarContaPagar(d, nova).contasPagar.filter(c => c.descricao === 'Internet da loja (teste)'); expect(r.map(c => c.vencimento)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  const credito = conciliacao(d, 'matriz', dataRelativa(-20), hoje, 'credito')[0]; expect(credito.taxaPercentual).toBe(3.5); expect(credito.taxa).toBe(Math.round(credito.vendido * 0.035));
  const [a, m, dd] = credito.data.split('-').map(Number); expect(credito.dataPrevista).toBe(new Date(Date.UTC(a, m - 1, dd + 30)).toISOString().slice(0, 10));
  const f = fluxoDeCaixa(d, 'matriz', dataRelativa(-14), dataRelativa(30), hoje); expect(f.linhas.length).toBeGreaterThan(10); expect(f.linhas.at(-1)!.acumulado).toBe(f.linhas.reduce((s, l) => s + l.saldo, 0));
});

test('Atendimento não acessa o financeiro', async ({ page }) => {
  await entrar(page, 'Atendimento Matriz'); await page.goto('/financeiro'); await expect(page.getByRole('heading', { name: 'Você não tem acesso a esta área' })).toBeVisible();
});

test('pagar conta de compra pela tela, DRE e conciliação de crédito', async ({ page }) => {
  await entrar(page); await page.goto('/financeiro?aba=pagar'); const painel = page.getByRole('tabpanel', { name: 'Contas a pagar' });
  await painel.getByLabel('Origem da conta').selectOption('compra'); const botao = painel.getByRole('button', { name: /^Pagar Compra NF/ }).first(); const nome = (await botao.getAttribute('aria-label'))!.replace('Pagar ', '');
  await botao.click(); await page.getByRole('dialog', { name: 'Pagar conta' }).getByRole('button', { name: 'Confirmar' }).click(); await expect(page.getByRole('status').filter({ hasText: 'Conta paga' })).toBeVisible();
  await painel.getByLabel('Situação da conta').selectOption('paga'); await painel.getByLabel('Vencimento de').fill('2000-01-01'); await expect(painel.getByRole('table', { name: 'Contas a pagar' })).toContainText(nome);
  await page.getByRole('tab', { name: 'Fluxo de caixa' }).click(); await expect(page.getByRole('table', { name: 'Fluxo de caixa' })).toBeVisible(); await expect(page.getByRole('img', { name: /Saldo do período/ })).toBeVisible();
  await page.getByRole('tab', { name: 'DRE' }).click(); const dre = page.getByRole('table', { name: /DRE gerencial de/ }); await expect(dre).toContainText('Receita bruta'); await expect(dre).toContainText('= Resultado do mês'); await expect(page.getByText('Não substitui a contabilidade.')).toBeVisible();
  await page.getByRole('link', { name: 'Imprimir DRE em A4' }).click(); await expect(page.locator('.papel')).toContainText('DRE gerencial'); await page.goBack();
  await page.goto('/financeiro?aba=conciliacao'); const conc = page.getByRole('tabpanel', { name: 'Conciliação' }); await conc.getByLabel('Forma de pagamento').selectOption('credito');
  const tabela = conc.getByRole('table', { name: 'Conciliação por dia e forma' }); await expect(tabela).toContainText('3,5%');
  await conc.getByRole('button', { name: /^Conferir Cartão de crédito/ }).first().click(); const dlg = page.getByRole('dialog', { name: 'Conferir recebimento' }); await dlg.getByLabel('Valor que caiu na conta').fill('R$ 1,00'); await dlg.getByRole('button', { name: 'Marcar como conferido' }).click();
  await expect(tabela).toContainText('Diferença de');
});

for (const largura of [1440, 1024, 760, 390]) test(`financeiro ${largura}px: abas, teclado e sem rolagem horizontal`, async ({ page }) => {
  await entrar(page, 'Administrativo', largura); await page.goto('/financeiro'); await expect(page.getByText('Contas atrasadas', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: `relatorios/fila/evidencias-13/resumo-${largura}.png`, fullPage: true });
  await page.getByRole('tab', { name: 'Resumo', exact: true }).focus();
  for (const nome of ['Contas a pagar', 'Contas a receber', 'Fluxo de caixa', 'DRE', 'Conciliação', 'Categorias']) { await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: nome, exact: true })).toBeFocused(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: `relatorios/fila/evidencias-13/${nome}-${largura}.png`, fullPage: true }); }
  const editar = page.getByRole('button', { name: 'Editar Aluguel' }); await editar.focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('dialog', { name: 'Editar categoria' })).toBeVisible(); await page.keyboard.press('Escape'); await expect(editar).toBeFocused();
});
