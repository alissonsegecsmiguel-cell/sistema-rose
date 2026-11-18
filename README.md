# Sistema Rose

Protótipo visual navegável do sistema de gestão do Ateliê Delícias da Rose, para matriz e filial. Todos os dados são fictícios. Não há senha, back-end, banco de dados ou integrações.

Requer Node.js 20.9 ou superior.

```sh
npm install
npm run dev
```

Abra http://localhost:3000. Escolha um perfil de teste. Os dados ficam no navegador e podem ser restaurados pela faixa de protótipo. O manual de componentes está em `/design-system`.

Verificações: `npm run lint`, `npm run build` e `npm test` (execute `npx playwright install chromium` na primeira vez). A configuração padrão do Next.js permite publicar na Vercel, sem segredos.
