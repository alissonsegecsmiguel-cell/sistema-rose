import { test, expect, type Page } from '@playwright/test';
import { carregarDadosDeTeste, dataRelativa, salvarFormaPagamento, salvarUsuario, novoUsuario, avisosAgendaEncomenda, salvarConfiguracaoEncomendas } from '../src/lib/dados';
import { conciliacao } from '../src/lib/financeiro';

async function entrar(page: Page, perfil: RegExp | string = 'Administrativo', largura = 1440) {
  await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar');
  await page.getByRole('button', { name: typeof perfil === 'string' ? new RegExp(`^${perfil}`) : perfil }).click(); await expect(page).toHaveURL(/visao-geral/);
}

test('configurações: usuários, taxas na conciliação e avisos de agenda', () => {
  let d = carregarDadosDeTeste(); const admin = d.usuarios[0].id;
  expect(() => salvarUsuario(d, { ...d.usuarios[0], ativo: false }, admin)).toThrow('próprio');
  d = salvarUsuario(d, { ...novoUsuario(), nome: 'Atendente Teste 03', lojaId: 'filial' }); expect(d.usuarios.at(-1)).toMatchObject({ tituloAcesso: 'Atendimento Filial', ativo: true });
  const credito = d.formasPagamento.find(f => f.id === 'credito')!; d = salvarFormaPagamento(d, { ...credito, taxaPercentual: 4.5 });
  const linha = conciliacao(d, 'matriz', dataRelativa(-20), dataRelativa(0), 'credito')[0]; expect(linha.taxaPercentual).toBe(4.5); expect(linha.taxa).toBe(Math.round(linha.vendido * 0.045));
  expect(avisosAgendaEncomenda(d, dataRelativa(0), '10:00')[0]).toContain('Antecedência'); expect(avisosAgendaEncomenda(d, dataRelativa(10), '23:00')[0]).toContain('fora do funcionamento');
  expect(() => salvarConfiguracaoEncomendas(d, { antecedenciaMinimaDias: 1, horarioAbertura: '19:00', horarioFechamento: '08:00', limiteMargemPercentual: 50 })).toThrow('abertura');
});

test('Atendimento não acessa Configurações', async ({ page }) => {
  await entrar(page, 'Atendimento Matriz'); await page.goto('/configuracoes'); await expect(page.getByRole('heading', { name: 'Você não tem acesso a esta área' })).toBeVisible();
});

test('criar Atendente Teste 03, taxa de crédito 4,5% e troco padrão da Matriz', async ({ page }) => {
  await entrar(page); await page.goto('/configuracoes?aba=usuarios'); await page.getByRole('button', { name: 'Novo usuário' }).click();
  let d = page.getByRole('dialog', { name: 'Novo usuário' }); await d.getByLabel('Nome do usuário').fill('Atendente Teste 03'); await d.getByLabel('Loja do usuário').selectOption('filial'); await d.getByRole('button', { name: 'Salvar usuário' }).click();
  await page.goto('/configuracoes?aba=formas'); await page.getByRole('button', { name: 'Editar Cartão de crédito' }).click(); d = page.getByRole('dialog'); await d.getByLabel('Taxa padrão (%)').fill('4.5'); await d.getByRole('button', { name: 'Salvar forma' }).click();
  await expect(page.getByRole('table', { name: 'Formas de pagamento' })).toContainText('4,5%');
  await page.goto('/configuracoes?aba=caixa'); await page.getByLabel('Troco padrão da Matriz').fill('R$ 150,00'); await page.getByRole('button', { name: 'Salvar caixa' }).click(); await expect(page.getByRole('status').filter({ hasText: 'caixa salvas' })).toBeVisible();
  await page.goto('/caixa'); await expect(page.getByLabel(/Troco inicial/)).toHaveValue(/150,00$/);
  await page.getByRole('button', { name: 'Abrir caixa', exact: true }).click(); await expect(page.locator('main')).toContainText('Cartão de crédito 4,5%');
  await page.goto('/financeiro?aba=conciliacao'); await page.getByRole('tabpanel', { name: 'Conciliação' }).getByLabel('Forma de pagamento').selectOption('credito'); await expect(page.getByRole('table', { name: 'Conciliação por dia e forma' })).toContainText('4,5%');
  await page.goto('/encomendas/nova'); await expect(page.locator('main')).toContainText('Cartão de crédito 4,5%'); await expect(page.locator('main')).toContainText('Antecedência menor que a sugerida');
  await page.goto('/entrar'); await page.getByRole('button', { name: /Atendente Teste 03/ }).click(); await expect(page).toHaveURL(/visao-geral/); await expect(page.locator('body')).toContainText('Filial');
  await page.reload(); await expect(page).toHaveURL(/visao-geral/);
});

for (const largura of [1440, 1024, 760, 390]) test(`configurações ${largura}px: abas, teclado e sem rolagem horizontal`, async ({ page }) => {
  await entrar(page, 'Administrativo', largura); await page.goto('/configuracoes'); await expect(page.getByRole('table', { name: 'Lojas' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: `relatorios/fila/evidencias-15/lojas-${largura}.png`, fullPage: true });
  await page.getByRole('tab', { name: 'Lojas', exact: true }).focus();
  for (const nome of ['Usuários', 'Formas de pagamento', 'Caixa', 'Encomendas', 'Marca', 'Dados de teste']) { await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: nome, exact: true })).toBeFocused(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: `relatorios/fila/evidencias-15/${nome}-${largura}.png`, fullPage: true }); }
  await page.getByRole('tab', { name: 'Usuários', exact: true }).click(); const editar = page.getByRole('button', { name: 'Editar Atendente Teste 01' }); await editar.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Editar usuário' })).toBeVisible(); await page.keyboard.press('Escape'); await expect(editar).toBeFocused();
});
