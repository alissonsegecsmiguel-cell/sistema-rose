import { test, expect } from '@playwright/test';
import { carregarDadosDeTeste, dataRelativa, diasDoMes, filtrarEncomendas, totaisEncomendas } from '../src/lib/dados';
import { podeAcessar } from '../src/lib/permissoes';
test('permissões por segmento, filtros combinados e totais', () => {
  expect(podeAcessar('atendimento', '/encomendas/qualquer-coisa')).toBe(true);
  expect(podeAcessar('atendimento', '/financeiro/qualquer-coisa')).toBe(false);
  expect(podeAcessar('atendimento', '/encomendas-falso')).toBe(false);
  const d = carregarDadosDeTeste(), lista = filtrarEncomendas(d, 'matriz', { inicio: dataRelativa(0), fim: dataRelativa(0), status: ['em_producao'], pagamento: 'em_aberto', modalidade: 'retirada', busca: 'Cliente Teste 03' });
  expect(totaisEncomendas(lista)).toEqual({ quantidade: 1, total: 5000, saldo: 5000 });
  expect(filtrarEncomendas(d, 'filial', { busca: '900000003', inicio: dataRelativa(0) })).toHaveLength(0);
  expect(diasDoMes(d, 'consolidado', '2028-02')).toHaveLength(29);
});
for (const largura of [1440, 1024, 760, 390]) for (const perfil of ['Administrativo', 'Atendimento Matriz', 'Atendimento Filial']) {
  test(`encomendas ${largura}px ${perfil}: lista, agenda e detalhe`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 });
    await page.goto('/entrar'); await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click();
    await page.goto(`/encomendas?data=${dataRelativa(0)}`);
    await expect(page.getByLabel('Data inicial')).toHaveValue(dataRelativa(0));
    await page.getByRole('link', { name: 'Ver', exact: true }).first().focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: /^Encomenda nº/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Histórico', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `relatorios/fila/evidencias-03/detalhe-${largura}-${perfil}.png`, fullPage: true });
    await page.getByRole('link', { name: 'Voltar para encomendas' }).click();
    await expect(page).toHaveURL(new RegExp(`data=${dataRelativa(0)}`));
    await page.getByRole('tab', { name: 'Lista', exact: true }).focus(); await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Agenda', exact: true })).toBeFocused();
    await expect(page).toHaveURL(/aba=agenda/);
    await page.getByRole('button', { name: 'Próximo mês', exact: true }).click();
    await page.reload(); await expect(page.getByRole('tab', { name: 'Agenda', exact: true })).toHaveAttribute('aria-selected', 'true');
    const dia = page.locator('.calendario-dia:not(.calendario-vazio)').first();
    if (await dia.count()) { await dia.focus(); await page.keyboard.press('Enter'); await expect(dia).toHaveAttribute('aria-pressed', 'true'); }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `relatorios/fila/evidencias-03/agenda-${largura}-${perfil}.png`, fullPage: true });
    if (perfil === 'Atendimento Filial') { await page.goto('/encomendas/encomenda-teste-01'); await expect(page.getByRole('heading', { name: 'Encomenda não encontrada', exact: true })).toBeVisible(); }
  });
}
test('busca encontra encomenda do próximo mês e preserva filtros ao voltar', async ({ page }) => {
  await page.goto('/entrar'); await page.getByRole('button', { name: /^Administrativo/ }).click();
  await page.getByLabel('Loja selecionada').selectOption('consolidado');
  await page.goto('/encomendas?periodo=proximo&busca=20');
  await expect(page.getByRole('table', { name: 'Encomendas encontradas' })).toContainText('#20');
  await page.getByRole('link', { name: 'Ver', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Encomenda nº 20', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar para encomendas' }).click();
  await expect(page.getByLabel('Buscar nome, telefone ou número')).toHaveValue('20');
  await page.getByLabel('Buscar nome, telefone ou número').fill('inexistente');
  await expect(page.getByRole('heading', { name: 'Nenhuma encomenda encontrada' })).toBeVisible();
});
