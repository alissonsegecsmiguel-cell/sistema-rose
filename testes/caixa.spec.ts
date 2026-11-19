import { test, expect } from '@playwright/test';
import { abrirCaixa, cancelarVenda, carregarDadosDeTeste, CHAVE_ARMAZENAMENTO, corrigirPagamentosVenda, fecharCaixa, finalizarVenda, obterCaixa, pagamentoPodeSerCorrigido, reabrirCaixa, registrarMovimentoCaixa, registrarPagamentoEncomenda, resumoCaixa } from '../src/lib/dados';
import type { SessaoPrototipo } from '../src/lib/tipos';
import { podeAcessar } from '../src/lib/permissoes';
test('caixa soma fonte única, troco e movimentos; bloqueia correção após fechar', () => {
  let d = carregarDadosDeTeste(); const u = d.usuarios[0].id; d = abrirCaixa(d, 'matriz', u, 10000); const c = obterCaixa(d, 'matriz')!, antes = resumoCaixa(d, c);
  expect(d.caixas.filter(c => c.status === 'fechado')).toHaveLength(6); expect(d.caixas.filter(c => c.conferencia.some(f => f.diferencaCentavos === -500))).toHaveLength(1);
  const venda = finalizarVenda(d, c.id, u, { itens: [{ id: 'teste', tipo: 'produto', produtoId: 'brigadeiro-matriz', quantidade: 4, valorUnitarioCentavos: 250, observacao: '' }], descontoCentavos: 0, taxaCartaoCentavos: 0, pagamentos: [{ formaPagamentoId: 'dinheiro', valorCentavos: 500, recebidoCentavos: 1000 }, { formaPagamentoId: 'pix', valorCentavos: 500 }] }); d = venda.dados;
  expect(venda.venda.trocoCentavos).toBe(500); expect(resumoCaixa(d, c).dinheiro).toBe(antes.dinheiro + 500);
  d = registrarMovimentoCaixa(d, c.id, u, { tipo: 'sangria', formaPagamentoId: 'dinheiro', valorCentavos: 1000, categoria: 'Outros', descricao: 'Cofre de teste' });
  d = registrarPagamentoEncomenda(d, 'matriz', 'encomenda-teste-09', 'pix', 5000, u);
  const r = resumoCaixa(d, c); expect(r.recebimentos).toBe(antes.recebimentos + 5000); expect(r.dinheiro).toBe(antes.dinheiro - 500);
  const informados = Object.fromEntries(r.formas.map(f => [f.id, f.valorCentavos])); d = fecharCaixa(d, c.id, u, informados, 'Conferido no teste');
  const p = d.encomendas[8].pagamentos.at(-1)!; expect(pagamentoPodeSerCorrigido(d, p)).toBe(false); expect(() => cancelarVenda(d, venda.venda.id, u, 'Teste')).toThrow('fechado');
  d = reabrirCaixa(d, c.id, u, 'Revisão de teste'); expect(pagamentoPodeSerCorrigido(d, p)).toBe(true);
  d = corrigirPagamentosVenda(d, venda.venda.id, u, [{ formaPagamentoId: 'pix', valorCentavos: 1000 }], 'Forma correta');
  expect(resumoCaixa(d, c).dinheiro).toBe(antes.dinheiro - 1000);
  expect(podeAcessar('atendimento', '/caixa/historico')).toBe(false);
});
for (const largura of [1440, 1024, 760, 390]) for (const perfil of ['Administrativo', 'Atendimento Matriz', 'Atendimento Filial']) {
  test(`caixa ${largura}px ${perfil}: PDV, movimentos e fechamento`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar'); await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await page.goto('/caixa');
    await page.getByRole('button', { name: 'Abrir caixa', exact: true }).focus(); await page.keyboard.press('Enter');
    await page.screenshot({ path: `relatorios/fila/evidencias-07/caixa-${largura}-${perfil}.png` });
    await page.getByRole('tab', { name: 'Docinhos', exact: true }).click(); const produto = page.getByRole('button', { name: /^Brigadeiro/ }); for (let i = 0; i < 4; i++) await produto.click();
    await page.getByLabel('Valor nesta forma', { exact: true }).fill('500'); await page.getByLabel('Valor recebido em dinheiro').fill('1000'); await page.getByRole('button', { name: 'Adicionar forma à venda' }).click();
    await page.getByLabel('Forma da venda', { exact: true }).selectOption('pix'); await page.getByLabel('Valor nesta forma', { exact: true }).fill('500'); await page.getByRole('button', { name: 'Adicionar forma à venda' }).click(); await page.getByRole('button', { name: 'Finalizar venda', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Imprimir cupom', exact: true })).toBeVisible();
    for (const [botao, valor] of [['Sangria', '1000'], ['Suprimento', '2000'], ['Lançamento', '500']]) { await page.getByRole('button', { name: botao, exact: true }).click(); const dialogo = page.getByRole('dialog', { name: botao, exact: true }); if (botao === 'Lançamento') { await dialogo.getByLabel('Direção do lançamento').selectOption('lancamento_saida'); } await dialogo.getByLabel('Valor do movimento').fill(valor); await dialogo.getByLabel('Categoria do movimento').selectOption(botao === 'Lançamento' ? 'Pró-labore' : 'Outros'); await dialogo.getByLabel('Descrição do movimento').fill(`${botao} fictício`); await dialogo.getByRole('button', { name: 'Confirmar movimento', exact: true }).click(); }
    const encomenda = perfil.endsWith('Filial') ? 'encomenda-teste-08' : 'encomenda-teste-09';
    await page.goto(`/encomendas/${encomenda}`); await page.getByRole('button', { name: 'Mais ações', exact: true }).click(); await page.getByRole('menuitem', { name: 'Registrar pagamento', exact: true }).click(); await page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click();
    await page.goto('/caixa'); await page.getByRole('tab', { name: 'Vender', exact: true }).focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    const sessao = await page.evaluate(k => JSON.parse(localStorage.getItem(k)!), CHAVE_ARMAZENAMENTO) as SessaoPrototipo, caixa = obterCaixa(sessao.dados, sessao.lojaId)!, resumo = resumoCaixa(sessao.dados, caixa);
    expect(resumo.adiantamentosFuturos).toBeGreaterThan(0);
    for (const f of resumo.formas) await page.getByLabel(`Informado em ${f.nome}`, { exact: true }).fill(String(f.valorCentavos - (f.id === 'dinheiro' ? 500 : 0)));
    await page.getByLabel('Observação do fechamento').fill('Teste: faltaram R$ 5,00 na contagem');
    await page.screenshot({ path: `relatorios/fila/evidencias-07/fechamento-${largura}-${perfil}.png`, fullPage: true }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Fechar caixa', exact: true }).click(); await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Fechar caixa', exact: true })).toBeFocused(); await page.getByRole('button', { name: 'Fechar caixa', exact: true }).click(); await page.getByRole('button', { name: 'Confirmar fechamento', exact: true }).click();
    await expect(page.getByText('Caixa fechado', { exact: true })).toBeVisible();
    await page.goto(`/encomendas/${encomenda}`); await expect(page.getByText('Caixa fechado: pagamento bloqueado para correção.', { exact: true }).first()).toBeVisible();
    if (perfil === 'Administrativo') { await page.goto('/caixa'); await page.getByRole('button', { name: 'Reabrir caixa', exact: true }).click(); await page.getByLabel('Motivo', { exact: true }).fill('Revisão fictícia'); await page.getByRole('button', { name: 'Confirmar reabertura', exact: true }).click(); await page.goto(`/encomendas/${encomenda}`); await expect(page.getByRole('button', { name: 'Corrigir pagamento', exact: true }).first()).toBeVisible(); }
  });
}
test('consolidado somente leitura, histórico administrativo e impressão', async ({ page }) => {
  await page.goto('/entrar'); await page.getByRole('button', { name: /^Administrativo/ }).click(); await page.getByLabel('Loja selecionada').selectOption('consolidado'); await page.goto('/caixa');
  await expect(page.getByText('Escolha uma loja para operar o caixa.', { exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Abrir caixa', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Histórico dos caixas', exact: true }).click(); await expect(page.locator('tbody tr')).toHaveCount(6); await page.getByRole('link', { name: 'Ver fechamento', exact: true }).first().click();
  await expect(page.getByText('Caixa antigo em modo leitura', { exact: true })).toBeVisible(); await page.getByRole('link', { name: 'Imprimir relatório de fechamento', exact: true }).click();
  for (const formato of ['cupom', 'a4']) { await page.getByLabel('Tamanho de impressão').selectOption(formato); await page.pdf({ path: `relatorios/fila/evidencias-07/fechamento-${formato}.pdf`, preferCSSPageSize: true }); }
  await expect(page.locator('.papel')).toContainText('Fechamento de caixa');
  await page.goto('/caixa/venda/venda-teste-matriz-1/cupom'); await expect(page.locator('.papel')).toContainText('Não é documento fiscal');
});
