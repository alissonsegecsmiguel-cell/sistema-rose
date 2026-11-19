import { test, expect } from '@playwright/test';
import { alterarStatusEncomenda, carregarDadosDeTeste, dataRelativa, resumoProducao } from '../src/lib/dados';
test('produção soma bolos, recheios e doces por observação exata', () => {
  const d = carregarDadosDeTeste(), r = resumoProducao(d, 'matriz', dataRelativa(1));
  expect(r.quantidadeBolos).toBe(3); expect(r.doces).toBe(50); expect(r.produtos.filter(p => !p.separar)).toHaveLength(2); expect(r.tamanhos.find(t => t.nome === 'P')?.quantidade).toBe(2);
  let novo = alterarStatusEncomenda(d, 'matriz', 'encomenda-teste-27', 'em_producao', d.usuarios[0].id); novo = alterarStatusEncomenda(novo, 'matriz', 'encomenda-teste-27', 'pronto', d.usuarios[0].id);
  expect(resumoProducao(novo, 'matriz', dataRelativa(1)).bolosProntos).toBe(2); expect(novo.encomendas.find(e => e.id === 'encomenda-teste-27')?.historico.at(-1)?.acao).toBe('Produção pronta');
});
for (const largura of [1440, 1024, 760, 390]) for (const perfil of ['Administrativo', 'Atendimento Matriz', 'Atendimento Filial']) {
  test(`produção ${largura}px ${perfil}: resumo, status e comanda do dia`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar'); await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await page.goto('/producao');
    if (!perfil.endsWith('Filial')) await page.getByRole('button', { name: 'Amanhã', exact: true }).click();
    const esperado = perfil.endsWith('Filial') ? 1 : 3; await expect(page.locator('.cartao-producao')).toHaveCount(esperado);
    await page.getByRole('button', { name: 'Iniciar', exact: true }).first().focus(); await page.keyboard.press('Enter'); await page.getByRole('button', { name: 'Pronto', exact: true }).first().click();
    await expect(page.locator('.cartao-producao .selo').filter({ hasText: 'Pronto' })).toHaveCount(perfil.endsWith('Filial') ? 1 : 2);
    await page.screenshot({ path: `relatorios/fila/evidencias-08/bolos-${largura}-${perfil}.png`, fullPage: true }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('tab', { name: 'Bolos', exact: true }).focus(); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Doces e outros', exact: true })).toBeFocused();
    await expect(page.getByRole('table', { name: 'Totais de doces por observação', exact: true })).toBeVisible(); await page.screenshot({ path: `relatorios/fila/evidencias-08/doces-${largura}-${perfil}.png`, fullPage: true });
    await page.getByRole('link', { name: 'Imprimir comanda do dia de doces', exact: true }).click(); await expect(page.locator('.papel')).not.toContainText('R$');
    if (largura === 390 && perfil === 'Administrativo') { await page.pdf({ path: 'relatorios/fila/evidencias-08/comanda-dia-80mm.pdf', preferCSSPageSize: true }); await page.getByLabel('Tamanho de impressão').selectOption('a4'); await page.pdf({ path: 'relatorios/fila/evidencias-08/comanda-dia-a4.pdf', preferCSSPageSize: true }); }
  });
}
