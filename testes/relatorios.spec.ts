import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { carregarDadosDeTeste } from '../src/lib/dados';
import { conferenciaReceita, dreDoMes } from '../src/lib/financeiro';
import { RELATORIOS, faturamentoTotal, gerarCsv, periodoRelatorio } from '../src/lib/relatorios';

async function entrar(page: Page, perfil = 'Administrativo', largura = 1440) {
  await page.setViewportSize({ width: largura, height: 900 }); await page.goto('/entrar');
  await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await expect(page).toHaveURL(/visao-geral/);
}
const gerar = (slug: string, f: Parameters<typeof RELATORIOS[number]['gerar']>[1]) => RELATORIOS.find(r => r.slug === slug)!.gerar(carregarDadosDeTeste(), f);

test('relatórios: mais vendidos, faturamento por loja, margem e conferência com DRE e caixas', () => {
  const d = carregarDadosDeTeste(), [inicio, fim] = periodoRelatorio('mes-anterior'), f = { inicio, fim, lojaId: 'consolidado' };
  expect(RELATORIOS).toHaveLength(15);
  for (const r of RELATORIOS) { const x = r.gerar(d, f); expect(x.indicadores.length).toBeGreaterThan(0); expect(x.tabelas.some(t => t.linhas.length > 0)).toBe(true); }
  const mais = gerar('mais-vendidos', f).tabelas[0].linhas; expect(Number(mais[0].quantidade)).toBeGreaterThanOrEqual(Number(mais[1].quantidade));
  expect(mais.reduce((s, l) => s + Number(l.valor), 0)).toBe(faturamentoTotal(d, f) - d.vendas.filter(v => v.status === 'concluida' && v.data.slice(0, 10) >= inicio && v.data.slice(0, 10) <= fim).reduce((s, v) => s + v.taxaCartaoCentavos, 0) - d.encomendas.filter(e => e.status === 'entregue' && e.dataEntrega >= inicio && e.dataEntrega <= fim).reduce((s, e) => s + e.taxaCartaoCentavos, 0));
  const lojas = gerar('faturamento-loja', f).tabelas[0].linhas; expect(lojas).toHaveLength(2); expect(lojas.reduce((s, l) => s + Number(l.participacao), 0)).toBeCloseTo(100);
  expect(lojas.reduce((s, l) => s + Number(l.total), 0)).toBe(faturamentoTotal(d, f));
  const mes = inicio.slice(0, 7);
  for (const loja of ['matriz', 'filial', 'consolidado']) { const total = faturamentoTotal(d, { inicio, fim, lojaId: loja }); expect(total).toBe(dreDoMes(d, loja, mes).receitaBruta); const c = conferenciaReceita(d, loja, mes); expect(c.diferenca).toBe(0); expect(total).toBe(c.caixas - c.outras + c.foraDoMes + c.saldo + c.descontos); }
  const margem = gerar('margem-produto', f); const brig = margem.tabelas[0].linhas.find(l => l.produto === 'Brigadeiro (teste)')!; expect(Number(brig.margem)).toBe(Number(brig.preco) - Number(brig.custo)); expect(margem.tabelas[1].linhas.some(l => l.produto === 'Bolo simples (teste)')).toBe(true);
  const csv = gerarCsv({ titulo: 'T', colunas: [{ chave: 'a', titulo: 'Ação', tipo: 'texto' }, { chave: 'v', titulo: 'Valor', tipo: 'moeda' }], linhas: [{ a: 'Pão; doce', v: 123456 }] });
  expect(csv).toBe('﻿Ação;Valor (R$)\r\n"Pão; doce";1234,56');
});

test('Atendimento não acessa relatórios', async ({ page }) => {
  await entrar(page, 'Atendimento Filial'); await page.goto('/relatorios/mais-vendidos'); await expect(page.getByRole('heading', { name: 'Você não tem acesso a esta área' })).toBeVisible();
});

test('os 15 relatórios abrem; faturamento do mês anterior igual ao DRE; CSV exportado', async ({ page }) => {
  await entrar(page); await page.goto('/relatorios'); await expect(page.locator('.cartao-relatorio')).toHaveCount(15);
  for (const r of RELATORIOS) { await page.goto(`/relatorios/${r.slug}`); await expect(page.getByRole('heading', { name: r.titulo, level: 1 })).toBeVisible(); await expect(page.locator('table').first()).toBeVisible(); }
  await page.goto('/relatorios/faturamento-periodo'); const fat = await page.locator('.indicador').filter({ hasText: 'Faturamento' }).first().locator('.indicador-valor').innerText();
  await page.getByLabel('Loja', { exact: true }).selectOption('consolidado'); const consolidado = await page.locator('.indicador').filter({ hasText: 'Faturamento' }).first().locator('.indicador-valor').innerText(); expect(consolidado).not.toBe('');
  await page.goto('/financeiro?aba=dre'); await page.getByLabel('Loja selecionada').selectOption('consolidado'); const dre = page.getByRole('table', { name: /DRE gerencial/ }).getByRole('row').filter({ hasText: 'Receita bruta' });
  await expect(dre.getByRole('cell').nth(1)).toHaveText(consolidado); void fat;
  await page.goto('/relatorios/mais-vendidos'); const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Exportar CSV: Produtos mais vendidos' }).click(); const arquivo = await (await download).path();
  const texto = readFileSync(arquivo!, 'utf8'); expect(texto.charCodeAt(0)).toBe(0xFEFF); expect(texto).toContain('Produto;Categoria;Quantidade;Balcão (R$)'); expect(texto).toMatch(/;\d+,\d{2}\r?\n/);
  await page.getByRole('button', { name: 'Quantidade' }).click(); await expect(page.getByRole('columnheader', { name: /Quantidade/ })).toHaveAttribute('aria-sort', 'descending');
});

for (const largura of [1440, 1024, 760, 390]) test(`relatórios ${largura}px: grade, filtros, teclado e sem rolagem horizontal`, async ({ page }) => {
  await entrar(page, 'Administrativo', largura); await page.goto('/relatorios'); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `relatorios/fila/evidencias-14/grade-${largura}.png`, fullPage: true });
  await page.getByRole('link', { name: 'Produção por período' }).focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('heading', { name: 'Produção por período', level: 1 })).toBeVisible();
  await page.getByLabel('Período').selectOption('personalizado'); await page.getByLabel('Data inicial').fill('2026-01-01'); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `relatorios/fila/evidencias-14/producao-${largura}.png`, fullPage: true });
  await page.goto('/relatorios/faturamento-loja'); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: `relatorios/fila/evidencias-14/lojas-${largura}.png`, fullPage: true });
});
