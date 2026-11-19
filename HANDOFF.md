# Memória do Sistema Rose

## 1. Visão do projeto

Sistema de gestão online do Ateliê Delícias da Rose, com matriz e filial: encomendas, caixa, produção, clientes, produtos, ficha técnica, estoque, compras, financeiro e relatórios. O cliente deve navegar e aprovar as telas antes da construção do back-end.

## 2. Fase atual

Protótipo visual com dados fictícios. Não há banco, autenticação real, API, servidor próprio ou integrações. A fila 01B a 16 foi autorizada em 18/11/2026; as telas de negócio estão sendo implementadas na ordem da fila.

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

- 18/11/2026: filtros da lista, seleção da agenda e retorno do detalhe são preservados no endereço; a semana começa na segunda-feira. Em 390px, cada dia ocupado identifica a semana, dispensando a grade comprimida. **(decidido sem o Alisson, revisar)**

- 18/11/2026: adiantamentos contam no dia do recebimento, inclusive para encomendas futuras; limite inicial de dois recheios. Ambas as regras aguardam confirmação do cliente. Percentuais incidem sobre o subtotal (desconto) e valor após desconto (taxa), com arredondamento por centavo. A loja fica bloqueada após incluir itens ou pagamentos para evitar transferências silenciosas; remova-os antes de trocar. Rascunhos são separados por usuário e loja. **(decidido sem o Alisson, revisar)**

- 18/11/2026: cancelamento com devolução parcial mantém a diferença como crédito, informado no diálogo e histórico. Corrigir um pagamento cancelado recalcula esse crédito sem duplicá-lo. Impressão de 80mm usa folha de 80 × 297mm na prévia; o corte contínuo depende do driver da impressora, integração ainda fora do escopo. **(decidido sem o Alisson, revisar)**

- 18/11/2026: clientes compartilhados entre lojas; lojaId identifica o cadastro, sem filtrar a lista. Recorrência exige dois pedidos entregues ou retirados nos últimos seis meses; gasto e ticket consideram somente pedidos finalizados. Histórico do cliente identifica ambas as lojas; o detalhe de encomenda preserva a restrição à loja selecionada. **(decidido sem o Alisson, revisar)**

- 18/11/2026: um caixa por loja e dia; sangria retira dinheiro e suprimento repõe troco. Pagamentos podem ser registrados antes da abertura, entram quando o caixa é aberto e ficam bloqueados após o fechamento; reabertura exige Administrativo e motivo. Transferência entre caixas aguarda confirmação do cliente. Datas dos pagamentos fictícios foram limitadas a hoje para não simular recebimentos futuros já realizados. **(decidido sem o Alisson, revisar)**

- 18/11/2026: Produção agrupa o período Próximos 3 dias como hoje e os dois dias seguintes; observações de doces são agrupadas exatamente como cadastradas. Status é da encomenda inteira, mesmo quando há vários bolos. Função aoMarcarPronto registra histórico e baixa o estoque desde a tarefa 11. **(decidido sem o Alisson, revisar)**

- 18/11/2026: catálogo único de produtos, com preço igual nas duas lojas e campo Disponível em; ids sem sufixo de loja nas encomendas e vendas de teste. **(decidido sem o Alisson, revisar: preços diferentes por loja?)**

- 18/11/2026: produtos e opções do bolo são inativados, nunca excluídos; inativos somem da nova encomenda e do PDV, mas pedidos antigos mantêm nome e valor. Opção inativa já escolhida continua visível ao alterar o pedido, com selo. Mudar a unidade de venda de produto já usado é bloqueado (crie outro produto). Quantidade continua inteira também para cento e kg. Ajuda da observação: texto do produto ou, em branco, o da categoria. Categoria com produtos, inclusive inativos, não pode ser excluída. Pré-visualização da montagem fica abaixo das regras gerais, em coluna única, para as tabelas caberem. **(decidido sem o Alisson, revisar)**

- 18/11/2026: Quadro de encomendas usa as mesmas regras de status: avançar várias etapas grava o histórico de cada etapa e um evento com as etapas puladas; voltar qualquer número de etapas pede motivo. Em 760px ou menos as colunas viram abas (mesmo limite da gaveta). Orçamentos com data passada também aparecem como atrasados. Encomenda movida para Entregues com data fora do período sai do quadro, como pede a regra da coluna. O arraste começa fora do link e dos botões do cartão e rola o quadro ao chegar perto da borda. **(decidido sem o Alisson, revisar)**

- 19/11/2026: ficha técnica calcula custos na hora pelo custo atual (sem custo guardado). Perda soma ao custo final (total × (1 + perda)). Recheios dividem igualmente as gramas do tamanho. Red velvet e Cenoura usam a ficha da massa branca até haver ficha própria. Tabela de combinações usa cada tamanho com cada massa e o primeiro recheio ativo. Custo da encomenda compara itens após desconto, sem taxa de cartão e sem mão de obra. Insumos, fichas, gramas e fixos são de teste. Chave local v7. **(decidido sem o Alisson, revisar)**

- 19/11/2026: baixa de insumos ao marcar Pronto, do estoque padrão de baixas da loja, pela ficha técnica; voltar de Pronto ou Entregue para antes de Pronto estorna com movimentos negativos. **(decidido sem o Alisson, revisar: baixar ao marcar Pronto ou ao Iniciar produção?)**

- 19/11/2026: saldo sempre calculado pelos movimentos; transferência é um único movimento com origem e destino. Abaixo do mínimo compara o total da loja (todos os estoques) com o mínimo do insumo; no Consolidado vale se alguma loja estiver abaixo. Perdas contam Desperdício, Vencimento e Quebra ou dano pelo custo do dia do registro. Contagem ajusta só os itens contados, com diferença pelo saldo no momento da conclusão. Venda no PDV baixa do estoque de produção da loja; cancelamento estorna. Estoque padrão não pode ser inativado. Chave local v8. **(decidido sem o Alisson, revisar)**

- 19/11/2026: compra atualiza o custo do insumo pelo valor unitário da nota, sem ratear frete e desconto; frete e desconto entram só nas contas a pagar, rateados por categoria. Contas a pagar usam a categoria do insumo como referência provisória até a tarefa 13; itens sem estoque escolhem categoria (criada Limpeza e higiene). À vista gera conta já paga. Vínculos são memorizados por fornecedor e descrição exata da nota; sem vínculo, sugere pelo nome parecido. XML lido no navegador com DOMParser; os testes de unidade usam um leitor mínimo equivalente. Histórico de compras de teste termina exatamente no custo atual de cada insumo, para não mudar os custos das tarefas anteriores. Chave local v9. **(decidido sem o Alisson, revisar)**

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

- 18/11/2026: tarefa 02 concluída. Painel por loja e consolidado, indicadores, filtro de modalidade, próximos sete dias, alertas e aniversariantes. Faixa de dias documentada no manual. Validação: lint, dois builds sem alterações inesperadas e 25 testes aprovados. Commit identificado pela mensagem “Tarefa 02: Visão geral (painel do dia)”; hash literal no relatório local 02-relatorio.md.

- 18/11/2026: tarefa 03 concluída. Lista com filtros combinados e totais; agenda mensal responsiva, detalhe com valores e histórico, retorno aos filtros e permissões por segmento. Componentes documentados e testados nos três perfis e quatro larguras. Validação: lint, dois builds sem alterações inesperadas e 39 testes aprovados. Commit identificado pela mensagem “Tarefa 03: Encomendas (lista, agenda e detalhe)”; hash literal no relatório local 03-relatorio.md.

- 18/11/2026: tarefa 04 concluída. Formulário completo com montagem de bolo, múltiplos produtos, cadastro rápido, rascunhos persistentes, ajustes justificados, desconto, taxa e adiantamentos. Pedido misto do exemplo e salvamento de dois rascunhos conferidos. Chave local v2. Validação: lint, dois builds sem alterações inesperadas e 53 testes aprovados. Commit identificado pela mensagem “Tarefa 04: Nova encomenda e orçamento”; hash literal no relatório local 04-relatorio.md.

- 18/11/2026: tarefa 05 concluída. Status com histórico, edição reutilizando formulário sem alterar pagamentos, cancelamento com devolução negativa ou crédito, registro e correção de pagamentos. Comandas sem valores e comprovante em 80mm e A4; fluxo orçamento até retirada testado nos três perfis e quatro larguras. Chave v3. Validação: lint, dois builds sem alterações inesperadas e 56 testes aprovados. Commit identificado pela mensagem “Tarefa 05: Ações da encomenda, histórico e comandas”; hash literal no relatório local 05-relatorio.md.

- 18/11/2026: tarefa 06 concluída. Cadastro compartilhado, busca e filtros de recorrência, pendência e aniversário; histórico de encomendas e pagamentos, crédito, indicadores e WhatsApp em nova aba. Cadastro e edição reutilizam o formulário, com duplicidade de telefone. Três clientes recorrentes e dois aniversariantes relativos no seed. Chave v4. Validação: lint, dois builds sem alterações inesperadas e 69 testes aprovados. Commit identificado pela mensagem “Tarefa 06: Clientes”; hash literal no relatório local 06-relatorio.md.

- Teste adicional da tarefa 07: Consolidado somente leitura, seis caixas históricos em leitura e saídas de impressão do fechamento em 80mm/A4 e do cupom não fiscal aprovados. Execução isolada registrada em relatorios/fila/evidencias-07/teste-extra.json; soma-se à suíte completa da tarefa.

- 18/11/2026: tarefa 07 concluída. Caixa por loja e dia, PDV com pagamento dividido e troco, movimentos, conferência e fechamento com diferença justificada. Pagamentos de encomendas lidos sem duplicação; correções bloqueadas após fechar e liberadas pela reabertura administrativa. Histórico e impressão de fechamento e cupom não fiscal. Chave v5. Validação: lint, dois builds sem alterações inesperadas e 83 testes aprovados. Commit identificado pela mensagem “Tarefa 07: Caixa e frente de caixa (PDV)”; hash literal no relatório local 07-relatorio.md.

- 18/11/2026: tarefa 08 concluída. Produção por data e período, cartões por bolo, agrupamento exato de doces e separação de bebidas/festa. Status e histórico compartilhados com encomendas, comandas do dia em 80mm/A4 e cartão na Visão geral. Dois casos fictícios de produção múltipla adicionados; manual e tokens atualizados. Validação: lint, dois builds sem alterações inesperadas e 96 testes aprovados. Commit identificado pela mensagem “Tarefa 08: Produção do dia”; hash literal no relatório local 08-relatorio.md.

- 18/11/2026: tarefa 09 concluída. Tela /produtos com abas Produtos, Categorias e Montagem do bolo; catálogo único com Disponível em, canais balcão/encomenda, unidade de venda e observação por produto; categorias ordenáveis; opções do bolo com ativo, ordem, a confirmar, rendimento dos tamanhos e limite de recheios; pré-visualização com as mesmas pílulas. Nova encomenda e PDV leem o catálogo; pedidos antigos preservados. Chave v6. Validação: lint, dois builds sem alterações inesperadas e 104 testes aprovados. Commit identificado pela mensagem “Tarefa 09: Produtos e opções do bolo”; hash literal no relatório local 09-relatorio.md.

- 18/11/2026: tarefa 08B concluída. Aba Quadro em /encomendas com cinco colunas por status, quantidade e valor; cartões com prazo Hoje/Atrasada, alertas, modalidade, pagamento e saldo. Arraste por eventos de ponteiro acima de 760px e botão Mover para em todas as larguras, com confirmação de conversão, etapas puladas, motivo para voltar e diálogo de saldo. Abas por coluna no celular; filtros de período, modalidade e busca. QuadroKanban no manual. Validação: lint, dois builds sem alterações inesperadas e 118 testes aprovados. Commit identificado pela mensagem “Tarefa 08B: Quadro de encomendas (kanban)”; hash literal no relatório local 08B-relatorio.md.

- 18/11/2026: tarefa 10 concluída. Tela /ficha-tecnica com abas Fichas, Insumos e Custo do bolo; 34 insumos e 9 fichas de teste (6 base, 3 de produto), ficha dentro de ficha, bloqueio de ciclo, perda e custo por unidade; histórico de preços com confirmação e mini gráfico SVG; detalhe com árvore expansível e onde a ficha é usada; simulador de custo e margem do bolo, tabela por tamanho e massa com destaque de margem baixa e montagem por tamanho editável; custo estimado no detalhe da encomenda para o Administrativo. Funções puras em src/lib/custos.ts. Chave v7. Validação: lint, dois builds sem alterações inesperadas e 126 testes aprovados. Commit identificado pela mensagem “Tarefa 10: Insumos e ficha técnica”; hash literal no relatório local 10-relatorio.md.

- 19/11/2026: tarefa 11 concluída. Tela /estoque com abas Saldos, Movimentações, Transferir, Entrada ou retirada, Contagem, Perdas e Estoques; 4 estoques e 60 dias de movimentos de teste com contagem concluída e desperdícios. Transferência entre estoques e lojas com aviso e confirmação de saldo negativo; retirada com motivo e descrição obrigatória no desperdício; contagem com saldo escondido, rascunho, diferenças, ajustes e folha A4; painel de perdas com barras SVG. Baixa automática ao marcar Pronto e na venda do PDV, com estorno ao voltar etapa ou cancelar venda e aviso de item sem ficha. Saldos e movimentos no detalhe do insumo e cartão de mínimo na Visão geral. Funções em src/lib/estoque.ts. Chave v8. Validação: lint, dois builds sem alterações inesperadas e 135 testes aprovados. Commit identificado pela mensagem “Tarefa 11: Estoque”; hash literal no relatório local 11-relatorio.md.

- 19/11/2026: tarefa 12 concluída. Tela /compras com abas Compras, Nova compra, Fornecedores e Preços; leitura de NF-e no navegador (src/lib/nfe.ts) com dois XMLs fictícios em public/exemplos e botão de exemplo; notinha avulsa no mesmo formulário de conferência, com vínculo a insumo, conversão por extenso, novo custo e itens fora do estoque; lançamento gera entradas no almoxarifado, custo e histórico de compra, vínculos memorizados e contas a pagar por categoria com as mesmas parcelas. Detalhes de compra e fornecedor, preços com variação e alerta acima de 10%. 6 fornecedores e 25 compras de teste. Chave v9. Validação: lint, dois builds sem alterações inesperadas e 144 testes aprovados. Commit identificado pela mensagem “Tarefa 12: Compras e fornecedores”; hash literal no relatório local 12-relatorio.md.

## 6. Em andamento

- Execução da fila 01B a 16 autorizada pelo Alisson em 18/11/2026. Retomar pela primeira tarefa pronta sem conclusão no RESUMO.md.

## 7. Backlog

- Sem bloqueios conhecidos. A fila 01B a 16 está autorizada; seguir a ordem e as dependências de 00-LEIA-PRIMEIRO.md.

## 8. Perguntas em aberto para o cliente

- Adiantamento entra no caixa do dia em que foi pago? Recomendação: sim, no dia do recebimento.
- Sangria e suprimento: existe mais de um caixa por loja ou a transferência é entre lojas?
- Qual a lista completa de tamanhos, recheios, adicionais e decorações, com preços?
- “Vale” é forma de pagamento usada?
- Os preços dos produtos variam entre Matriz e Filial?
- Quantos recheios cabem por bolo, e o rendimento (pessoas e peso) de cada tamanho?
- Quais são as fichas técnicas reais (ingredientes e rendimentos) e quantos gramas de massa e de recheio vão em cada tamanho?
- Qual margem mínima o dono considera aceitável (hoje 50% no protótipo)?
- Quais estoques existem em cada loja (nomes) e qual o estoque mínimo de cada insumo?
- Quais fornecedores e prazos usam hoje? As notas chegam em XML para todos os fornecedores?
- Grafia oficial: “Delícias” com acento ou “delicias” como no logo?
- Existe logo em alta resolução ou vetor (SVG, PDF, AI)?

## 9. Pendências do cliente

Cardápio com preços, lista de insumos, fichas técnicas existentes, taxas da maquininha, nomes dos estoques, quantidade de usuários por loja, sistema que usam hoje para migrar dados e modelo da impressora térmica.

## 10. Como rodar o projeto

Node.js >=20.9 e npm. Execute `npm install`, `npm run dev` e abra http://localhost:3000. Escolha um dos perfis de teste. Manual em /design-system. A faixa superior restaura os dados mediante confirmação. A chave local é `sistema-rose-prototipo-v9`, protegida por try/catch; a versão 9 traz fornecedores, compras, vínculos e contas a pagar.

No Windows, também é possível dar dois cliques em `abrir-prototipo.bat`, na raiz do projeto. O atalho entra na própria pasta, verifica Node/npm, instala somente quando não há node_modules, inicia o servidor e abre o navegador no endereço escolhido pelo Next.js. Aguarde a mensagem “Protótipo rodando. Para parar, feche esta janela.” Para encerrar, feche essa janela. Se 3000 estiver ocupada, use o endereço mostrado; o atalho já abre esse endereço automaticamente. O acompanhamento da saída usa o PowerShell integrado ao Windows, sem dependências adicionais.

Verificações: `npm run lint`, `npm run build` e `npm test`. Na primeira execução dos testes: `npx playwright install chromium`. Os testes iniciam o build de produção na porta 3100; não mantenha outro serviço nessa porta. Evidências e relatórios ficam em relatorios/fila/, ignorado pelo Git. Vercel utiliza a configuração padrão do Next.js, sem variáveis de ambiente.

next-env.d.ts é gerado pelo Next.js e permanece fora do Git. O bloco nextjs-agent-rules em AGENTS.md está versionado. Rodar dev, parar e depois rodar build não deve alterar arquivos versionados.
