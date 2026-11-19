import { test, expect, type Page } from '@playwright/test';
import { alterarCustoInsumo, calcularValorBolo, carregarDadosDeTeste, novoItemBolo, salvarFicha } from '../src/lib/dados';
import { custoBolo, custoComponente, custoEncomenda, custoFicha, custoPorUnidadeUso, tabelaCustoTamanhoMassa, validarFicha } from '../src/lib/custos';
import type { FichaTecnica } from '../src/lib/tipos';

async function entrar(page: Page, perfil = 'Administrativo', largura = 1440) {
  await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar');
  await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await expect(page).toHaveURL(/visao-geral/);
}
const ficha = (id: string, componentes: FichaTecnica['componentes'], rendimento = 100): FichaTecnica => ({ id, nome: id, tipo: 'base', rendimentoQuantidade: rendimento, rendimentoUnidade: 'g', perdaPercentual: 0, componentes });

test('custos: conversão de unidade, três níveis, perda e bloqueio de ciclo', () => {
  const d = carregarDadosDeTeste(), farinha = d.insumos.find(i => i.id === 'farinha-trigo')!;
  expect(custoPorUnidadeUso(farinha)).toBeCloseTo(farinha.custoAtualCentavos / 1000);
  expect(custoComponente(d, { tipo: 'insumo', insumoId: 'farinha-trigo', quantidade: 500 })).toBeCloseTo(farinha.custoAtualCentavos / 2);
  const c = ficha('c', [{ tipo: 'insumo', insumoId: 'farinha-trigo', quantidade: 1000 }], 1000), b = ficha('b', [{ tipo: 'ficha', fichaId: 'c', quantidade: 500 }], 500), a = { ...ficha('a', [{ tipo: 'ficha', fichaId: 'b', quantidade: 250 }], 10), perdaPercentual: 10 };
  const comTres = { ...d, fichas: [...d.fichas, c, b, a] };
  expect(custoFicha(comTres, 'a').total).toBeCloseTo(farinha.custoAtualCentavos / 4); expect(custoFicha(comTres, 'a').final).toBeCloseTo(farinha.custoAtualCentavos / 4 * 1.1);
  expect(custoFicha(comTres, 'a').porUnidade).toBeCloseTo(farinha.custoAtualCentavos / 4 * 1.1 / 10);
  expect(validarFicha(comTres, { ...c, componentes: [{ tipo: 'ficha', fichaId: 'a', quantidade: 1 }] }).join(' ')).toContain('Ciclo entre fichas');
  expect(() => salvarFicha(comTres, { ...c, componentes: [{ tipo: 'ficha', fichaId: 'a', quantidade: 1 }] })).toThrow('Ciclo');
  expect(validarFicha(d, { ...c, componentes: [{ tipo: 'ficha', fichaId: 'c', quantidade: 1 }] }).join(' ')).toContain('si mesma');
});

test('custos: preço do leite condensado sobe em cascata e a margem do bolo P é calculada', () => {
  const d = carregarDadosDeTeste(), bolo = { ...novoItemBolo(), tamanho: 'tamanhos-3', massa: 'massas-2', recheios: ['recheios-1'] };
  const antes = { brigadeiro: custoFicha(d, 'ficha-brigadeiro').final, ninho: custoFicha(d, 'recheio-ninho').final, chocolate: custoFicha(d, 'recheio-chocolate').final, bolo: custoBolo(d, bolo, calcularValorBolo(d, bolo)) };
  expect(antes.bolo.total).toBeGreaterThan(0); expect(antes.bolo.preco).toBe(9000); expect(antes.bolo.margem).toBeCloseTo(9000 - antes.bolo.total);
  const novo = alterarCustoInsumo(d, 'leite-condensado', 900, d.usuarios[0].id, 'manual'), depois = custoBolo(novo, bolo, calcularValorBolo(novo, bolo));
  expect(custoFicha(novo, 'ficha-brigadeiro').final).toBeGreaterThan(antes.brigadeiro); expect(custoFicha(novo, 'recheio-ninho').final).toBeGreaterThan(antes.ninho); expect(custoFicha(novo, 'recheio-chocolate').final).toBeGreaterThan(antes.chocolate);
  expect(depois.total).toBeGreaterThan(antes.bolo.total); expect(novo.insumos.find(i => i.id === 'leite-condensado')!.historicoPrecos.at(-1)).toMatchObject({ valorCentavos: 900, origem: 'manual' });
  expect(tabelaCustoTamanhoMassa(novo, b => calcularValorBolo(novo, b)).length).toBe(20);
  const e = d.encomendas.find(x => x.itens.some(i => i.tipo === 'bolo'))!; expect(custoEncomenda(d, e).custo).toBeGreaterThan(0);
});

test('Atendimento não acessa Ficha técnica nem vê custo da encomenda', async ({ page }) => {
  await entrar(page, 'Atendimento Matriz'); await page.goto('/ficha-tecnica'); await expect(page.getByRole('heading', { name: 'Você não tem acesso a esta área' })).toBeVisible();
  await page.goto('/encomendas/encomenda-teste-01'); await expect(page.getByRole('heading', { name: 'Encomenda nº 1' })).toBeVisible(); await expect(page.getByText('Custo estimado e margem')).toHaveCount(0);
});

test('criar massa amanteigada, usar em outra ficha, subir leite condensado e simular bolo P', async ({ page }) => {
  await entrar(page); await page.goto('/ficha-tecnica');
  await page.getByRole('button', { name: 'Nova ficha' }).click(); let d = page.getByRole('dialog', { name: 'Nova ficha' });
  await d.getByLabel('Nome da ficha').fill('Massa amanteigada (teste)'); await d.getByLabel('Rendimento', { exact: true }).fill('1000');
  await d.getByRole('button', { name: 'Adicionar insumo ou ficha' }).click(); await d.getByLabel('Componente 1').selectOption('insumo:manteiga'); await d.getByLabel('Quantidade (g)').fill('200');
  await d.getByRole('button', { name: 'Adicionar insumo ou ficha' }).click(); await d.getByLabel('Componente 2').selectOption('insumo:farinha-trigo'); await d.getByLabel('Quantidade (g)').nth(1).fill('500');
  await expect(d).toContainText('Custo final: R$ 12,60'); await d.getByRole('button', { name: 'Salvar ficha' }).click();
  await page.getByRole('button', { name: 'Nova ficha' }).click(); d = page.getByRole('dialog', { name: 'Nova ficha' });
  await d.getByLabel('Nome da ficha').fill('Bolo amanteigado P (teste)'); await d.getByLabel('Rendimento', { exact: true }).fill('1');
  await d.getByLabel('Unidade do rendimento').selectOption('un');
  await d.getByRole('button', { name: 'Adicionar insumo ou ficha' }).click(); await d.getByLabel('Componente 1').selectOption({ label: 'Massa amanteigada (teste)' }); await d.getByLabel('Quantidade (g)').fill('500');
  await expect(d).toContainText('Custo final: R$ 6,30'); await d.getByRole('button', { name: 'Salvar ficha' }).click();
  await page.getByRole('link', { name: 'Bolo amanteigado P (teste)' }).click(); await expect(page.getByRole('heading', { name: 'Bolo amanteigado P (teste)' })).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Massa amanteigada' }).click(); await expect(page.getByRole('link', { name: 'Manteiga sem sal (teste)' })).toBeVisible();
  await page.goto('/ficha-tecnica?aba=custo-bolo'); const resumo = page.locator('[aria-live="polite"]').filter({ hasText: 'Custo total' });
  await expect(resumo).toContainText('Preço de venda calculado: R$ 90,00'); const custoAntes = await resumo.innerText();
  await page.goto('/ficha-tecnica/recheio-ninho'); const antesNinho = await page.locator('main').innerText();
  await page.goto('/ficha-tecnica?aba=insumos'); await page.getByRole('button', { name: 'Editar Leite condensado 395 g (teste)' }).click();
  d = page.getByRole('dialog', { name: 'Editar insumo' }); await d.getByLabel('Custo por cx').fill('R$ 9,00'); await d.getByRole('button', { name: 'Salvar insumo' }).click();
  await expect(d).toContainText('Confirmar novo custo?'); await d.getByRole('button', { name: 'Confirmar novo custo' }).click();
  await page.goto('/ficha-tecnica/recheio-ninho'); expect(await page.locator('main').innerText()).not.toBe(antesNinho);
  await page.goto('/ficha-tecnica/insumos/leite-condensado'); await expect(page.getByRole('table', { name: 'Preços registrados' })).toContainText('R$ 9,00'); await expect(page.getByRole('img', { name: /Evolução do preço/ })).toBeVisible();
  await page.goto('/ficha-tecnica?aba=custo-bolo'); expect(await resumo.innerText()).not.toBe(custoAntes); await expect(resumo).toContainText('Margem:');
  await page.goto('/ficha-tecnica'); await expect(page.getByText('Insumos com preço alterado nos últimos 30 dias')).toBeVisible(); await expect(page.locator('main')).toContainText('R$ 9,00');
  await page.goto('/encomendas/encomenda-teste-01'); await expect(page.getByText('Custo estimado e margem')).toBeVisible();
});

for (const largura of [1440, 1024, 760, 390]) test(`ficha técnica ${largura}px: abas, teclado e sem rolagem horizontal`, async ({ page }) => {
  await entrar(page, 'Administrativo', largura); await page.goto('/ficha-tecnica');
  await expect(page.getByRole('table', { name: 'Fichas técnicas' })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `relatorios/fila/evidencias-10/fichas-${largura}.png`, fullPage: true });
  await page.getByRole('tab', { name: 'Fichas', exact: true }).focus(); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Insumos' })).toBeFocused();
  await expect(page.getByRole('table', { name: 'Insumos' })).toBeVisible(); await page.screenshot({ path: `relatorios/fila/evidencias-10/insumos-${largura}.png`, fullPage: true });
  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Custo do bolo' })).toBeFocused(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `relatorios/fila/evidencias-10/custo-bolo-${largura}.png`, fullPage: true });
  const editar = page.getByRole('button', { name: 'Editar montagem do tamanho P', exact: true }); await editar.focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('dialog', { name: 'Montagem do tamanho P' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(editar).toBeFocused();
  await page.goto('/ficha-tecnica/recheio-chocolate'); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: `relatorios/fila/evidencias-10/detalhe-${largura}.png`, fullPage: true });
});
