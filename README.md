# Sistema Rose

Protótipo visual navegável do sistema de gestão do Ateliê Delícias da Rose, para matriz e filial. Todos os dados são fictícios. Não há senha, back-end, banco de dados ou integrações.

Requer Node.js 20.9 ou superior.

```sh
npm install
npm run dev
```

Abra http://localhost:3000. Escolha um perfil de teste. Os dados ficam no navegador e podem ser restaurados pela faixa de protótipo. O manual de componentes está em `/design-system`.

## Como abrir o protótipo

- **Com dois cliques no Windows:** abra `abrir-prototipo.bat`, na pasta do projeto. Na primeira vez, ele instala os arquivos necessários se a pasta `node_modules` ainda não existir. Aguarde o navegador abrir. Para parar o protótipo, feche a janela do atalho.
- **Pelo terminal:** na pasta do projeto, execute `npm run dev` e abra http://localhost:3000. Na primeira vez, execute `npm install` antes.

Se a porta 3000 estiver ocupada, o atalho avisa, mostra o endereço escolhido pelo Next.js e abre esse endereço no navegador. Pelo terminal, use o endereço indicado na saída do comando.

Verificações: `npm run lint`, `npm run build` e `npm test` (execute `npx playwright install chromium` na primeira vez). A configuração padrão do Next.js permite publicar na Vercel, sem segredos.
