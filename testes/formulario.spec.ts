import { test, expect, type Page } from '@playwright/test';
import { calcularTotais, calcularValorBolo, carregarDadosDeTeste, confirmarRascunho, criarRascunho, novoItemBolo, salvarCliente, salvarRascunho, validarRascunho } from '../src/lib/dados';
async function entrar(page: Page, perfil = 'Administrativo') { await page.goto('/entrar'); await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await page.goto('/encomendas/nova'); }
async function bolo(page: Page) { await page.getByRole('button', { name: 'Adicionar bolo', exact: true }).click(); const d = page.getByRole('dialog', { name: 'Montar bolo', exact: true }); await d.getByRole('radio', { name: 'Redondo', exact: true }).check(); await d.getByRole('radio', { name: /^P •/ }).check(); await d.getByRole('radio', { name: 'Branca', exact: true }).check(); await d.getByRole('checkbox', { name: 'Ninho', exact: true }).check(); await d.getByRole('button', { name: 'Adicionar bolo ao pedido' }).click(); }
async function produto(page: Page, categoria: string, nome: string, quantidade: number, observacao: string) { await page.getByRole('button', { name: 'Adicionar produto', exact: true }).click(); const d = page.getByRole('dialog', { name: 'Adicionar produto', exact: true }); await d.getByRole('tab', { name: categoria, exact: true }).click(); await d.getByRole('button', { name: new RegExp(`^${nome}`) }).click(); await d.getByLabel('Quantidade', { exact: true }).fill(String(quantidade)); await d.getByLabel('Observação do produto').fill(observacao); await d.getByRole('button', { name: 'Adicionar produto ao pedido' }).click(); }
async function salvar(page: Page, largura: number, orcamento = false) { if (largura <= 760) await page.getByRole('button', { name: 'Revisar e salvar', exact: true }).click(); await page.getByRole('button', { name: orcamento ? 'Salvar como orçamento' : 'Confirmar encomenda', exact: true }).click(); await expect(page.getByRole('heading', { name: /^Encomenda nº/ })).toBeVisible(); }
test('rascunhos, valor do bolo, percentuais e validações de escrita', () => {
  const dados = carregarDadosDeTeste(), r = criarRascunho('matriz', dados.usuarios[0].id), i = { ...novoItemBolo(), tamanho: 'tamanhos-3', formato: 'formatos-1', massa: 'massas-1', recheios: ['recheios-1'], adicionais: ['adicionais-1'], decoracoes: ['decoracoes-1'] };
  expect(calcularValorBolo(dados, i)).toBe(11000); r.encomenda.itens = [{ ...i, valorCentavos: 11000 }]; r.desconto = { tipo: 'percentual', valor: 1000 }; r.taxa = { tipo: 'percentual', valor: 450 };
  expect(calcularTotais(r)).toEqual({ subtotal: 11000, descontoCentavos: 1100, taxaCartaoCentavos: 446, total: 10346, pago: 0, saldo: 10346 });
  expect(validarRascunho(dados, r)).toHaveProperty('cliente'); r.encomenda.clienteId = dados.clientes[0].id; r.encomenda.horaEntrega = '10:00';
  const base = salvarRascunho(dados, r), salvo = confirmarRascunho(base, 'matriz', r, 'orcamento');
  expect(salvo.dados.rascunhos).toHaveLength(0); expect(salvo.dados.encomendas.at(-1)?.historico.at(-1)?.acao).toBe('Orçamento criado');
  expect(() => salvarCliente(dados, { ...dados.clientes[0], id: 'duplicado' })).toThrow('Telefone já cadastrado');
});
for (const largura of [1440, 1024, 760, 390]) for (const perfil of ['Administrativo', 'Atendimento Matriz', 'Atendimento Filial']) {
  test(`formulário ${largura}px ${perfil}: orçamento, foco e revisão`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 }); await entrar(page, perfil);
    await page.getByLabel('Cliente', { exact: true }).selectOption({ index: 1 }); await page.getByLabel('Hora da entrega ou retirada').fill('15:00');
    const abrir = page.getByRole('button', { name: 'Adicionar bolo', exact: true }); await abrir.focus(); await page.keyboard.press('Enter');
    const d = page.getByRole('dialog', { name: 'Montar bolo', exact: true });
    for (let n = 0; n < 6; n++) { await page.keyboard.press('Tab'); expect(await d.evaluate(el => el.contains(document.activeElement))).toBe(true); }
    await page.keyboard.press('Escape'); await expect(abrir).toBeFocused(); await bolo(page);
    await page.screenshot({ path: `relatorios/fila/evidencias-04/formulario-${largura}-${perfil}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (largura <= 760) { const barra = page.locator('.barra-resumo-movel'); await expect(barra).toBeVisible(); const caixa = await barra.boundingBox(); expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(901); }
    await salvar(page, largura, true); await expect(page.locator('main .selo').first()).toHaveText('Orçamento');
  });
}
test('pedido misto, cadastro rápido, dois rascunhos persistentes e adiantamento', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await entrar(page);
  await page.getByLabel('Hora da entrega ou retirada').fill('16:00'); await bolo(page);
  await page.getByRole('button', { name: 'Novo cliente', exact: true }).click(); const d = page.getByRole('dialog', { name: 'Novo cliente', exact: true });
  await d.getByLabel('Nome', { exact: true }).fill('Cliente Teste Fluxo 04'); await d.getByLabel('Telefone', { exact: true }).fill('00900000044'); await d.getByRole('button', { name: 'Salvar cliente', exact: true }).click();
  await expect(page.getByLabel('Cliente', { exact: true }).locator('option:checked')).toContainText('Cliente Teste Fluxo 04');
  await produto(page, 'Docinhos', 'Brigadeiro', 20, 'Ninho e chocolate, forminhas rosas'); await produto(page, 'Cupcakes', 'Cupcake', 10, 'Massa branca, nome de teste'); await produto(page, 'Bebidas', 'Refrigerante', 1, 'Gelado'); await produto(page, 'Descartáveis e festa', 'Vela', 1, 'Número de teste');
  await page.getByLabel('Desconto', { exact: true }).fill('500'); await page.getByLabel('Forma de pagamento do adiantamento').selectOption('pix'); await page.getByLabel('Valor do adiantamento').fill('10000'); await page.getByRole('button', { name: 'Adicionar adiantamento', exact: true }).click();
  await page.getByRole('button', { name: '+ Novo rascunho', exact: true }).click(); await page.getByLabel('Cliente', { exact: true }).selectOption({ index: 1 }); await page.getByLabel('Hora da entrega ou retirada').fill('11:00'); await bolo(page);
  await page.reload(); await expect(page.getByRole('tab', { name: 'Cliente Teste Fluxo 04', exact: true })).toBeVisible(); await page.getByRole('tab', { name: 'Cliente Teste Fluxo 04', exact: true }).click();
  await expect(page.getByLabel('Hora da entrega ou retirada')).toHaveValue('16:00'); await salvar(page, 390);
  await expect(page.getByText('Saldo: R$ 140,00', { exact: true })).toBeVisible(); await expect(page.getByText(/Pix • Adiantamento/)).toBeVisible();
  await page.goto('/encomendas/nova'); await expect(page.getByLabel('Hora da entrega ou retirada')).toHaveValue('11:00'); await salvar(page, 390, true);
});
