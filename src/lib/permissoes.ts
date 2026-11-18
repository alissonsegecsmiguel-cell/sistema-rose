import type { Perfil } from './tipos';

export const modulos = [
  { rota: '/visao-geral', titulo: 'Visão geral', icone: 'painel', atendimento: true, texto: 'Aqui vão aparecer as encomendas de hoje, o resumo do caixa e o que a produção precisa fazer.' },
  { rota: '/encomendas', titulo: 'Encomendas', icone: 'encomenda', atendimento: true, texto: 'Aqui vão ficar a lista e a agenda de encomendas, com status e situação de pagamento.' },
  { rota: '/producao', titulo: 'Produção', icone: 'producao', atendimento: true, texto: 'Aqui vai aparecer o que precisa ser produzido em cada dia, separado por bolos e doces.' },
  { rota: '/caixa', titulo: 'Caixa', icone: 'caixa', atendimento: true, texto: 'Aqui vão ficar a abertura e o fechamento do caixa, vendas de pronta-entrega, sangria e suprimento.' },
  { rota: '/clientes', titulo: 'Clientes', icone: 'clientes', atendimento: true, texto: 'Aqui vão ficar o cadastro dos clientes, o histórico de pedidos e as pendências de pagamento.' },
  { rota: '/produtos', titulo: 'Produtos', icone: 'produto', atendimento: false, texto: 'Aqui vão ficar os produtos, as categorias e as opções de montagem do bolo.' },
  { rota: '/ficha-tecnica', titulo: 'Ficha técnica', icone: 'ficha', atendimento: false, texto: 'Aqui vão ficar as fichas técnicas, com custo calculado a partir dos insumos.' },
  { rota: '/estoque', titulo: 'Estoque', icone: 'estoque', atendimento: false, texto: 'Aqui vão ficar os estoques, as transferências, a contagem mensal e o controle de perdas.' },
  { rota: '/compras', titulo: 'Compras', icone: 'compras', atendimento: false, texto: 'Aqui vão ficar as compras, os fornecedores e a entrada de notas.' },
  { rota: '/financeiro', titulo: 'Financeiro', icone: 'financeiro', atendimento: false, texto: 'Aqui vão ficar o fluxo de caixa, as contas a pagar e a receber e o DRE.' },
  { rota: '/relatorios', titulo: 'Relatórios', icone: 'relatorios', atendimento: false, texto: 'Aqui vão ficar os relatórios de vendas, custos, margem, estoque e produção.' },
  { rota: '/configuracoes', titulo: 'Configurações', icone: 'configuracoes', atendimento: false, texto: 'Aqui vão ficar os usuários, as lojas e as formas de pagamento.' },
] as const;
export const novaEncomenda = { rota: '/encomendas/nova', titulo: 'Nova encomenda', icone: 'encomenda', atendimento: true, texto: 'Aqui vai ficar o cadastro de encomendas e orçamentos, com a montagem do bolo e os outros itens.' };
export function menuDoPerfil(perfil: Perfil) { return modulos.filter(m => perfil === 'administrativo' || m.atendimento); }
export function podeAcessar(perfil: Perfil, rota: string) {
  if (rota === '/design-system') return true; // Manual público por rota direta, conforme a tarefa.
  const modulo = [...modulos, novaEncomenda].find(m => m.rota === rota);
  return !!modulo && (perfil === 'administrativo' || modulo.atendimento);
}
