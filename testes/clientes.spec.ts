import { test, expect } from '@playwright/test';
import { carregarDadosDeTeste, filtrarClientes, listarClientes, resumoCliente, salvarCliente } from '../src/lib/dados';
test('clientes compartilhados, recorrência, gasto e pendências', () => {
  const d = carregarDadosDeTeste(); expect(listarClientes(d, 'matriz')).toEqual(listarClientes(d, 'filial'));
  expect(filtrarClientes(d, '', 'recorrentes').length).toBeGreaterThanOrEqual(3); expect(filtrarClientes(d, '', 'pendencia').length).toBeGreaterThanOrEqual(2); expect(filtrarClientes(d, '', 'aniversario').length).toBeGreaterThanOrEqual(2);
  expect(resumoCliente(d, 'cliente-teste-01').total).toBe(32000);
  const novo = salvarCliente(d, { id: 'cliente-teste-novo', lojaId: 'filial', nome: 'Cliente Teste Novo', telefone: '00900000123' });
  expect(listarClientes(novo, 'matriz').some(c => c.id === 'cliente-teste-novo')).toBe(true);
});
for (const largura of [1440, 1024, 760, 390]) for (const perfil of ['Administrativo', 'Atendimento Matriz', 'Atendimento Filial']) {
  test(`clientes ${largura}px ${perfil}: filtro, histórico, cadastro e nova encomenda`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar'); await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await page.goto('/clientes');
    await page.getByRole('radio', { name: 'Recorrentes', exact: true }).focus(); await page.keyboard.press('Space');
    await expect(page.getByRole('table', { name: 'Clientes encontrados' })).toContainText('Cliente Teste 01');
    await expect(page.getByRole('link', { name: /^WhatsApp/ }).first()).toHaveAttribute('target', '_blank');
    await page.getByRole('link', { name: 'Ver cliente', exact: true }).first().click();
    await expect(page.locator('.indicador').filter({ hasText: 'Total gasto' })).toContainText('320,00');
    await page.getByRole('tab', { name: 'Encomendas', exact: true }).focus(); await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Pagamentos e pendências', exact: true })).toBeFocused();
    await page.screenshot({ path: `relatorios/fila/evidencias-06/cliente-${largura}-${perfil}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Nova encomenda para este cliente', exact: true }).click();
    await expect(page.getByLabel('Cliente', { exact: true })).toHaveValue('cliente-teste-01');
    await page.goto('/clientes/novo'); await page.getByLabel('Nome', { exact: true }).fill('Cliente Teste Cadastro'); await page.getByLabel('Telefone', { exact: true }).fill('00900000124');
    await page.getByRole('button', { name: 'Salvar cliente', exact: true }).focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Cliente Teste Cadastro', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Editar', exact: true }).click(); await page.getByLabel('Observações (opcional)').fill('Observação fictícia editada'); await page.getByRole('button', { name: 'Salvar cliente', exact: true }).click();
    await page.getByRole('tab', { name: 'Dados', exact: true }).click(); await expect(page.getByText('Observações: Observação fictícia editada', { exact: true })).toBeVisible();
    await page.goto('/clientes/novo'); await page.getByLabel('Telefone', { exact: true }).fill('00900000124'); await expect(page.getByRole('link', { name: 'Ver cliente existente', exact: true })).toBeVisible();
  });
}
