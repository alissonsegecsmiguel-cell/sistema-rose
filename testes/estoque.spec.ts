import { test, expect, type Page } from '@playwright/test';
import { alterarStatusEncomenda, cancelarVenda, carregarDadosDeTeste, finalizarVenda, abrirCaixa, obterCaixa } from '../src/lib/dados';
import { concluirContagem, entradaOuRetirada, faltas, iniciarContagem, insumosAbaixoDoMinimo, perdas, salvarContagem, saldo, transferir } from '../src/lib/estoque';

async function entrar(page: Page, perfil = 'Administrativo', largura = 1440) {
  await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar');
  await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await expect(page).toHaveURL(/visao-geral/);
}

test('estoque: saldos pelos movimentos, transferência, retirada e contagem', () => {
  let d = carregarDadosDeTeste(); const u = d.usuarios[0].id;
  expect(d.estoques).toHaveLength(4); expect(d.movimentosEstoque.length).toBeGreaterThan(200); expect(d.contagens.filter(c => c.status === 'concluida')).toHaveLength(1);
  for (const e of d.estoques) for (const i of d.insumos) expect(saldo(d, e.id, i.id)).toBeGreaterThanOrEqual(0);
  expect(insumosAbaixoDoMinimo(d, 'matriz').length).toBeGreaterThan(0);
  const almox = saldo(d, 'almox-matriz', 'farinha-trigo'), prodM = saldo(d, 'producao-matriz', 'farinha-trigo'), prodF = saldo(d, 'producao-filial', 'farinha-trigo');
  d = transferir(d, 'almox-matriz', 'producao-matriz', [{ insumoId: 'farinha-trigo', quantidade: 1000 }], u);
  d = transferir(d, 'almox-matriz', 'producao-filial', [{ insumoId: 'farinha-trigo', quantidade: 500 }], u);
  expect(saldo(d, 'almox-matriz', 'farinha-trigo')).toBe(almox - 1500); expect(saldo(d, 'producao-matriz', 'farinha-trigo')).toBe(prodM + 1000); expect(saldo(d, 'producao-filial', 'farinha-trigo')).toBe(prodF + 500);
  expect(faltas(d, 'producao-filial', [{ insumoId: 'morango', quantidade: 999999 }])).toHaveLength(1);
  expect(() => transferir(d, 'producao-filial', 'almox-filial', [{ insumoId: 'morango', quantidade: 999999 }], u)).toThrow('Saldo insuficiente');
  expect(() => entradaOuRetirada(d, 'retirada', 'producao-matriz', [{ insumoId: 'morango', quantidade: 100 }], 'Desperdício', '', u)).toThrow('Descreva');
  const antes = perdas(d, 'matriz', '2000-01-01', '2999-12-31').total;
  d = entradaOuRetirada(d, 'retirada', 'producao-matriz', [{ insumoId: 'morango', quantidade: 100 }], 'Desperdício', 'Caiu no chão (teste)', u);
  expect(perdas(d, 'matriz', '2000-01-01', '2999-12-31').total).toBeCloseTo(antes + 180);
  const r = iniciarContagem(d, 'producao-matriz', u), sF = saldo(r.dados, 'producao-matriz', 'farinha-trigo'), sA = saldo(r.dados, 'producao-matriz', 'acucar-refinado');
  d = salvarContagem(r.dados, { ...r.contagem, itens: r.contagem.itens.map(i => i.insumoId === 'farinha-trigo' ? { ...i, contado: sF - 300 } : i.insumoId === 'acucar-refinado' ? { ...i, contado: sA + 200 } : i.insumoId === 'ovos' ? { ...i, contado: saldo(d, 'producao-matriz', 'ovos') } : i) });
  d = concluirContagem(d, r.contagem.id, u);
  expect(saldo(d, 'producao-matriz', 'farinha-trigo')).toBe(sF - 300); expect(saldo(d, 'producao-matriz', 'acucar-refinado')).toBe(sA + 200);
  expect(d.movimentosEstoque.filter(m => m.referencia?.id === r.contagem.id)).toHaveLength(2);
});

test('baixa automática ao marcar pronto, estorno ao voltar e na venda cancelada', () => {
  let d = carregarDadosDeTeste(); const u = d.usuarios[0].id, e = d.encomendas.find(x => x.lojaId === 'matriz' && x.status === 'em_producao' && x.itens.some(i => i.tipo === 'bolo'))!;
  const antes = saldo(d, 'producao-matriz', 'leite-condensado');
  d = alterarStatusEncomenda(d, 'matriz', e.id, 'pronto', u);
  expect(saldo(d, 'producao-matriz', 'leite-condensado')).toBeLessThan(antes); expect(d.movimentosEstoque.some(m => m.referencia?.id === e.id && m.tipo === 'saida_producao')).toBe(true);
  d = alterarStatusEncomenda(d, 'matriz', e.id, 'em_producao', u, 'Refazer cobertura (teste)');
  expect(saldo(d, 'producao-matriz', 'leite-condensado')).toBeCloseTo(antes);
  d = abrirCaixa(d, 'matriz', u, 10000); const c = obterCaixa(d, 'matriz')!, refri = saldo(d, 'producao-matriz', 'refrigerante-2l');
  const v = finalizarVenda(d, c.id, u, { itens: [{ id: 'x', tipo: 'produto', produtoId: 'refrigerante', quantidade: 2, valorUnitarioCentavos: 1000, observacao: '' }], descontoCentavos: 0, taxaCartaoCentavos: 0, pagamentos: [{ formaPagamentoId: 'pix', valorCentavos: 2000 }] });
  expect(saldo(v.dados, 'producao-matriz', 'refrigerante-2l')).toBe(refri - 2);
  expect(saldo(cancelarVenda(v.dados, v.venda.id, u, 'Cliente desistiu (teste)'), 'producao-matriz', 'refrigerante-2l')).toBe(refri);
  const sem = { ...d, fichas: d.fichas.filter(f => f.produtoId !== 'cupcake') }, comCupcake = sem.encomendas.find(x => x.lojaId === 'matriz' && x.status === 'em_producao' && x.itens.some(i => i.tipo === 'produto' && i.produtoId === 'cupcake'));
  if (comCupcake) expect(alterarStatusEncomenda(sem, 'matriz', comCupcake.id, 'pronto', u).encomendas.find(x => x.id === comCupcake.id)!.historico.some(h => h.detalhe.includes('Sem ficha técnica: baixa não feita para Cupcake'))).toBe(true);
});

test('Atendimento não acessa o estoque e não vê o cartão de mínimo', async ({ page }) => {
  await entrar(page, 'Atendimento Matriz'); await expect(page.getByText('Estoque abaixo do mínimo')).toHaveCount(0);
  await page.goto('/estoque'); await expect(page.getByRole('heading', { name: 'Você não tem acesso a esta área' })).toBeVisible();
});

test('transferir, registrar desperdício e concluir contagem pela tela', async ({ page }) => {
  await entrar(page); await expect(page.getByText('Estoque abaixo do mínimo')).toBeVisible();
  await page.goto('/estoque?aba=transferir'); let painel = page.getByRole('tabpanel', { name: 'Transferir' }); await painel.getByLabel('Estoque de destino').selectOption('producao-filial');
  await painel.getByLabel('Insumo 1', { exact: true }).selectOption('farinha-trigo'); await painel.getByLabel('Quantidade (g)').fill('2000'); await page.getByRole('button', { name: 'Transferir', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Transferência' })).toBeVisible();
  await page.getByRole('tab', { name: 'Entrada ou retirada' }).click(); painel = page.getByRole('tabpanel', { name: 'Entrada ou retirada' }); await painel.getByLabel('Insumo 1', { exact: true }).selectOption('morango'); await painel.getByLabel('Quantidade (g)').fill('250');
  await page.getByRole('button', { name: 'Registrar retirada' }).click(); expect(await painel.getByLabel('O que aconteceu (obrigatório no desperdício)').evaluate(el => (el as HTMLInputElement).validity.valueMissing)).toBe(true);
  await page.getByLabel('O que aconteceu (obrigatório no desperdício)').fill('Morangos esmagados (teste)'); await page.getByRole('button', { name: 'Registrar retirada' }).click();
  await page.getByRole('tab', { name: 'Perdas' }).click(); await expect(page.getByRole('table', { name: 'Registros de perda' })).toContainText('Morangos esmagados (teste)'); await expect(page.getByRole('img', { name: /Valor perdido por mês/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Contagem' }).click(); await page.getByLabel('Estoque a contar').selectOption('producao-matriz'); await page.getByRole('button', { name: 'Iniciar contagem' }).click();
  await expect(page.getByRole('table', { name: 'Folha de contagem' })).toBeVisible(); await expect(page.getByRole('columnheader', { name: 'Sistema' })).toHaveCount(0);
  await page.getByLabel('Contado (g)').first().fill('1'); await page.getByLabel('Contado (g)').nth(1).fill('2');
  await page.getByRole('button', { name: 'Mostrar diferenças' }).click(); await expect(page.getByRole('columnheader', { name: 'Sistema' })).toBeVisible();
  await page.getByRole('button', { name: 'Concluir contagem' }).click(); const d = page.getByRole('dialog', { name: 'Concluir contagem?' }); await expect(d.getByRole('table', { name: 'Diferenças a ajustar' }).getByRole('row')).toHaveCount(3);
  await d.getByRole('button', { name: 'Confirmar e ajustar saldos' }).click(); await expect(page.getByRole('table', { name: 'Histórico de contagens' })).toContainText('Concluída');
  await page.getByRole('link', { name: 'Imprimir folha' }).first().click(); await expect(page.locator('.papel')).toContainText('Folha de contagem');
  await page.goto('/ficha-tecnica/insumos/farinha-trigo'); await expect(page.getByRole('table', { name: 'Saldo do insumo por estoque' })).toBeVisible(); await expect(page.getByRole('table', { name: 'Últimas movimentações do insumo' })).toContainText('Transferência');
});

test('marcar pronto pela produção baixa insumos e voltar estorna', async ({ page }) => {
  await entrar(page); await page.goto('/estoque?aba=movimentacoes'); await page.getByLabel('Tipo de movimento').selectOption('saida_producao');
  const antes = await page.getByRole('status').filter({ hasText: 'movimentações no período' }).innerText();
  await page.goto('/encomendas?aba=quadro'); const cartao = page.locator('[data-coluna="em_producao"] .cartao-quadro').first();
  await cartao.getByRole('button', { name: 'Mover para...' }).click(); await page.getByRole('menuitem', { name: 'Prontas' }).click();
  await page.goto('/estoque?aba=movimentacoes'); await page.getByLabel('Tipo de movimento').selectOption('saida_producao');
  expect(await page.getByRole('status').filter({ hasText: 'movimentações no período' }).innerText()).not.toBe(antes); await expect(page.getByRole('link', { name: 'Encomenda' }).first()).toBeVisible();
});

for (const largura of [1440, 1024, 760, 390]) test(`estoque ${largura}px: abas, teclado e sem rolagem horizontal`, async ({ page }) => {
  await entrar(page, 'Administrativo', largura); await page.goto('/estoque');
  await expect(page.getByRole('table', { name: 'Saldos por insumo e estoque' })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `relatorios/fila/evidencias-11/saldos-${largura}.png`, fullPage: true });
  await page.getByRole('tab', { name: 'Saldos', exact: true }).focus();
  for (const nome of ['Movimentações', 'Transferir', 'Entrada ou retirada', 'Contagem', 'Perdas', 'Estoques']) { await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: nome, exact: true })).toBeFocused(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  await page.screenshot({ path: `relatorios/fila/evidencias-11/estoques-${largura}.png`, fullPage: true });
  const editar = page.getByRole('button', { name: 'Editar Produção Matriz' }); await editar.focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('dialog', { name: 'Editar estoque' })).toBeVisible(); await page.keyboard.press('Escape'); await expect(editar).toBeFocused();
  await page.getByRole('tab', { name: 'Perdas', exact: true }).click(); await page.screenshot({ path: `relatorios/fila/evidencias-11/perdas-${largura}.png`, fullPage: true });
});
