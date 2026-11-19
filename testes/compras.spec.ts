import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { carregarDadosDeTeste } from '../src/lib/dados';
import { lerNfe } from '../src/lib/nfe';
import { compraDaNota, lancarCompra, salvarFornecedor, sugerirParcelas, valoresPorCategoria } from '../src/lib/compras';
import { saldo } from '../src/lib/estoque';
import { custoFicha } from '../src/lib/custos';

async function entrar(page: Page, perfil = 'Administrativo', largura = 1440) {
  await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar');
  await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await expect(page).toHaveURL(/visao-geral/);
}
const xml = (n: number) => readFileSync(`public/exemplos/nfe-exemplo-${n}.xml`, 'utf8');

test('NF-e: leitura dos exemplos e mensagens de erro', () => {
  const n = lerNfe(xml(1));
  expect(n).toMatchObject({ emitenteNome: 'Fornecedor Teste', emitenteDocumento: '00.000.000/0001-00', numero: '1234', dataEmissao: '2026-11-10', freteCentavos: 1500, descontoCentavos: 550, totalCentavos: 73500 });
  expect(n.chave).toHaveLength(44); expect(n.itens).toHaveLength(4); expect(n.itens[0]).toMatchObject({ descricao: 'LEITE COND TESTE 395G CX27', unidade: 'CX', quantidade: 2, valorUnitarioCentavos: 18900, totalCentavos: 37800 });
  expect(lerNfe(xml(2)).itens).toHaveLength(2);
  expect(() => lerNfe('texto qualquer')).toThrow('não é um XML'); expect(() => lerNfe('<a><b></a>')).toThrow('válido'); expect(() => lerNfe('<?xml version="1.0"?><pedido><item/></pedido>')).toThrow('não é de uma NF-e');
});

test('compra a prazo: estoque, custo, vínculos e contas por categoria', () => {
  let d = carregarDadosDeTeste(); const u = d.usuarios[0].id;
  expect(d.fornecedores).toHaveLength(6); expect(d.compras.filter(c => c.status === 'lancada')).toHaveLength(25); expect(d.contasPagar.length).toBeGreaterThan(25);
  const r = compraDaNota(d, lerNfe(xml(1)), 'matriz', u); expect(r.fornecedorNovo?.documento).toBe('00.000.000/0001-00');
  d = salvarFornecedor(d, r.fornecedorNovo!); const leite = d.insumos.find(i => i.id === 'leite-condensado')!, antesSaldo = saldo(d, 'almox-matriz', 'leite-condensado'), antesFicha = custoFicha(d, 'recheio-ninho').final;
  const c = { ...r.compra, fornecedorId: r.fornecedorNovo!.id, itens: r.compra.itens.map(i => i.descricaoNota.startsWith('LEITE') ? { ...i, insumoId: 'leite-condensado', fatorConversao: 27 * 395 } : i.descricaoNota.startsWith('MANTEIGA') ? { ...i, insumoId: 'manteiga', fatorConversao: 1000 } : i.descricaoNota.startsWith('FORMINHA') ? { ...i, insumoId: 'forminha-docinho', fatorConversao: 100 } : { ...i, insumoId: undefined, foraDoEstoque: true, categoriaDespesaId: 'limpeza' }), condicao: 'a_prazo' as const, parcelas: sugerirParcelas(73500, 2, '2026-11-10', 30) };
  expect(valoresPorCategoria(d, c).reduce((s, x) => s + x.valor, 0)).toBe(73500);
  d = lancarCompra(d, c, u);
  expect(saldo(d, 'almox-matriz', 'leite-condensado')).toBe(antesSaldo + 2 * 27 * 395);
  expect(d.insumos.find(i => i.id === 'leite-condensado')!.custoAtualCentavos).toBe(700); expect(leite.custoAtualCentavos).not.toBe(700);
  expect(d.insumos.find(i => i.id === 'leite-condensado')!.historicoPrecos.at(-1)).toMatchObject({ origem: 'compra', referencia: c.id });
  expect(custoFicha(d, 'recheio-ninho').final).toBeGreaterThan(antesFicha);
  const contas = d.contasPagar.filter(x => x.compraId === c.id); expect(new Set(contas.map(x => x.categoriaFinanceiraId))).toEqual(new Set(['insumos', 'embalagens', 'manutencao'])); expect(contas).toHaveLength(6);
  expect(contas.reduce((s, x) => s + x.valorCentavos, 0)).toBe(73500); expect(contas.every(x => x.status === 'aberta' && ['1/2', '2/2'].includes(x.parcela!))).toBe(true);
  const segunda = compraDaNota(d, lerNfe(xml(2)), 'matriz', u); expect(segunda.fornecedorNovo).toBeUndefined();
  expect(segunda.compra.itens[0]).toMatchObject({ insumoId: 'leite-condensado', fatorConversao: 27 * 395, sugestao: 'vinculo' });
  expect(segunda.compra.itens[1]).toMatchObject({ insumoId: 'chocolate-meio-amargo', sugestao: 'nome' });
});

test('Atendimento não acessa Compras', async ({ page }) => {
  await entrar(page, 'Atendimento Matriz'); await page.goto('/compras'); await expect(page.getByRole('heading', { name: 'Você não tem acesso a esta área' })).toBeVisible();
});

test('importar XML de exemplo, cadastrar fornecedor, vincular e lançar a prazo; segunda nota sugere vínculos', async ({ page }) => {
  await entrar(page); await page.goto('/compras?aba=nova'); const painel = page.getByRole('tabpanel', { name: 'Nova compra' });
  await painel.getByRole('button', { name: 'Usar XML de exemplo' }).click(); await expect(page.getByText('Fornecedor ainda não cadastrado')).toBeVisible();
  await painel.getByRole('button', { name: 'Cadastrar fornecedor com os dados da nota' }).click();
  await painel.getByLabel('Vincular item 1 a insumo').selectOption('leite-condensado'); await painel.getByLabel('1 CX da nota tem quantos g?').fill('10665');
  await expect(painel).toContainText('1 CX = 27 cx de 395 g = 10.665 g');
  await painel.getByLabel('Vincular item 2 a insumo').selectOption('manteiga'); await painel.getByLabel('Vincular item 3 a insumo').selectOption('forminha-docinho');
  await painel.getByRole('checkbox', { name: 'Não entra no estoque' }).nth(3).check();
  await painel.getByRole('radio', { name: 'A prazo' }).check(); await painel.getByRole('button', { name: 'Sugerir parcelas' }).click(); await expect(painel).toContainText('Parcelas somam R$ 735,00 de R$ 735,00');
  await painel.getByRole('button', { name: 'Lançar compra' }).click(); await expect(page).toHaveURL(/\/compras\/[a-f0-9-]+$/);
  await expect(page.getByRole('table', { name: 'Contas da compra' }).getByRole('row')).toHaveCount(7); await expect(page.getByRole('table', { name: 'Entradas geradas pela compra' })).toContainText('Leite condensado');
  await page.goto('/ficha-tecnica/insumos/leite-condensado'); await expect(page.getByRole('table', { name: 'Preços registrados' })).toContainText('Compra'); await expect(page.getByRole('heading', { name: /Leite condensado/ })).toBeVisible();
  await expect(page.locator('main')).toContainText('R$ 7,00 por cx');
  await page.goto('/compras?aba=nova'); await painel.getByLabel('XML de exemplo').selectOption('nfe-exemplo-2.xml'); await painel.getByRole('button', { name: 'Usar XML de exemplo' }).click();
  await expect(painel.getByText('Vínculo memorizado')).toBeVisible(); await expect(painel.getByLabel('Vincular item 1 a insumo')).toHaveValue('leite-condensado');
});

test('lançar notinha avulsa à vista', async ({ page }) => {
  await entrar(page); await page.goto('/compras?aba=nova'); const painel = page.getByRole('tabpanel', { name: 'Nova compra' });
  await painel.getByRole('button', { name: 'Lançar notinha avulsa' }).click(); await painel.getByLabel('Fornecedor da compra').selectOption('fornecedor-teste-04');
  await painel.getByLabel('Descrição na nota do item 1').fill('Morango bandeja (teste)'); await painel.getByLabel('Quantidade do item 1').fill('3'); await painel.getByLabel('Unidade da nota do item 1').fill('KG');
  await painel.getByLabel('Valor unitário do item 1').fill('R$ 20,00'); await painel.getByLabel('Vincular item 1 a insumo').selectOption('morango');
  await painel.getByRole('button', { name: 'Lançar compra' }).click(); await expect(page.getByRole('table', { name: 'Contas da compra' })).toContainText('Paga');
  await expect(page.getByRole('table', { name: 'Contas da compra' })).toContainText('R$ 60,00');
});

for (const largura of [1440, 1024, 760, 390]) test(`compras ${largura}px: abas, teclado e sem rolagem horizontal`, async ({ page }) => {
  await entrar(page, 'Administrativo', largura); await page.goto('/compras');
  await expect(page.getByRole('table', { name: 'Compras registradas' })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `relatorios/fila/evidencias-12/compras-${largura}.png`, fullPage: true });
  await page.getByRole('tab', { name: 'Compras', exact: true }).focus();
  for (const nome of ['Nova compra', 'Fornecedores', 'Preços']) { await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: nome, exact: true })).toBeFocused(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: `relatorios/fila/evidencias-12/${nome}-${largura}.png`, fullPage: true }); }
  await page.getByRole('tab', { name: 'Fornecedores', exact: true }).click(); const editar = page.getByRole('button', { name: 'Editar Hortifruti Teste' }); await editar.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Editar fornecedor' })).toBeVisible(); await page.keyboard.press('Escape'); await expect(editar).toBeFocused();
  await page.getByRole('tab', { name: 'Nova compra', exact: true }).click(); await page.getByRole('tabpanel', { name: 'Nova compra' }).getByRole('button', { name: 'Usar XML de exemplo' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: `relatorios/fila/evidencias-12/conferencia-${largura}.png`, fullPage: true });
});
