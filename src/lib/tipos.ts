export type Perfil = 'administrativo' | 'atendimento';
export type LojaSelecionada = string | 'consolidado';
export interface Loja { id: string; nome: string; endereco: string }
export interface Usuario { id: string; nome: string; perfil: Perfil; lojaId: string; descricaoAcesso: string; tituloAcesso: string }
export interface FormaPagamento { id: string; nome: string; observacao?: string }
export interface Cliente { id: string; lojaId: string; nome: string; telefone: string; aniversario?: string; endereco?: string }
export interface CategoriaProduto { id: string; nome: string }
export interface Produto { id: string; lojaId: string; nome: string; categoriaId: string; valorCentavos: number; precoDeTeste: boolean }
export interface OpcaoBolo { id: string; nome: string; valorCentavos: number; observacao?: string }
export interface OpcoesBolo { id: string; formatos: OpcaoBolo[]; tamanhos: OpcaoBolo[]; massas: OpcaoBolo[]; recheios: OpcaoBolo[]; adicionais: OpcaoBolo[]; decoracoes: OpcaoBolo[]; observacao: string }
export type StatusEncomenda = 'orcamento' | 'confirmado' | 'em_producao' | 'pronto' | 'entregue' | 'cancelado';
export type SituacaoPagamento = 'pago' | 'parcial' | 'em_aberto';
export type ItemEncomenda = { id: string; tipo: 'bolo'; formato: string; tamanho: string; massa: string; recheios: string[]; adicionais: string[]; decoracoes: string[]; detalhes: string; valorCentavos: number } | { id: string; tipo: 'produto'; produtoId: string; quantidade: number; observacao: string; valorUnitarioCentavos: number };
export interface Pagamento { id: string; data: string; formaPagamentoId: string; valorCentavos: number; tipo: 'adiantamento' | 'pagamento'; usuarioId: string; lojaId: string }
export interface EventoHistorico { id: string; data: string; usuarioId: string; acao: string; detalhe: string }
export interface Encomenda { id: string; numero: number; lojaId: string; clienteId: string; status: StatusEncomenda; dataEntrega: string; horaEntrega: string; modalidade: 'retirada' | 'entrega'; enderecoEntrega?: string; itens: ItemEncomenda[]; pagamentos: Pagamento[]; descontoCentavos: number; taxaCartaoCentavos: number; observacoes: string; historico: EventoHistorico[]; criadoEm: string; criadoPor: string }
export interface Configuracao { id: string; nomeSistema: string; nomeMarca: string; slogan: string; logo: string; fuso: string; observacaoFuso: string; observacaoMarca: string; prototipo: boolean; noindex: boolean }
export interface DadosPrototipo { configuracao: Configuracao; lojas: Loja[]; usuarios: Usuario[]; formasPagamento: FormaPagamento[]; opcoesBolo: OpcoesBolo; produtos: Produto[]; categoriasProduto: CategoriaProduto[]; clientes: Cliente[]; encomendas: Encomenda[] }
export interface SessaoPrototipo { usuarioId: string | null; lojaId: LojaSelecionada; dados: DadosPrototipo }
