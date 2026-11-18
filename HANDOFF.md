# Memória do Sistema Rose

## 1. Visão do projeto

Sistema de gestão online do Ateliê Delícias da Rose, com matriz e filial: encomendas, caixa, produção, clientes, produtos, ficha técnica, estoque, compras, financeiro e relatórios. O cliente deve navegar e aprovar as telas antes da construção do back-end.

## 2. Fase atual

Protótipo visual com dados fictícios. Não há banco, autenticação real, API, servidor próprio ou integrações. A tarefa 01 entrega a estrutura; as telas de negócio começam na tarefa 02, após aprovação da 01.

## 3. Decisões registradas

- 18/11/2026: primeiro o protótipo visual; back-end só depois da aprovação do cliente.
- 18/11/2026: nota fiscal (NFC-e) continua no sistema que o cliente já usa; nosso sistema só registra a venda.
- 18/11/2026: integração com máquina de cartão fica em segundo plano; a atendente lança a forma de pagamento.
- 18/11/2026: integração com impressora térmica fica para depois.
- 18/11/2026: proposta comercial (plano, mensalidade, implantação e suporte) fora do escopo por enquanto.
- 18/11/2026: Next.js App Router + TypeScript + CSS com tokens. Back-end previsto: Supabase + Vercel, a confirmar ao começar o back-end.
- 18/11/2026: dinheiro guardado em centavos inteiros; apresentação com Intl.NumberFormat pt-BR/BRL.
- 18/11/2026: paleta extraída do logo do Ateliê Delícias da Rose (primária #B64D63); ajustar se vier manual da marca.
- 18/11/2026: o token de sucesso original #2E7D4F tinha contraste de 4,41:1 sobre #E5F3EA, abaixo de AA. Ajustado para #2B784B; os demais tons permanecem conforme a tarefa. Ajuste previsto expressamente pela regra de contraste da tarefa 01.
- 18/11/2026: decisão confirmada pelo Alisson na fila atualizada: Atendimento acessa Visão geral, Encomendas, Produção, Caixa e Clientes.
- 18/11/2026: gaveta e tabela em cartões são ativadas em largura menor ou igual a 760px. A tarefa fala em “abaixo de 760px”, mas o aceite pede gaveta também em 760px; foi priorizado o aceite. **(decidido sem o Alisson, revisar)**
- 18/11/2026: /design-system é acessível por rota direta, inclusive sem perfil; somente Administrativo tem o link no menu. Isso atende à indicação explícita de acesso direto no manual. **(decidido sem o Alisson, revisar)**
- 18/11/2026: restauração preserva perfil e loja e recria as datas relativas ao dia da restauração. Dados persistidos preservam suas datas ao recarregar, para não mudar encomendas alteradas silenciosamente. Armazenamento indisponível funciona somente em memória. **(decidido sem o Alisson, revisar)**
- 18/11/2026: Playwright é dependência exclusiva de desenvolvimento, justificada pelos testes de navegador, responsividade, foco, teclado e persistência exigidos nesta tarefa. ESLint, eslint-config-next, TypeScript e pacotes de tipos são ferramentas de desenvolvimento necessárias à tecnologia solicitada. Nenhuma biblioteca de componentes foi adicionada. **(decidido sem o Alisson, revisar)**
- 18/11/2026: instalados Next.js 16.4.6 e React 19.3.1, estáveis consultados no registro npm. Instalação manual na pasta existente, conforme a [documentação oficial](https://nextjs.org/docs/app/getting-started/installation), preservando integralmente referencias/. Inter via next/font/google.
- 18/11/2026: seleção de perfil é simulação no navegador, não uma barreira de segurança. Permissões visuais e consultas filtram a loja; validação e segurança de servidor ficam para o back-end. Fuso America/Sao_Paulo e grafia da marca estão marcados a confirmar em configuracao.json.
- 18/11/2026: o hash do commit que contém este HANDOFF é consultável com `git log -1 --format=%h -- HANDOFF.md`; o hash literal e o resultado do push ficam no relatório local após o commit, evitando autorreferência impossível no próprio commit. **(decidido sem o Alisson, revisar)**
- 18/11/2026: regras /referencias/ e /relatorios/ no .gitignore são ancoradas na raiz. A forma não ancorada também ignorava a rota legítima src/app/(sistema)/relatorios/page.tsx. As pastas locais protegidas continuam totalmente fora do Git e do deploy.
- 18/11/2026: o atalho Windows abre o navegador somente após o Next.js indicar que está pronto, usando o endereço local emitido pelo próprio Next.js. Assim, porta ocupada não leva o usuário ao serviço errado ou a uma página aberta antes do servidor iniciar. A leitura da saída utiliza somente o PowerShell integrado ao Windows. **(decidido sem o Alisson, revisar)**
- 18/11/2026: na tarefa 01-C, conforme solicitado, next-env.d.ts saiu do Git e entrou no .gitignore. É um arquivo gerado automaticamente pelo Next.js; seus caminhos podem alternar entre .next/types e .next/dev/types. Não adicionar novamente. O bloco gerenciado nextjs-agent-rules fica mantido e versionado no AGENTS.md, preservando as regras do projeto.
- 18/11/2026: em até 760px, faixa de protótipo curta com restauração por ícone e dica; barra em uma linha com menu, logo de 32px, loja e iniciais. Nome, perfil e Trocar perfil ficam no menu acessível das iniciais, fechado por Esc com retorno do foco, por toque fora ou ao sair do topo móvel. Desktop permanece visualmente igual. Os componentes e estados estão demonstrados em /design-system.

## 4. Mapa de módulos

| Módulo | O que terá |
|---|---|
| Visão geral | Encomendas do dia, resumo do caixa e produção |
| Encomendas | Lista, agenda, status, nova encomenda, orçamento, montagem do bolo, pagamento, detalhe, histórico e comanda |
| Produção | Produção diária separada por bolos e doces |
| Caixa | Abertura, fechamento, PDV, pronta-entrega, sangria e suprimento |
| Clientes | Cadastro, histórico e pendências de pagamento |
| Produtos | Produtos, categorias e opções de montagem do bolo |
| Ficha técnica | Receitas e custo calculado pelos insumos |
| Estoque | Estoques, transferências, contagem e perdas |
| Compras | Compras, fornecedores e entrada de notas |
| Financeiro | Fluxo de caixa, contas a pagar e receber e DRE |
| Relatórios | Vendas, custos, margem, estoque e produção |
| Configurações | Usuários, lojas e formas de pagamento |

## 5. Concluído

- 18/11/2026: tarefa 01 concluída no commit `ac468b883980e10325c0aedfdbd06bb0075b1996`, mensagem `Tarefa 01: estrutura inicial do protótipo`. O relatório local relatorios/fila/01-relatorio.md registra a confirmação do push.
- Entregues: regras, memória, design system e manual com os 16 componentes e estados; entrada por três perfis, menu e casca responsivos; 13 páginas de módulo apenas com cabeçalho e estado vazio; permissões visuais, seleção de loja, restauração com confirmação e persistência local; 404 e erro em português; noindex e robots.txt; 12 clientes e 20 encomendas fictícias com datas relativas em America/Sao_Paulo. Logo copiado sem alterações, com SHA-256 idêntico ao original.
- Testado: npm run lint sem erros ou avisos; builds de produção repetidos sem mudanças em arquivos de projeto; 22 testes Playwright aprovados em Chromium. Matriz de 1440, 1024, 760 e 390px nos três perfis, incluindo /entrar, /visao-geral, /encomendas e /design-system, sem rolagem horizontal. Capturas revisadas visualmente.
- Cobertura adicional: todos os módulos administrativos, bloqueio de rotas para Atendimento, redirecionamento sem perfil, troca e persistência de lojas, restauração real e cancelamento, localStorage bloqueado/corrompido, Tab/Shift+Tab/Enter/Esc em menu e diálogo, retorno do foco, setas/Home/End nas abas, campo em centavos, toast, movimento reduzido, contraste AA, 404 em português, noindex/robots, datas futuras sem divergência de hidratação, virada de ano no fuso configurado e escrita com histórico preservado. Evidências em relatorios/fila/evidencias/ (não versionadas).
- Auditoria: somente dados.ts importa os JSON; nenhuma imagem além do logo fornecido; sem API, banco, segredos ou autenticação real. Referências e relatórios locais ignorados; adição ao Git feita arquivo por arquivo.
- 18/11/2026: tarefa 01-B implementada: `abrir-prototipo.bat` na raiz, com dois cliques no Windows, instalação somente se node_modules não existir, mensagens em português/UTF-8 e abertura automática do navegador após o Next.js ficar pronto. Se 3000 estiver ocupada, mostra e abre o endereço realmente escolhido pelo Next.js. Sem novas dependências ou alterações de interface. Validação do atalho e verificações finais registradas no relatório local relatorios/fila/01B-relatorio.md após o commit.
- Testes da 01-B: execução pela associação do Windows, equivalente ao duplo clique, partindo de C:\Windows; /entrar confirmada em Chromium na porta 3000 e também em 3001 com 3000 propositalmente ocupada. Seis testes com comandos simulados aprovados: Node ausente, npm ausente, instalação inicial, dependências existentes, erro de instalação e erro do servidor; erros aguardam tecla. npm run lint, dois builds sem alteração dos 75 arquivos comparados e os 22 testes Playwright aprovados, incluindo quatro larguras e teclado. Referências/relatórios locais fora do Git. Servidores de teste encerrados.
- Durante o teste de next dev, o Next.js acrescentou um bloco gerenciado ao AGENTS.md por detectar o agente; somente essa alteração automática foi restaurada, sem alterar as regras originais. next-env.d.ts foi regenerado pelo dev e voltou ao conteúdo original com o build. O commit da 01-B contém somente o atalho, README.md e este HANDOFF.md.
- 18/11/2026: tarefa 01-C concluída: topo compacto móvel, menu de usuário por iniciais, dica acessível de restauração, rótulo compacto da seleção e manual atualizado para os três perfis. next-env.d.ts removido apenas do índice e ignorado; bloco nextjs-agent-rules mantido no AGENTS.md. Sem novas dependências ou mudanças de negócio.
- Testes da 01-C: npm run lint e npm run build aprovados; 23 testes Playwright aprovados, incluindo as quatro larguras, três perfis, ausência de rolagem horizontal, controles de ao menos 44px, restauração, troca de perfil, toque, foco e Esc. Título começa em 129px nos três perfis em 390px e 760px, antes começava em cerca de 296px no Administrativo em 390px. Capturas de desktop em 1440px e 1024px idênticas pixel a pixel às anteriores nos três perfis. Evidências em relatorios/fila/evidencias-01C/. Relatório local 01C-relatorio.md registra hash, push e conferência final do ciclo dev → build após o commit.

- 18/11/2026: tarefa 01C concluída. Complemento da fila atualizada: Atendimento acessa Produção; menus, perfis de teste e manual atualizados. Topo compacto e arquivos gerados já estavam concluídos e foram preservados. Restauração inclui title acessível. Validação: lint, dois builds sem alterações inesperadas e 23 testes aprovados. Commit identificado pela mensagem “Tarefa 01C: Ajustes da conferência da tarefa 01”; hash literal no relatório local 01C-relatorio.md.

## 6. Em andamento

- Execução da fila 01B a 16 autorizada pelo Alisson em 18/11/2026. Retomar pela primeira tarefa pronta sem conclusão no RESUMO.md.

## 7. Backlog

- Sem bloqueios conhecidos. A fila 01B a 16 está autorizada; seguir a ordem e as dependências de 00-LEIA-PRIMEIRO.md.

## 8. Perguntas em aberto para o cliente

- Adiantamento entra no caixa do dia em que foi pago? Recomendação: sim, no dia do recebimento.
- Sangria e suprimento: existe mais de um caixa por loja ou a transferência é entre lojas?
- Qual a lista completa de tamanhos, recheios, adicionais e decorações, com preços?
- “Vale” é forma de pagamento usada?
- Grafia oficial: “Delícias” com acento ou “delicias” como no logo?
- Existe logo em alta resolução ou vetor (SVG, PDF, AI)?

## 9. Pendências do cliente

Cardápio com preços, lista de insumos, fichas técnicas existentes, taxas da maquininha, nomes dos estoques, quantidade de usuários por loja, sistema que usam hoje para migrar dados e modelo da impressora térmica.

## 10. Como rodar o projeto

Node.js >=20.9 e npm. Execute `npm install`, `npm run dev` e abra http://localhost:3000. Escolha um dos perfis de teste. Manual em /design-system. A faixa superior restaura os dados mediante confirmação. A chave local é `sistema-rose-prototipo-v1`, protegida por try/catch.

No Windows, também é possível dar dois cliques em `abrir-prototipo.bat`, na raiz do projeto. O atalho entra na própria pasta, verifica Node/npm, instala somente quando não há node_modules, inicia o servidor e abre o navegador no endereço escolhido pelo Next.js. Aguarde a mensagem “Protótipo rodando. Para parar, feche esta janela.” Para encerrar, feche essa janela. Se 3000 estiver ocupada, use o endereço mostrado; o atalho já abre esse endereço automaticamente. O acompanhamento da saída usa o PowerShell integrado ao Windows, sem dependências adicionais.

Verificações: `npm run lint`, `npm run build` e `npm test`. Na primeira execução dos testes: `npx playwright install chromium`. Os testes iniciam o build de produção na porta 3100; não mantenha outro serviço nessa porta. Evidências e relatórios ficam em relatorios/fila/, ignorado pelo Git. Vercel utiliza a configuração padrão do Next.js, sem variáveis de ambiente.

next-env.d.ts é gerado pelo Next.js e permanece fora do Git. O bloco nextjs-agent-rules em AGENTS.md está versionado. Rodar dev, parar e depois rodar build não deve alterar arquivos versionados.
