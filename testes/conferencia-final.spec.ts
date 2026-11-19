import { test, expect, type Page } from '@playwright/test';
import { aniversariantes, carregarDadosDeTeste, clienteTecnico, dataRelativa, filtrarClientes, listarClientes, obterCliente, quadroEncomendas, resumoCaixa, resumoCliente } from '../src/lib/dados';
import { conferenciaReceita, dreDoMes, realizado } from '../src/lib/financeiro';
import { RELATORIOS, periodoRelatorio } from '../src/lib/relatorios';

const avisoRanking = 'Encomendas do histórico de teste sem cliente identificado ficam fora deste ranking.';
const nomeTecnico = 'Clientes diversos (histórico de teste)';
const semRolagem = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

test('cadastro técnico usa campo próprio, mantém detalhe e sai das listas, aniversários e recorrência', () => {
  const d = carregarDadosDeTeste(), tecnico = d.clientes.find(clienteTecnico)!;
  expect(d.clientes).toHaveLength(13);
  expect(listarClientes(d, 'matriz')).toHaveLength(12);
  expect(obterCliente(d, 'filial', tecnico.id)).toEqual(tecnico);
  expect(resumoCliente(d, tecnico.id).recorrente).toBe(false);
  for (const filtro of ['todos', 'recorrentes', 'pendencia', 'aniversario']) expect(filtrarClientes(d, '', filtro).some(clienteTecnico)).toBe(false);
  expect(filtrarClientes(d, tecnico.nome)).toHaveLength(0);
  expect(filtrarClientes(d, tecnico.telefone)).toHaveLength(0);
  // Outro id também é técnico pelo campo, sem comparações espalhadas por id.
  const comum = d.clientes[0]; comum.tecnico = true; comum.aniversario = `2000-${dataRelativa(0).slice(5)}`;
  expect(resumoCliente(d, comum.id).recorrente).toBe(false);
  expect(aniversariantes(d, 'consolidado').some(clienteTecnico)).toBe(false);
  expect(filtrarClientes(d, comum.nome)).toHaveLength(0);
  const antiga = d.encomendas.find(e => e.clienteId === tecnico.id)!;
  antiga.dataEntrega = dataRelativa(0);
  const itens = (busca = '') => quadroEncomendas(d, antiga.lojaId, { periodo: 'hoje', busca }).flatMap(c => c.itens);
  expect(itens().some(e => e.id === antiga.id)).toBe(true);
  expect(itens(tecnico.nome)).toHaveLength(0);
  expect(itens(tecnico.telefone)).toHaveLength(0);
  expect(itens(String(antiga.numero)).some(e => e.id === antiga.id)).toBe(true);
});

test('identificação técnica preserva faturamento, DRE, caixas, fluxo e os demais relatórios', () => {
  const d = carregarDadosDeTeste(), antes = structuredClone(d);
  antes.clientes.forEach(c => { delete c.tecnico; });
  const [inicio, fim] = periodoRelatorio('mes-anterior'), mes = inicio.slice(0, 7);
  for (const lojaId of ['matriz', 'filial', 'consolidado']) {
    const f = { inicio, fim, lojaId };
    for (const r of RELATORIOS.filter(r => r.slug !== 'vendas-cliente')) expect(r.gerar(d, f)).toEqual(r.gerar(antes, f));
    expect(dreDoMes(d, lojaId, mes)).toEqual(dreDoMes(antes, lojaId, mes));
    expect(conferenciaReceita(d, lojaId, mes)).toEqual(conferenciaReceita(antes, lojaId, mes));
    expect(conferenciaReceita(d, lojaId, mes).diferenca).toBe(0);
    expect(realizado(d, lojaId, inicio, fim, dataRelativa(0))).toEqual(realizado(antes, lojaId, inicio, fim, dataRelativa(0)));
  }
  for (const caixa of d.caixas) expect(resumoCaixa(d, caixa)).toEqual(resumoCaixa(antes, caixa));
});

test('ranking, gráfico e indicadores consideram só os clientes identificados, inclusive no CSV', () => {
  const d = carregarDadosDeTeste(), gerar = RELATORIOS.find(r => r.slug === 'vendas-cliente')!.gerar;
  const r = gerar(d, { inicio: dataRelativa(-100), fim: dataRelativa(0), lojaId: 'consolidado' });
  expect(r.avisos).toContain(avisoRanking);
  expect(r.tabelas[0].linhas.some(l => l.cliente === nomeTecnico)).toBe(false);
  expect(r.grafico!.barras.some(b => b.rotulo === nomeTecnico)).toBe(false);
  expect(r.indicadores.find(i => i.rotulo === 'Recorrentes')!.valor).toBe(3);
  expect(r.indicadores[0].valor).toBe(r.tabelas[0].linhas.length);
  expect(r.tabelas[0].linhas.some(l => l.cliente === 'Cliente Teste 01')).toBe(true);
});

for (const largura of [1440, 1024, 760, 390]) for (const perfil of ['Administrativo', 'Atendimento Matriz', 'Atendimento Filial']) {
  test(`conferência final ${largura}px ${perfil}: clientes, nova encomenda, quadro e detalhe técnico`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar');
    await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click();
    await page.goto('/clientes');
    await expect(page.getByRole('table', { name: 'Clientes encontrados' }).locator('tbody tr')).toHaveCount(12);
    await expect(page.locator('main')).not.toContainText(nomeTecnico);
    const busca = page.getByLabel('Buscar cliente por nome ou telefone');
    await busca.focus(); await page.keyboard.type(nomeTecnico);
    await expect(page.getByRole('heading', { name: 'Nenhum cliente encontrado' })).toBeVisible();
    await busca.fill(''); await page.getByRole('radio', { name: 'Recorrentes', exact: true }).focus(); await page.keyboard.press('Space');
    await expect(page.locator('main')).not.toContainText(nomeTecnico); await semRolagem(page);
    await page.goto('/encomendas/nova');
    const selecao = page.getByLabel('Cliente', { exact: true });
    await expect(selecao.locator('option')).toHaveCount(13); // 12 clientes e a opção vazia.
    await expect(selecao).not.toContainText(nomeTecnico);
    await page.getByLabel('Buscar cliente por nome ou telefone').fill(nomeTecnico);
    await expect(selecao.locator('option')).toHaveCount(1);
    await page.getByLabel('Buscar cliente por nome ou telefone').fill('Cliente Teste 01');
    await selecao.selectOption('cliente-teste-01'); await semRolagem(page);
    const novo = page.getByRole('button', { name: 'Novo cliente', exact: true });
    await novo.focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Tab'); await page.keyboard.press('Escape'); await expect(novo).toBeFocused();
    await page.goto('/encomendas?aba=quadro');
    await page.getByLabel('Buscar cliente ou número no quadro').fill(nomeTecnico);
    await expect(page.getByRole('heading', { name: 'Nenhuma encomenda no quadro' })).toBeVisible(); await semRolagem(page);
    await page.goto('/clientes/cliente-historico-teste');
    await expect(page.getByRole('note')).toContainText('Cadastro técnico do protótipo');
    await expect(page.getByRole('heading', { name: nomeTecnico, exact: true })).toBeVisible();
    const aba = page.getByRole('tab', { name: 'Encomendas', exact: true });
    await aba.focus(); await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Pagamentos e pendências' })).toBeFocused(); await semRolagem(page);
    await page.getByRole('tab', { name: 'Dados', exact: true }).click();
    await page.screenshot({ path: `relatorios/fila/evidencias-17/cadastro-${largura}-${perfil}.png`, fullPage: true });
  });
}

for (const largura of [1440, 1024, 760, 390]) test(`ranking sem cliente técnico ${largura}px: aviso, teclado e exportação`, async ({ page }) => {
  await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar');
  await page.getByRole('button', { name: /^Administrativo/ }).click();
  await page.goto('/relatorios/vendas-cliente');
  await expect(page.getByText(avisoRanking, { exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Ranking de clientes' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(nomeTecnico);
  // Período sem encomendas identificadas também mantém o aviso e zera os indicadores.
  await page.getByLabel('Período').selectOption('personalizado');
  await page.getByLabel('Data inicial').fill('2000-01-01');
  await page.getByLabel('Data final').fill('2000-01-31');
  await expect(page.getByRole('heading', { name: 'Ranking de clientes: sem dados' })).toBeVisible();
  await expect(page.getByText(avisoRanking, { exact: true })).toBeVisible();
  await expect(page.locator('.indicador').filter({ hasText: 'Clientes atendidos' }).locator('.indicador-valor')).toHaveText('0');
  await expect(page.locator('main')).not.toContainText(nomeTecnico);
  await page.getByLabel('Período').selectOption('mes');
  await expect(page.getByRole('table', { name: 'Ranking de clientes' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(nomeTecnico);
  await page.getByRole('button', { name: 'Total', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('columnheader', { name: /Total/ })).toHaveAttribute('aria-sort', 'descending');
  await semRolagem(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV: Ranking de clientes' }).click();
  const { readFile } = await import('node:fs/promises');
  const csv = await readFile((await (await download).path())!, 'utf8');
  expect(csv).not.toContain(nomeTecnico); expect(csv).toContain('Cliente Teste');
  await page.screenshot({ path: `relatorios/fila/evidencias-17/ranking-${largura}.png`, fullPage: true });
});
