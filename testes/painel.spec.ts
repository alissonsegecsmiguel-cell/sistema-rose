import { test, expect } from '@playwright/test';
import { aniversariantes, carregarDadosDeTeste, dataRelativa, resumoDoDia, proximosDias, alertasDoDia } from '../src/lib/dados';
test('painel calcula lojas e consolidado sem orçamentos ou cancelamentos', () => {
  const d = carregarDadosDeTeste();
  expect(resumoDoDia(d, 'matriz')).toEqual({ quantidade: 1, saldoCentavos: 5000, orcamentos: 3 });
  expect(resumoDoDia(d, 'filial')).toEqual({ quantidade: 1, saldoCentavos: 8000, orcamentos: 0 });
  expect(resumoDoDia(d, 'consolidado')).toEqual({ quantidade: 2, saldoCentavos: 13000, orcamentos: 3 });
  expect(proximosDias(d, 'consolidado')).toHaveLength(7);
  d.encomendas[9].pagamentos = [];
  expect(alertasDoDia(d, 'filial').some(a => a.id === d.encomendas[9].id)).toBe(true);
  d.clientes[0].aniversario = `1990-${dataRelativa(0).slice(5)}`;
  expect(aniversariantes(d, 'matriz').some(c => c.id === d.clientes[0].id)).toBe(true);
});
test('consolidado mostra lojas e links dos dias preservam a data', async ({ page }) => {
  await page.goto('/entrar'); await page.getByRole('button', { name: /^Administrativo/ }).click();
  await page.getByLabel('Loja selecionada').selectOption('consolidado');
  await expect(page.locator('.indicador').filter({ hasText: 'Encomendas hoje' }).locator('.indicador-valor')).toHaveText('2');
  await expect(page.getByRole('columnheader', { name: 'Loja', exact: true })).toBeVisible();
  const primeiro = page.getByRole('navigation', { name: 'Próximos dias' }).getByRole('link').first();
  await expect(primeiro).toHaveAttribute('href', `/encomendas?data=${dataRelativa(1)}`);
  await primeiro.focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/encomendas\\?data=${dataRelativa(1)}$`));
});
