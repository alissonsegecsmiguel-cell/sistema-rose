import { test, expect, type Page } from '@playwright/test';
import { calcularValorBolo, carregarDadosDeTeste, excluirCategoriaProduto, listarProdutos, moverCategoriaProduto, novaOpcaoBolo, novoItemBolo, opcoesMontagem, resumirItens, salvarLimiteRecheios, salvarOpcaoBolo, salvarProduto, totalEncomenda } from '../src/lib/dados';

async function entrar(page: Page, perfil = 'Administrativo', largura = 1440) {
  await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar');
  await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await expect(page).toHaveURL(/visao-geral/);
}

test('catálogo único: canais, inativação, ordem e preços sem alterar pedidos salvos', () => {
  let d = carregarDadosDeTeste();
  expect(new Set(d.produtos.map(p => p.id)).size).toBe(d.produtos.length);
  expect(d.produtos.every(p => !/-(matriz|filial)$/.test(p.id))).toBe(true);
  for (const e of d.encomendas) for (const i of e.itens) if (i.tipo === 'produto') expect(d.produtos.some(p => p.id === i.produtoId)).toBe(true);
  for (const v of d.vendas) for (const i of v.itens) expect(d.produtos.some(p => p.id === i.produtoId)).toBe(true);
  const brigadeiro = d.produtos.find(p => p.id === 'brigadeiro')!;
  d = salvarProduto(d, { ...brigadeiro, ativo: false });
  expect(listarProdutos(d, 'matriz').some(p => p.id === 'brigadeiro')).toBe(false);
  expect(listarProdutos(d, 'matriz', 'balcao').some(p => p.id === 'brigadeiro')).toBe(false);
  const comBrigadeiro = d.encomendas.find(e => e.itens.some(i => i.tipo === 'produto' && i.produtoId === 'brigadeiro'))!;
  expect(resumirItens(d, comBrigadeiro)).toContain('Brigadeiro (teste)');
  d = salvarProduto(d, { ...brigadeiro, lojasDisponiveis: ['filial'] });
  expect(listarProdutos(d, 'matriz').some(p => p.id === 'brigadeiro')).toBe(false); expect(listarProdutos(d, 'filial').some(p => p.id === 'brigadeiro')).toBe(true);
  expect(() => salvarProduto(d, { ...brigadeiro, unidadeVenda: 'cento' })).toThrow('produto novo');
  expect(() => excluirCategoriaProduto(d, 'docinhos')).toThrow('produtos');
  const ordem = moverCategoriaProduto(d, 'docinhos', -1).categoriasProduto.sort((a, b) => a.ordem - b.ordem).map(c => c.id);
  expect(ordem.slice(0, 2)).toEqual(['docinhos', 'bolos']);
  const totais = d.encomendas.map(totalEncomenda), p = d.opcoesBolo.tamanhos.find(t => t.nome === 'P')!;
  const bolo = { ...novoItemBolo(), tamanho: p.id }, antes = calcularValorBolo(d, bolo);
  d = salvarOpcaoBolo(d, 'tamanhos', { ...p, valorCentavos: p.valorCentavos + 1000 });
  expect(calcularValorBolo(d, bolo)).toBe(antes + 1000); expect(d.encomendas.map(totalEncomenda)).toEqual(totais);
  const recheio = { ...novaOpcaoBolo(d, 'recheios'), nome: 'Doce de leite (teste)' };
  d = salvarOpcaoBolo(d, 'recheios', recheio); expect(opcoesMontagem(d, 'recheios').some(o => o.id === recheio.id)).toBe(true);
  d = salvarOpcaoBolo(d, 'recheios', { ...recheio, ativo: false }); expect(opcoesMontagem(d, 'recheios').some(o => o.id === recheio.id)).toBe(false);
  expect(opcoesMontagem(d, 'recheios', [recheio.id]).some(o => o.id === recheio.id)).toBe(true);
  expect(() => salvarLimiteRecheios(d, 0)).toThrow(); expect(salvarLimiteRecheios(d, 1).configuracao.limiteRecheios).toBe(1); expect(() => salvarLimiteRecheios(d, 99)).toThrow();
});

test('Atendimento não acessa Produtos', async ({ page }) => {
  await entrar(page, 'Atendimento Matriz'); await page.goto('/produtos');
  await expect(page.getByRole('heading', { name: 'Você não tem acesso a esta área' })).toBeVisible();
});

test('recheio novo aparece na montagem, some ao inativar e preço do P vale só para bolo novo', async ({ page }) => {
  await entrar(page); await page.goto('/encomendas/encomenda-teste-01'); const antigo = await page.locator('main').innerText();
  await page.goto('/produtos'); await page.getByRole('tab', { name: 'Montagem do bolo' }).click();
  await page.getByRole('button', { name: 'Nova opção em Recheios' }).click();
  let d = page.getByRole('dialog'); await d.getByLabel('Nome da opção').fill('Doce de leite (teste)'); await d.getByRole('button', { name: 'Salvar opção' }).click();
  await expect(page.getByRole('table', { name: 'Opções de recheios' })).toContainText('Doce de leite (teste)');
  await expect(page.locator('.previa-bolo').getByRole('checkbox', { name: 'Doce de leite (teste)' })).toBeVisible();
  const linhaP = page.getByRole('table', { name: 'Opções de tamanhos' }).getByRole('row').filter({ has: page.getByRole('cell', { name: 'P' , exact: true }) });
  await linhaP.getByRole('button', { name: 'Editar P', exact: true }).click(); d = page.getByRole('dialog');
  await d.getByLabel('Preço base do bolo').fill('R$ 99,00'); await d.getByRole('button', { name: 'Salvar opção' }).click();
  await page.goto('/encomendas/nova'); await page.getByRole('button', { name: 'Adicionar bolo', exact: true }).click();
  const montar = page.getByRole('dialog', { name: 'Montar bolo', exact: true });
  await expect(montar.getByRole('checkbox', { name: 'Doce de leite (teste)' })).toBeVisible();
  await montar.getByRole('radio', { name: /^P •/ }).check(); await expect(montar).toContainText('Preço calculado: R$ 99,00');
  await page.keyboard.press('Escape'); await expect(montar).toBeHidden();
  await page.goto('/encomendas/encomenda-teste-01'); expect(await page.locator('main').innerText()).toBe(antigo);
  await page.goto('/produtos'); await page.getByRole('tab', { name: 'Montagem do bolo' }).click();
  await page.getByRole('button', { name: 'Inativar Doce de leite (teste)' }).click();
  await page.goto('/encomendas/nova'); await page.getByRole('button', { name: 'Adicionar bolo', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Montar bolo', exact: true }).getByRole('checkbox', { name: 'Ninho', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Montar bolo', exact: true }).getByRole('checkbox', { name: 'Doce de leite (teste)' })).toHaveCount(0);
  await page.goto('/caixa/venda/venda-teste-matriz-1/cupom'); await expect(page.locator('.papel')).toContainText('(teste)');
});

test('produto inativo some do PDV e da encomenda; categoria com produtos não é excluída', async ({ page }) => {
  await entrar(page); await page.goto('/produtos');
  await page.getByRole('button', { name: 'Inativar Cupcake (teste)' }).click();
  await page.getByLabel('Situação').selectOption('inativo'); await expect(page.getByRole('table', { name: 'Produtos do catálogo' })).toContainText('Cupcake (teste)');
  await page.getByRole('button', { name: 'Novo produto' }).click(); const d = page.getByRole('dialog', { name: 'Novo produto' });
  await d.getByLabel('Nome do produto').fill('Pão de mel (teste)'); await d.getByLabel('Categoria').selectOption('docinhos'); await d.getByLabel('Preço de teste').fill('R$ 6,00');
  await d.getByRole('checkbox', { name: 'Aceita em encomenda' }).uncheck(); await d.getByRole('button', { name: 'Salvar produto' }).click();
  await page.getByRole('tab', { name: 'Categorias' }).click();
  await page.getByRole('button', { name: 'Excluir Docinhos' }).click(); await expect(page.locator('.aviso.tom-erro')).toContainText('tem produtos');
  await page.getByRole('button', { name: 'Subir Docinhos' }).click();
  await expect(page.getByRole('table', { name: 'Categorias de produto em ordem de exibição' }).getByRole('row').nth(1)).toContainText('Docinhos');
  await page.goto('/encomendas/nova'); await page.getByRole('button', { name: 'Adicionar produto', exact: true }).click();
  const p = page.getByRole('dialog', { name: 'Adicionar produto', exact: true }); await expect(p.getByRole('tab').first()).toHaveText('Docinhos');
  await expect(p.getByRole('button', { name: /^Pão de mel/ })).toHaveCount(0); await expect(p.getByRole('tab', { name: 'Cupcakes' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.goto('/caixa'); await page.getByRole('button', { name: 'Abrir caixa', exact: true }).click();
  await page.getByRole('tab', { name: 'Docinhos', exact: true }).click(); await expect(page.getByRole('button', { name: /^Pão de mel/ })).toBeVisible(); await expect(page.getByRole('button', { name: /^Cupcake/ })).toHaveCount(0);
});

for (const largura of [1440, 1024, 760, 390]) test(`produtos ${largura}px: abas, teclado e sem rolagem horizontal`, async ({ page }) => {
  await entrar(page, 'Administrativo', largura); await page.goto('/produtos');
  await expect(page.getByRole('table', { name: 'Produtos do catálogo' })).toBeVisible();
  await page.getByRole('tab', { name: 'Produtos', exact: true }).focus(); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Categorias' })).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Montagem do bolo' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `relatorios/fila/evidencias-09/montagem-${largura}.png`, fullPage: true });
  const editar = page.getByRole('button', { name: 'Editar Mini', exact: true }); await editar.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Editar opção do bolo' })).toBeVisible(); await page.keyboard.press('Escape'); await expect(editar).toBeFocused();
  await page.getByRole('tab', { name: 'Produtos', exact: true }).click(); await page.getByRole('button', { name: 'Novo produto' }).click();
  await expect(page.getByRole('dialog', { name: 'Novo produto' })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `relatorios/fila/evidencias-09/produto-${largura}.png` }); await page.keyboard.press('Escape');
  await page.screenshot({ path: `relatorios/fila/evidencias-09/produtos-${largura}.png`, fullPage: true });
});
