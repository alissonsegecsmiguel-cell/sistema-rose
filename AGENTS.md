# Regras do Sistema Rose

- Leia o HANDOFF.md antes de qualquer tarefa. Projeto de gestão do Ateliê Delícias da Rose, matriz e filial. Fase atual: apenas protótipo visual navegável, dados fictícios, sem back-end.
- Interface em português do Brasil, sem travessões nos textos da tela. Datas dd/mm/aaaa; fuso em configuracao.json, a confirmar; dinheiro inteiro em centavos, formatado na apresentação.
- Use tokens de src/estilos/tokens.css e componentes de src/componentes/. Não adicione cores, espaçamentos ou controles isolados nas telas. Todo componente novo e seus estados entram no manual /design-system.
- Dados de negócio vêm exclusivamente dos JSON em src/dados-teste/, por funções de src/lib/dados.ts. Nenhuma tela importa JSON nem define dados de negócio. Escritas passam por essa camada e pelo contexto do protótipo.
- Tecnologias: Next.js App Router, React, TypeScript, npm, CSS puro. Bibliotecas autorizadas: lucide-react e date-fns (pt-BR). Inter por next/font/google. Ferramentas de desenvolvimento necessárias: TypeScript, tipos, ESLint e eslint-config-next. Playwright autorizado para testar responsividade, teclado e comportamento no navegador (justificativa no HANDOFF). Outra biblioteca exige justificativa no HANDOFF.md.
- Texto deve atingir contraste AA 4,5:1. Campos >=16px, toque >=44px, foco visível de 2px com afastamento de 2px. Use rótulos, ajuda e erros associados, estado com texto, HTML semântico e navegação por teclado. Abas com setas; diálogos e gaveta prendem foco, fecham com Esc e devolvem foco.
- Movimento somente transform e opacity em 160ms, easing único; sem animação com prefers-reduced-motion.
- Toda tarefa: npm run lint e npm run build sem erros; repetir o build e comparar git status; testar telas em 1440, 1024, 760 e 390px; testar Tab, Enter e Esc; confirmar com git ls-files que referencias/ e relatorios/ estão fora do Git.
- Atualize HANDOFF.md antes de todo commit e envie ao GitHub. Adicione arquivo por arquivo. Nunca git add . nem git add -A, force push, reescrita de histórico ou remoção de branches.
- Nunca apague, mova ou versione referencias/ ou relatorios/. Não descarte alterações de origem desconhecida; registre em Em andamento no HANDOFF.
- Nunca invente dados reais (clientes, contatos, endereços, CNPJ ou preços oficiais). Use nomes claramente fictícios e preços de teste.
- Nunca use imagens de IA ou de terceiros, nem copie código de terceiros. Só o logo fornecido pode ser usado como imagem.
- Não crie banco, autenticação real, API, chaves ou segredos. Nunca versione .env. Nunca remova noindex ou o bloqueio do robots.txt.
- Siga a fila em referencias/fila-codex/; só execute tarefas prontas. Dúvidas resolvidas autonomamente entram no HANDOFF com a marca **(decidido sem o Alisson, revisar)**.
