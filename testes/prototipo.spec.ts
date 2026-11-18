import { test, expect, type Page } from '@playwright/test';
import { modulos } from '../src/lib/permissoes';

const chave = 'sistema-rose-prototipo-v1';
async function entrar(page: Page, perfil = 'Administrativo') {
  await page.goto('/entrar');
  const botao = page.getByRole('button', { name: new RegExp(`^${perfil}`) });
  await expect(botao).toBeEnabled();
  await botao.focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/visao-geral$/);
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible();
}
async function semOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function conferirTopo(page: Page, largura: number, perfil: string) {
  const faixa = page.locator('.faixa-prototipo');
  const barra = page.locator('.area-sistema > .barra-superior');
  const restaurar = faixa.getByRole('button', { name: 'Restaurar dados de teste' });
  const iniciais = barra.getByRole('button', { name: /^Abrir menu do usuário:/ });
  if (largura > 760) {
    await expect(faixa.getByText('Protótipo com dados fictícios. Nada aqui é real.', { exact: true })).toBeVisible();
    await expect(faixa.locator('.faixa-texto-compacto')).not.toBeVisible();
    await expect(barra.locator('.barra-usuario')).toBeVisible();
    await expect(iniciais).not.toBeVisible();
    return;
  }
  await expect(faixa.getByText('Protótipo: dados fictícios', { exact: true })).toBeVisible();
  await expect(faixa.locator('.faixa-texto-completo').first()).not.toBeVisible();
  const titulo = await page.getByRole('heading', { name: 'Visão geral', exact: true }).boundingBox();
  expect(titulo!.y).toBeLessThanOrEqual(150);
  expect((await faixa.boundingBox())!.height).toBe(44);
  const alvos = await page.locator('.faixa-prototipo button, .area-sistema > .barra-superior button, .area-sistema > .barra-superior select').evaluateAll(elementos => elementos.filter(el => el.getClientRects().length).map(el => { const r = el.getBoundingClientRect(); return { largura: r.width, altura: r.height }; }));
  for (const alvo of alvos) { expect(alvo.largura).toBeGreaterThanOrEqual(44); expect(alvo.altura).toBeGreaterThanOrEqual(44); }
  const yControles = await barra.locator('.botao-menu, .marca-compacta, .barra-loja, .menu-usuario').evaluateAll(elementos => elementos.map(el => { const r = el.getBoundingClientRect(); return r.y + r.height / 2; }));
  expect(Math.max(...yControles) - Math.min(...yControles)).toBeLessThanOrEqual(1);
  await expect(barra.locator('.barra-usuario')).not.toBeVisible();
  if (perfil === 'Administrativo') {
    const selecao = barra.getByLabel('Loja selecionada');
    await expect(selecao).toBeVisible();
    await selecao.selectOption('consolidado'); await expect(selecao).toHaveValue('consolidado');
    await selecao.selectOption('matriz');
    expect(await barra.locator('label').evaluate(el => getComputedStyle(el).clipPath)).toBe('inset(50%)');
  } else {
    await expect(barra.getByRole('combobox')).toHaveCount(0);
    await expect(barra.locator('.loja-fixa')).toHaveText(new RegExp(perfil.endsWith('Matriz') ? 'Matriz' : 'Filial'));
    await expect(barra.locator('.loja-fixa small')).not.toBeVisible();
  }
  await restaurar.hover(); await expect(faixa.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(faixa.getByRole('tooltip')).not.toBeVisible();
  await restaurar.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Restaurar dados de teste?' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(restaurar).toBeFocused();
  await iniciais.focus(); await page.keyboard.press('Enter');
  const menu = barra.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu).toContainText(perfil === 'Administrativo' ? 'Admin Teste' : perfil.endsWith('Matriz') ? 'Atendente Teste 01' : 'Atendente Teste 02');
  await expect(menu).toContainText(perfil === 'Administrativo' ? 'Administrativo' : 'Atendimento');
  await expect(menu.getByRole('menuitem', { name: 'Trocar perfil' })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(menu).toHaveCount(0); await expect(iniciais).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(barra.getByRole('menuitem', { name: 'Trocar perfil' })).toBeFocused();
  await page.screenshot({ path: `relatorios/fila/evidencias-01C/menu-${largura}-${perfil.replaceAll(' ', '-')}.png`, fullPage: true });
  await page.keyboard.press('Escape');
  await iniciais.click(); await page.getByRole('heading', { name: 'Visão geral', exact: true }).click(); await expect(menu).toHaveCount(0);
  await iniciais.click(); await barra.getByRole('menuitem', { name: 'Trocar perfil' }).click();
  await expect(page).toHaveURL(/\/entrar$/); await entrar(page, perfil);
  await semOverflow(page);
}
for (const largura of [1440, 1024, 760, 390]) {
  for (const perfil of ['Administrativo', 'Atendimento Matriz', 'Atendimento Filial']) {
    test(`${largura}px: ${perfil}, telas e navegação`, async ({ page }) => {
      const erros: string[] = []; page.on('pageerror', erro => erros.push(erro.message));
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto('/entrar'); await semOverflow(page);
      await expect(page.getByRole('img', { name: 'Ateliê Delícias da Rose' })).toBeVisible();
      if (perfil === 'Administrativo') await page.screenshot({ path: `relatorios/fila/evidencias/${largura}-entrar.png`, fullPage: true });
      await entrar(page, perfil); await semOverflow(page);
      await conferirTopo(page, largura, perfil);
      await expect(page.getByRole('button', { name: 'Abrir menu', exact: true, includeHidden: true })).toHaveCount(1);
      if (largura <= 760) {
        const abrir = page.getByRole('button', { name: 'Abrir menu', exact: true });
        await expect(abrir).toBeVisible(); await abrir.focus(); await page.keyboard.press('Enter');
        const gaveta = page.getByRole('dialog', { name: 'Menu do sistema' }); await expect(gaveta).toBeVisible();
        for (let i = 0; i < 18; i++) { await page.keyboard.press('Tab'); expect(await gaveta.evaluate(el => el.contains(document.activeElement))).toBe(true); }
        await page.keyboard.press('Escape'); await expect(gaveta).not.toBeVisible(); await expect(abrir).toBeFocused();
        await abrir.click(); await gaveta.getByRole('link', { name: 'Encomendas', exact: true }).focus(); await page.keyboard.press('Enter');
        await expect(gaveta).not.toBeVisible();
      } else {
        await expect(page.getByRole('button', { name: 'Abrir menu', exact: true })).not.toBeVisible();
        const link = page.locator('aside').getByRole('link', { name: 'Encomendas', exact: true }); await link.focus(); await page.keyboard.press('Enter');
      }
      await expect(page).toHaveURL(/\/encomendas$/); await expect(page.getByRole('heading', { name: 'Encomendas', exact: true })).toBeVisible(); await semOverflow(page);
      await page.screenshot({ path: `relatorios/fila/evidencias/${largura}-${perfil.replaceAll(' ', '-')}-encomendas.png`, fullPage: true });
      await page.goto('/visao-geral'); await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible();
      await page.screenshot({ path: `relatorios/fila/evidencias/${largura}-${perfil.replaceAll(' ', '-')}-visao-geral.png`, fullPage: true });
      await page.screenshot({ path: `relatorios/fila/evidencias-01C/depois-${largura}-${perfil.replaceAll(' ', '-')}.png`, fullPage: true });
      await page.goto('/design-system'); await expect(page.getByRole('heading', { name: 'Design system', exact: true })).toBeVisible(); await semOverflow(page);
      if (perfil === 'Administrativo') await page.screenshot({ path: `relatorios/fila/evidencias/${largura}-design-system.png`, fullPage: true });
      await expect(page.getByRole('table')).toBeVisible();
      expect(await page.locator('tbody tr').first().evaluate(el => getComputedStyle(el).display)).toBe(largura <= 760 ? 'block' : 'table-row');
      expect(erros).toEqual([]);
    });
  }
}
test('perfis, lojas, persistência e restauração real dos dados', async ({ page }) => {
  await entrar(page);
  const select = page.getByLabel('Loja selecionada');
  for (const loja of ['filial', 'consolidado', 'matriz']) { await select.selectOption(loja); await page.reload(); await expect(page.getByLabel('Loja selecionada')).toHaveValue(loja); }
  await page.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)!); s.dados.encomendas[0].observacoes = 'Alteração fictícia temporária'; localStorage.setItem(k, JSON.stringify(s)); }, chave);
  await page.reload();
  const restaurar = page.getByRole('button', { name: 'Restaurar dados de teste' }); await restaurar.click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)!).dados.encomendas[0].observacoes, chave)).toBe('Alteração fictícia temporária');
  await restaurar.click(); await page.getByRole('button', { name: 'Restaurar dados', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Dados de teste restaurados.');
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)!).dados.encomendas[0].observacoes, chave)).toBe('Valores de teste, sem validade comercial.');
  await expect(restaurar).toBeFocused();
  for (const [perfil, loja] of [['Atendimento Matriz', 'Matriz'], ['Atendimento Filial', 'Filial']]) {
    await page.getByRole('button', { name: 'Trocar perfil' }).click(); await expect(page).toHaveURL(/\/entrar$/); await entrar(page, perfil);
    await expect(page.getByLabel('Loja selecionada')).toHaveCount(0); await expect(page.locator('.loja-fixa')).toContainText(loja);
    await expect(page.locator('aside nav a')).toHaveCount(4); await expect(page.locator('aside').getByRole('link', { name: 'Design system' })).toHaveCount(0);
    for (const m of modulos.filter(m => !m.atendimento)) { await page.goto(m.rota); await expect(page.getByRole('heading', { name: 'Você não tem acesso a esta área' })).toBeVisible(); }
    await page.getByRole('link', { name: 'Voltar à Visão geral' }).click(); await expect(page).toHaveURL(/\/visao-geral$/);
  }
});
test('todos os módulos administrativos são estados vazios', async ({ page }) => {
  await entrar(page); await expect(page.locator('aside nav a')).toHaveCount(12);
  await expect(page.locator('aside').getByRole('link', { name: 'Design system' })).toBeVisible();
  for (const m of modulos) { await page.goto(m.rota); await expect(page.getByRole('heading', { name: m.titulo, exact: true })).toBeVisible(); await expect(page.getByText(m.texto, { exact: true })).toBeVisible(); await expect(page.locator('main .estado-vazio')).toHaveCount(1); }
  await page.goto('/encomendas/nova'); await expect(page.getByRole('heading', { name: 'Nova encomenda', exact: true })).toBeVisible();
});
test('sem perfil redireciona, manual direto, 404 e noindex', async ({ page, request }) => {
  await page.goto('/estoque'); await expect(page).toHaveURL(/\/entrar$/);
  await page.goto('/'); await expect(page).toHaveURL(/\/entrar$/);
  await page.goto('/design-system'); await expect(page.getByRole('heading', { name: 'Design system', exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', 'noindex, nofollow');
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  const resposta = await page.goto('/pagina-inexistente'); expect(resposta?.status()).toBe(404); await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
});
test('manual: abas, foco preso, Esc, valor em centavos e notificação', async ({ page }) => {
  await page.goto('/design-system');
  const aba = page.getByRole('tab', { name: 'Primeira aba' }); await aba.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Segunda aba' })).toBeFocused(); await expect(page.getByRole('tabpanel', { name: 'Segunda aba' })).toBeVisible();
  await page.keyboard.press('ArrowRight'); await expect(aba).toBeFocused(); await page.keyboard.press('End'); await expect(page.getByRole('tab', { name: 'Segunda aba' })).toBeFocused(); await page.keyboard.press('Home'); await expect(aba).toBeFocused();
  expect(await aba.evaluate(el => getComputedStyle(el).outlineWidth)).toBe('2px');
  const abrir = page.getByRole('button', { name: 'Abrir diálogo de exemplo' }); await abrir.focus(); await page.keyboard.press('Enter'); const dialogo = page.getByRole('dialog', { name: 'Diálogo de exemplo' });
  for (let i = 0; i < 12; i++) { await page.keyboard.press(i % 2 ? 'Shift+Tab' : 'Tab'); expect(await dialogo.evaluate(el => el.contains(document.activeElement))).toBe(true); }
  await page.keyboard.press('Escape'); await expect(dialogo).not.toBeVisible(); await expect(abrir).toBeFocused();
  await abrir.click(); await dialogo.getByRole('button', { name: 'Salvar exemplo' }).focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('status')).toContainText('Salvo.');
  await page.getByLabel('Valor de teste', { exact: true }).fill('12345'); await expect(page.getByText('Valor guardado: 12345 centavos. Digite apenas números.')).toBeVisible(); await expect(page.getByLabel('Valor de teste', { exact: true })).toHaveValue(/123,45/);
  await page.getByRole('button', { name: 'Fechar notificação' }).click(); await expect(page.getByRole('status')).toBeEmpty();
  await page.emulateMedia({ reducedMotion: 'reduce' }); expect(await abrir.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
});
test('armazenamento bloqueado ou corrompido não impede o uso', async ({ page }) => {
  await page.addInitScript(k => { localStorage.setItem(k, '{inválido'); }, chave); await entrar(page); await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible();
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('Bloqueado'); }; Storage.prototype.setItem = () => { throw new Error('Bloqueado'); }; Storage.prototype.removeItem = () => { throw new Error('Bloqueado'); }; });
  await entrar(page); await page.getByRole('button', { name: 'Restaurar dados de teste' }).click(); await page.getByRole('button', { name: 'Restaurar dados', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Dados de teste restaurados.');
});
test('manual de um build antigo usa a data atual sem erro de hidratação', async ({ page }) => {
  const erros: string[] = []; page.on('pageerror', erro => erros.push(erro.message));
  await page.clock.install({ time: new Date('2027-01-01T15:00:00Z') });
  await page.goto('/design-system');
  await expect(page.getByRole('table')).toContainText('25/12/2026');
  await expect(page.getByRole('table')).toContainText('28/12/2026');
  expect(erros).toEqual([]);
});
test('topo compacto e manual funcionam com toque', async ({ browser }) => {
  const contexto = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await contexto.newPage();
  await entrar(page);
  const iniciais = page.getByRole('button', { name: /^Abrir menu do usuário:/ });
  await iniciais.tap(); await expect(page.getByRole('menuitem', { name: 'Trocar perfil' })).toBeVisible();
  await page.getByRole('heading', { name: 'Visão geral', exact: true }).tap(); await expect(page.getByRole('menu')).toHaveCount(0);
  await page.getByRole('button', { name: 'Restaurar dados de teste' }).tap(); await expect(page.getByRole('dialog', { name: 'Restaurar dados de teste?' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).tap();
  await page.goto('/design-system');
  await page.getByRole('button', { name: 'Ver dica', exact: true }).tap(); await expect(page.getByRole('tooltip', { name: 'Dica de exemplo para uma ação' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip', { name: 'Dica de exemplo para uma ação' })).not.toBeVisible();
  const exemplo = page.locator('.manual-menu-usuario-exemplo');
  await exemplo.getByRole('button', { name: /^Abrir menu do usuário:/ }).tap(); await expect(exemplo.getByRole('menuitem', { name: 'Trocar perfil' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(exemplo.getByRole('button')).toBeFocused();
  await semOverflow(page); await contexto.close();
});
test('contraste AA em todas as combinações de texto usadas', async ({ page }) => {
  await page.goto('/design-system');
  const resultados = await page.evaluate(() => {
    const luminosidade = (nome: string) => { const amostra = document.createElement('span'); amostra.style.color = `var(--cor-${nome})`; document.body.append(amostra); const rgb = getComputedStyle(amostra).color.match(/[\d.]+/g)!.slice(0,3).map(Number); amostra.remove(); const canais = rgb.map(c => c/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4); return .2126*canais[0]+.7152*canais[1]+.0722*canais[2]; };
    const pares = ['fundo','superficie','superficie-alt','primaria-suave'].flatMap(f => ['texto','texto-suave','primaria-texto'].map(t => [t,f]));
    pares.push(['sobre-primaria','primaria'],['sobre-primaria','primaria-hover'],['sobre-primaria','erro'],...['sucesso','alerta','erro','info'].map(t => [t,`${t}-suave`]));
    return pares.map(([texto,fundo]) => {const a=luminosidade(texto),b=luminosidade(fundo);return {texto,fundo,contraste:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
  });
  for (const resultado of resultados) expect(resultado.contraste, JSON.stringify(resultado)).toBeGreaterThanOrEqual(4.5);
});
