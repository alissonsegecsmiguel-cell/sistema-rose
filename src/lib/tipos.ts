export type Perfil = 'administrativo' | 'atendimento';
export type LojaSelecionada = string | 'consolidado';
export interface Loja { id: string; nome: string; endereco: string }
export interface Usuario { id: string; nome: string; perfil: Perfil; lojaId: string; descricaoAcesso: string; tituloAcesso: string }
export interface FormaPagamento { id: string; nome: string; observacao?: string }
export interface Cliente { id: string; lojaId: string; nome: string; telefone: string; aniversario?: string; endereco?: string; creditoCentavos?: number; observacoes?: string; criadoEm?: string }
export interface CategoriaProduto { id: string; nome: string; ajuda?: string; ordem: number }
export type UnidadeVenda = 'unidade' | 'cento' | 'kg';
export interface Produto { id: string; nome: string; categoriaId: string; valorCentavos: number; precoDeTeste: boolean; unidadeVenda: UnidadeVenda; vendeBalcao: boolean; aceitaEncomenda: boolean; pedeObservacao: boolean; ajudaObservacao?: string; lojasDisponiveis: string[]; ativo: boolean }
export type GrupoBolo = 'formatos' | 'tamanhos' | 'massas' | 'recheios' | 'adicionais' | 'decoracoes';
export interface OpcaoBolo { id: string; nome: string; valorCentavos: number; observacao?: string; ativo: boolean; ordem: number; aConfirmar?: boolean; servePessoas?: number; pesoAproximado?: string }
export interface OpcoesBolo { id: string; formatos: OpcaoBolo[]; tamanhos: OpcaoBolo[]; massas: OpcaoBolo[]; recheios: OpcaoBolo[]; adicionais: OpcaoBolo[]; decoracoes: OpcaoBolo[]; observacao: string }
export type StatusEncomenda = 'orcamento' | 'confirmado' | 'em_producao' | 'pronto' | 'entregue' | 'cancelado';
export type SituacaoPagamento = 'pago' | 'parcial' | 'em_aberto';
export interface AjusteValor { valorOriginalCentavos: number; motivo: string }
export type ItemEncomenda = { id: string; tipo: 'bolo'; formato: string; tamanho: string; massa: string; recheios: string[]; adicionais: string[]; decoracoes: string[]; detalhes: string; valorCentavos: number; ajuste?: AjusteValor } | { id: string; tipo: 'produto'; produtoId: string; quantidade: number; observacao: string; valorUnitarioCentavos: number; unidadeVenda?: UnidadeVenda };
export interface Pagamento { id: string; data: string; formaPagamentoId: string; valorCentavos: number; tipo: 'adiantamento' | 'pagamento' | 'devolucao'; usuarioId: string; lojaId: string }
export interface EventoHistorico { id: string; data: string; usuarioId: string; acao: string; detalhe: string }
export interface Encomenda { id: string; numero: number; lojaId: string; clienteId: string; status: StatusEncomenda; dataEntrega: string; horaEntrega: string; modalidade: 'retirada' | 'entrega'; enderecoEntrega?: string; itens: ItemEncomenda[]; pagamentos: Pagamento[]; descontoCentavos: number; taxaCartaoCentavos: number; observacoes: string; historico: EventoHistorico[]; criadoEm: string; criadoPor: string; creditoCancelamentoCentavos?: number }
export interface Configuracao { id: string; nomeSistema: string; nomeMarca: string; slogan: string; logo: string; fuso: string; observacaoFuso: string; observacaoMarca: string; prototipo: boolean; noindex: boolean; limiteRecheios: number; trocoPadraoCentavos: number; categoriasLancamentoCaixa: string[] }
export interface AjusteTotal { tipo: 'valor' | 'percentual'; valor: number; motivo?: string }
export interface Rascunho { id: string; usuarioId: string; encomenda: Encomenda; desconto: AjusteTotal; taxa: AjusteTotal; origemId?: string }
export type UnidadeCompra = 'kg' | 'L' | 'un' | 'cx' | 'pct';
export type UnidadeUso = 'g' | 'ml' | 'un';
export interface CategoriaInsumo { id: string; nome: string; categoriaFinanceiraId?: string }
export interface PrecoInsumo { data: string; valorCentavos: number; origem: 'manual' | 'compra'; usuarioId?: string; referencia?: string }
export interface Insumo { id: string; nome: string; categoriaId: string; unidadeCompra: UnidadeCompra; unidadeUso: UnidadeUso; fatorConversao: number; custoAtualCentavos: number; atualizadoEm: string; estoqueMinimo: number; produtoRevendaId?: string; ativo: boolean; historicoPrecos: PrecoInsumo[] }
export type ComponenteFicha = { tipo: 'insumo'; insumoId: string; quantidade: number } | { tipo: 'ficha'; fichaId: string; quantidade: number };
export interface FichaTecnica { id: string; nome: string; tipo: 'base' | 'produto'; rendimentoQuantidade: number; rendimentoUnidade: UnidadeUso; perdaPercentual?: number; componentes: ComponenteFicha[]; modoPreparo?: string; produtoId?: string }
export interface MontagemTamanho { tamanhoId: string; gramasMassa: number; gramasRecheio: number; fixos: ComponenteFicha[] }
export interface MontagemBolo { limiteMargemPercentual: number; tamanhos: MontagemTamanho[]; vinculos: Record<string, ComponenteFicha> }
export interface Estoque { id: string; nome: string; lojaId: string; tipo: 'almoxarifado' | 'producao' | 'outro'; padraoCompras: boolean; padraoBaixas: boolean; ativo: boolean }
export type TipoMovimentoEstoque = 'entrada_compra' | 'entrada_avulsa' | 'saida_producao' | 'saida_venda' | 'transferencia' | 'ajuste_contagem' | 'retirada';
export interface MovimentoEstoque { id: string; data: string; tipo: TipoMovimentoEstoque; insumoId: string; quantidade: number; estoqueOrigemId?: string; estoqueDestinoId?: string; custoUnitarioCentavos: number; motivo?: string; descricao?: string; usuarioId: string; referencia?: { tipo: 'encomenda' | 'venda' | 'compra' | 'contagem'; id: string }; estornoDe?: string }
export interface ItemContagem { insumoId: string; saldoSistema: number; contado: number | null; diferenca: number }
export interface Contagem { id: string; estoqueId: string; data: string; status: 'rascunho' | 'concluida'; itens: ItemContagem[]; usuarioId: string; concluidaEm?: string }
export interface DadosPrototipo { configuracao: Configuracao; lojas: Loja[]; usuarios: Usuario[]; formasPagamento: FormaPagamento[]; opcoesBolo: OpcoesBolo; produtos: Produto[]; categoriasProduto: CategoriaProduto[]; clientes: Cliente[]; encomendas: Encomenda[]; rascunhos: Rascunho[]; caixas: Caixa[]; movimentosCaixa: MovimentoCaixa[]; vendas: Venda[]; categoriasInsumo: CategoriaInsumo[]; insumos: Insumo[]; fichas: FichaTecnica[]; montagemBolo: MontagemBolo; estoques: Estoque[]; movimentosEstoque: MovimentoEstoque[]; contagens: Contagem[] }
export interface SessaoPrototipo { usuarioId: string | null; lojaId: LojaSelecionada; dados: DadosPrototipo }
export interface ConferenciaCaixa { formaPagamentoId: string; esperadoCentavos: number; informadoCentavos: number; diferencaCentavos: number }
export interface Caixa { id: string; lojaId: string; data: string; abertoEm: string; abertoPor: string; trocoInicialCentavos: number; status: 'aberto' | 'fechado'; fechadoEm?: string; fechadoPor?: string; conferencia: ConferenciaCaixa[]; observacaoFechamento: string; reaberturas: { data: string; usuarioId: string; motivo: string }[] }
export interface MovimentoCaixa { id: string; caixaId: string; data: string; tipo: 'suprimento' | 'sangria' | 'lancamento_entrada' | 'lancamento_saida'; formaPagamentoId: string; valorCentavos: number; categoria: string; descricao: string; usuarioId: string }
export interface PagamentoVenda { formaPagamentoId: string; valorCentavos: number; recebidoCentavos?: number }
export interface Venda { id: string; numero: number; lojaId: string; caixaId: string; data: string; itens: Extract<ItemEncomenda, { tipo: 'produto' }>[]; descontoCentavos: number; taxaCartaoCentavos: number; pagamentos: PagamentoVenda[]; trocoCentavos: number; usuarioId: string; status: 'concluida' | 'cancelada'; motivoCancelamento?: string; historico: EventoHistorico[] }
