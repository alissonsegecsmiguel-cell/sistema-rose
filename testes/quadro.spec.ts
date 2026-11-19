import { test, expect, type Page } from '@playwright/test';
import { agoraNoFuso, alertasCartaoQuadro, carregarDadosDeTeste, dataRelativa, moverEncomendaQuadro, quadroEncomendas, situacaoPrazo } from '../src/lib/dados';

async function entrar(page: Page, perfil: string, largura: number) {
  await page.setViewportSize({ width: largura, height: largura > 760 ? 1400 : 900 }); await page.goto('/entrar');
  await page.getByRole('button', { name: new RegExp(`^${perfil}`) }).click(); await expect(page).toHaveURL(/visao-geral/);
}
async function arrastar(page: Page, numero: number, coluna: string) {
  const cartao = page.locator('.cartao-quadro', { hasText: `nº ${numero} ` }).first(); const destino = page.locator(`[data-coluna="${coluna}"]`); await destino.scrollIntoViewIfNeeded(); await cartao.scrollIntoViewIfNeeded();
  const a = (await cartao.locator('p').first().boundingBox())!, b = (await destino.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down(); await page.mouse.move(a.x + a.width / 2 + 10, a.y + 20, { steps: 3 });
  await page.mouse.move(b.x + b.width / 2, Math.min(Math.max(a.y, b.y + 20), b.y + b.height - 10), { steps: 8 }); await expect(destino).toHaveAttribute('data-destino', 'permitido'); await page.mouse.up();
}

test('quadro: colunas, alertas e movimentos com histórico', () => {
  const d = carregarDadosDeTeste(), u = d.usuarios[0].id, colunas = quadroEncomendas(d, 'matriz');
  expect(colunas.map(c => c.titulo)).toEqual(['Orçamentos', 'Confirmadas', 'Em produção', 'Prontas', 'Entregues']);
  expect(colunas.flatMap(c => c.itens).some(e => e.status === 'cancelado')).toBe(false);
  for (const c of colunas) expect(c.totalCentavos).toBe(c.itens.reduce((s, e) => s + e.itens.reduce((t, i) => t + (i.tipo === 'bolo' ? i.valorCentavos : i.quantidade * i.valorUnitarioCentavos), 0) - e.descontoCentavos + e.taxaCartaoCentavos, 0));
  const confirmada = d.encomendas.find(e => e.lojaId === 'matriz' && e.status === 'confirmado')!;
  const pulada = moverEncomendaQuadro(d, 'matriz', confirmada.id, 'pronto', u), h = pulada.encomendas.find(e => e.id === confirmada.id)!.historico;
  expect(pulada.encomendas.find(e => e.id === confirmada.id)!.status).toBe('pronto'); expect(h.at(-1)!.detalhe).toContain('Etapas puladas: Em produção');
  expect(h.some(x => x.acao === 'Produção pronta')).toBe(true);
  expect(() => moverEncomendaQuadro(pulada, 'matriz', confirmada.id, 'em_producao', u)).toThrow('motivo');
  expect(moverEncomendaQuadro(pulada, 'matriz', confirmada.id, 'em_producao', u, 'Ajuste de teste').encomendas.find(e => e.id === confirmada.id)!.status).toBe('em_producao');
  const meioDia = new Date(`${dataRelativa(0)}T15:00:00Z`), e = { ...confirmada, dataEntrega: agoraNoFuso(meioDia).data, horaEntrega: '10:00', status: 'pronto' as const };
  expect(situacaoPrazo(e, meioDia)).toBe('atrasada'); expect(alertasCartaoQuadro(e, meioDia)).toContain('Cliente ainda não retirou');
  expect(alertasCartaoQuadro({ ...e, status: 'confirmado', horaEntrega: '23:00' }, meioDia)).toEqual(['Começar hoje']);
});

for (const largura of [1440, 1024]) for (const perfil of ['Administrativo', 'Atendimento Matriz', 'Atendimento Filial']) test(`quadro ${largura}px ${perfil}: arrastar e mover com teclado`, async ({ page }) => {
  await entrar(page, perfil, largura); await page.goto('/encomendas?aba=quadro');
  await expect(page.getByRole('list', { name: 'Quadro de encomendas por status' })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `relatorios/fila/evidencias-08B/quadro-${largura}-${perfil}.png`, fullPage: true });
  const coluna = page.locator('[data-coluna="confirmado"] .cartao-quadro').first(); const numero = Number((await coluna.locator('.cartao-quadro-titulo').innerText()).match(/nº (\d+)/)![1]), href = await coluna.locator('.cartao-quadro-titulo').getAttribute('href');
  {
    await arrastar(page, numero, 'em_producao'); await expect(page.getByRole('status').filter({ hasText: `Encomenda nº ${numero} movida para Em produção` })).toBeVisible();
    await arrastar(page, numero, 'pronto'); await expect(page.locator('[data-coluna="pronto"]')).toContainText(`nº ${numero} `);
  }
  const cartao = page.locator('.cartao-quadro', { hasText: `nº ${numero} ` }).first(); const mover = cartao.getByRole('button', { name: 'Mover para...' });
  await mover.focus(); await page.keyboard.press('Enter'); await page.getByRole('menuitem', { name: 'Em produção' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Voltar etapa' }); await dialogo.getByRole('button', { name: 'Confirmar mudança' }).click(); await expect(dialogo).toContainText('motivo');
  await dialogo.getByLabel('Motivo da mudança').fill('Retoque fictício'); await dialogo.getByRole('button', { name: 'Confirmar mudança' }).click();
  await expect(page.locator('[data-coluna="em_producao"]')).toContainText(`nº ${numero} `);
  await page.locator('.cartao-quadro', { hasText: `nº ${numero} ` }).first().getByRole('button', { name: 'Mover para...' }).click(); await page.getByRole('menuitem', { name: 'Entregues' }).click();
  const pular = page.getByRole('dialog', { name: 'Pular etapas?' }); await pular.getByRole('button', { name: 'Confirmar mudança' }).click();
  const saldo = page.getByRole('dialog'); if (await saldo.getByText('Deseja receber agora?').count()) { await saldo.getByRole('button', { name: 'Registrar pagamento agora' }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Confirmar pagamento' }).click(); }
  await expect(page.getByRole('status').filter({ hasText: `Encomenda nº ${numero} movida para Entregues` })).toBeVisible();
  await page.goto(href!); await expect(page.locator('main')).toContainText('Etapas puladas'); await expect(page.locator('main')).toContainText('Retoque fictício');
});

for (const largura of [760, 390]) for (const perfil of ['Administrativo', 'Atendimento Matriz', 'Atendimento Filial']) test(`quadro ${largura}px ${perfil}: abas das colunas e botão mover`, async ({ page }) => {
  await entrar(page, perfil, largura); await page.goto('/encomendas?aba=quadro');
  const abas = page.getByRole('tablist', { name: 'Colunas do quadro' }); await expect(abas).toBeVisible();
  const primeira = abas.getByRole('tab').first(); await primeira.focus(); await page.keyboard.press('ArrowRight'); await expect(abas.getByRole('tab', { name: /^Confirmadas \d+$/ })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const cartao = page.locator('[data-coluna="confirmado"] .cartao-quadro').first();
  const numero = Number((await cartao.locator('.cartao-quadro-titulo').innerText()).match(/nº (\d+)/)![1]);
  await cartao.getByRole('button', { name: 'Mover para...' }).click(); await page.getByRole('menuitem', { name: 'Em produção' }).click();
  await expect(page.getByRole('status').filter({ hasText: `Encomenda nº ${numero} movida para Em produção` })).toBeVisible();
  await abas.getByRole('tab', { name: /^Em produção \d+$/ }).click(); await expect(page.locator('[data-coluna="em_producao"]')).toContainText(`nº ${numero} `);
  await page.screenshot({ path: `relatorios/fila/evidencias-08B/quadro-${largura}-${perfil}.png`, fullPage: true });
});

test('orçamento pede conversão ao sair da coluna', async ({ page }) => {
  await entrar(page, 'Administrativo', 1440); await page.goto('/encomendas?aba=quadro&qperiodo=mes');
  const cartao = page.locator('[data-coluna="orcamento"] .cartao-quadro').first(); await cartao.getByRole('button', { name: 'Mover para...' }).click();
  await page.getByRole('menuitem', { name: 'Confirmadas' }).click(); const d = page.getByRole('dialog', { name: 'Converter em encomenda confirmada?' });
  await expect(d).toBeVisible(); await d.getByRole('button', { name: 'Converter e mover' }).click(); await expect(page.getByRole('status')).toContainText('movida para Confirmadas');
});
