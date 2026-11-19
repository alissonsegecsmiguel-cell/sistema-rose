import { test, expect } from '@playwright/test';
import { alterarStatusEncomenda, cancelarEncomenda, carregarDadosDeTeste, CHAVE_ARMAZENAMENTO, corrigirPagamentoEncomenda, criarRascunhoEdicao, dataRelativa, registrarPagamentoEncomenda, salvarEdicaoEncomenda } from '../src/lib/dados';
test('status, histórico legível, devolução negativa e crédito sem duplicação', () => {
  const d = carregarDadosDeTeste(), e = d.encomendas[6], u = d.usuarios[0].id;
  expect(() => alterarStatusEncomenda(d, 'matriz', e.id, 'em_producao', u)).toThrow('próximo');
  let base = alterarStatusEncomenda(d, 'matriz', e.id, 'confirmado', u);
  expect(() => alterarStatusEncomenda(base, 'matriz', e.id, 'orcamento', u)).toThrow('motivo');
  const r = criarRascunhoEdicao(base.encomendas[6], u); r.encomenda.dataEntrega = dataRelativa(3); r.encomenda.itens.push({ ...r.encomenda.itens[1], id: 'novo-item' });
  base = salvarEdicaoEncomenda(base, 'matriz', r).dados;
  expect(base.encomendas[6].historico.at(-1)?.detalhe).toContain('Data alterada'); expect(base.encomendas[6].historico.at(-1)?.detalhe).toContain('Item incluído');
  base = cancelarEncomenda(base, 'matriz', e.id, u, 'Cancelamento fictício', 'devolver', 'pix', 5000);
  expect(base.encomendas[6].pagamentos.at(-1)?.valorCentavos).toBe(-5000);
  expect(base.clientes.find(c => c.id === e.clienteId)?.creditoCentavos).toBe(11000);
  base = corrigirPagamentoEncomenda(base, 'matriz', e.id, base.encomendas[6].pagamentos.at(-1)!.id, 'dinheiro', 6000, 'Devolução corrigida', u);
  expect(base.clientes.find(c => c.id === e.clienteId)?.creditoCentavos).toBe(10000);
  expect(() => registrarPagamentoEncomenda(base, 'matriz', e.id, 'pix', 1, u)).toThrow('indisponível');
});
test('corrigir forma, cancelar com devolução e imprimir doces e comprovante', async ({ page }) => {
  await page.goto('/entrar'); await page.getByRole('button', { name: /^Administrativo/ }).click(); await page.goto('/encomendas/encomenda-teste-09');
  await page.getByRole('button', { name: 'Mais ações', exact: true }).click(); await page.getByRole('menuitem', { name: 'Registrar pagamento', exact: true }).click(); await page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click(); await page.getByRole('button', { name: 'Corrigir pagamento', exact: true }).click();
  await page.getByLabel('Forma corrigida').selectOption('pix'); await page.getByLabel('Motivo da correção').fill('Forma registrada incorretamente no teste'); await page.getByRole('button', { name: 'Salvar correção', exact: true }).click();
  await expect(page.getByText(/Forma registrada incorretamente no teste/)).toBeVisible();
  await page.getByRole('button', { name: 'Mais ações', exact: true }).click(); await page.getByRole('menuitem', { name: 'Cancelar encomenda', exact: true }).click();
  await page.getByLabel('Motivo do cancelamento').fill('Cliente de teste desistiu'); await page.getByLabel('Valor da devolução').fill('5000'); await page.getByRole('button', { name: 'Confirmar cancelamento', exact: true }).click();
  await expect(page.locator('main .selo').first()).toHaveText('Cancelado');
  const pagamento = await page.evaluate(k => JSON.parse(localStorage.getItem(k)!).dados.encomendas.find((e: { id: string }) => e.id === 'encomenda-teste-09').pagamentos.at(-1), CHAVE_ARMAZENAMENTO);
  expect(pagamento.tipo).toBe('devolucao'); expect(pagamento.valorCentavos).toBe(-5000);
  for (const rota of ['comanda?tipo=doces', 'comprovante']) { await page.goto(`/encomendas/encomenda-teste-09/${rota}`); await expect(page.locator('.papel')).toContainText('Brigadeiro'); if (rota === 'comprovante') await expect(page.locator('.papel')).toContainText('Feito com amor'); else await expect(page.locator('.papel')).not.toContainText('R$'); await page.emulateMedia({ media: 'print' }); await page.screenshot({ path: `relatorios/fila/evidencias-05/${rota.startsWith('comanda') ? 'doces' : 'comprovante'}.png`, fullPage: true }); await page.emulateMedia({ media: 'screen' }); }
});
test('saída de impressão respeita 80mm e A4', async ({ page }) => {
  await page.goto('/entrar'); await page.getByRole('button', { name: /^Administrativo/ }).click();
  await page.goto('/encomendas/encomenda-teste-07/comanda?tipo=bolos');
  for (const [formato, largura] of [['cupom', 227], ['a4', 595]] as const) {
    await page.getByLabel('Tamanho de impressão').selectOption(formato);
    const pdf = await page.pdf({ path: `relatorios/fila/evidencias-05/comanda-${formato}.pdf`, preferCSSPageSize: true, printBackground: true });
    const caixa = pdf.toString('latin1').match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
    expect(caixa).not.toBeNull(); expect(Math.abs(Number(caixa![1]) - largura)).toBeLessThan(2);
  }
});
