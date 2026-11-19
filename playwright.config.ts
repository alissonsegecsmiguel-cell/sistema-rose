import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './testes',
  fullyParallel: true,
  workers: 2,
  timeout: 45000,
  reporter: [['list'], ['json', { outputFile: 'relatorios/fila/evidencias/playwright.json' }]],
  use: { baseURL: 'http://127.0.0.1:3100', locale: 'pt-BR', browserName: 'chromium', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run start -- --hostname 127.0.0.1 --port 3100', url: 'http://127.0.0.1:3100/entrar', reuseExistingServer: false, timeout: 60000 },
});
