import configuracao from '@/dados-teste/configuracao.json';
import lojas from '@/dados-teste/lojas.json';
import usuarios from '@/dados-teste/usuarios.json';
import formas from '@/dados-teste/formas-pagamento.json';
import opcoes from '@/dados-teste/opcoes-bolo.json';
import produtos from '@/dados-teste/produtos.json';
import categorias from '@/dados-teste/categorias-produto.json';
import clientes from '@/dados-teste/clientes.json';
import encomendas from '@/dados-teste/encomendas.json';
import type { Cliente, DadosPrototipo, Encomenda, EventoHistorico, ItemEncomenda, LojaSelecionada, Rascunho, SessaoPrototipo, SituacaoPagamento } from './tipos';

export const CHAVE_ARMAZENAMENTO = 'sistema-rose-prototipo-v2';
export function obterConfiguracao() { return configuracao; }
export function listarPerfisDeTeste() { return carregarDadosDeTeste().usuarios; }

// Calcula a data civil no fuso configurado, sem depender do fuso do navegador.
export function dataRelativa(dias: number, agora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: configuracao.fuso, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(agora);
  const parte = (tipo: string) => Number(partes.find(p => p.type === tipo)?.value);
  const data = new Date(Date.UTC(parte('year'), parte('month') - 1, parte('day') + dias, 12));
  return data.toISOString().slice(0, 10);
}

export function carregarDadosDeTeste(): DadosPrototipo {
  return structuredClone({
    configuracao, lojas: lojas.itens, usuarios: usuarios.itens, formasPagamento: formas.itens, rascunhos: [],
    opcoesBolo: opcoes, produtos: produtos.itens, categoriasProduto: categorias.itens, clientes: clientes.itens,
    encomendas: encomendas.itens.map(e => ({ ...e,
      dataEntrega: dataRelativa(e.diasAPartirDeHoje),
      criadoEm: `${dataRelativa(e.diasAPartirDeHoje - 7)}T12:00:00-03:00`,
      pagamentos: e.pagamentos.map(p => ({ ...p, data: `${dataRelativa(e.diasAPartirDeHoje - 3)}T10:00:00-03:00` })),
      historico: e.historico.map(h => ({ ...h, data: `${dataRelativa(e.diasAPartirDeHoje - 7)}T12:00:00-03:00` })),
    })),
  }) as DadosPrototipo;
}

function daLoja<T extends { lojaId: string }>(registros: T[], lojaId: LojaSelecionada) {
  return registros.filter(registro => lojaId === 'consolidado' || registro.lojaId === lojaId);
}
export function listarEncomendas(dados: DadosPrototipo, lojaId: LojaSelecionada) { return daLoja(dados.encomendas, lojaId); }
export function obterEncomenda(dados: DadosPrototipo, lojaId: LojaSelecionada, id: string) { return listarEncomendas(dados, lojaId).find(e => e.id === id); }
export function listarClientes(dados: DadosPrototipo, lojaId: LojaSelecionada) { return daLoja(dados.clientes, lojaId); }
export function obterCliente(dados: DadosPrototipo, lojaId: LojaSelecionada, id: string) { return listarClientes(dados, lojaId).find(c => c.id === id); }
export function listarProdutos(dados: DadosPrototipo, lojaId: LojaSelecionada) { return daLoja(dados.produtos, lojaId); }
export function listarLojas(dados: DadosPrototipo) { return dados.lojas; }
export function listarUsuarios(dados: DadosPrototipo, lojaId: LojaSelecionada) { return daLoja(dados.usuarios, lojaId); }
export function obterUsuario(dados: DadosPrototipo, id: string | null) { return dados.usuarios.find(u => u.id === id); }
export function listarFormasPagamento(dados: DadosPrototipo) { return dados.formasPagamento; }
export function listarCategoriasProduto(dados: DadosPrototipo) { return dados.categoriasProduto; }
export function obterOpcoesBolo(dados: DadosPrototipo) { return dados.opcoesBolo; }
export function totalEncomenda(e: Encomenda) {
  return e.itens.reduce((s, i) => s + (i.tipo === 'bolo' ? i.valorCentavos : i.quantidade * i.valorUnitarioCentavos), 0) - e.descontoCentavos + e.taxaCartaoCentavos;
}
export function situacaoPagamento(e: Encomenda): SituacaoPagamento {
  const pago = e.pagamentos.reduce((s, p) => s + p.valorCentavos, 0);
  return pago >= totalEncomenda(e) ? 'pago' : pago > 0 ? 'parcial' : 'em_aberto';
}
export function saldoEncomenda(e: Encomenda) { return Math.max(0, totalEncomenda(e) - e.pagamentos.reduce((s, p) => s + p.valorCentavos, 0)); }
export function descricaoBolo(dados: DadosPrototipo, item: Extract<ItemEncomenda, { tipo: 'bolo' }>) {
  const o = dados.opcoesBolo;
  const nome = (lista: { id: string; nome: string }[], id: string) => lista.find(x => x.id === id)?.nome ?? id;
  return `Bolo ${nome(o.tamanhos, item.tamanho)}, ${nome(o.formatos, item.formato)}, massa ${nome(o.massas, item.massa)}, recheios: ${item.recheios.map(id => nome(o.recheios, id)).join(' e ')}${item.adicionais.length ? `, adicionais: ${item.adicionais.map(id => nome(o.adicionais, id)).join(', ')}` : ''}${item.decoracoes.length ? `, decoração: ${item.decoracoes.map(id => nome(o.decoracoes, id)).join(', ')}` : ''}${item.detalhes ? `. ${item.detalhes}` : ''}`;
}
export function resumirItens(dados: DadosPrototipo, e: Encomenda) {
  return e.itens.map(i => i.tipo === 'bolo' ? `Bolo ${dados.opcoesBolo.tamanhos.find(t => t.id === i.tamanho)?.nome ?? i.tamanho}` : `${i.quantidade} ${dados.produtos.find(p => p.id === i.produtoId)?.nome ?? 'Produto indisponível'}`).join(' + ');
}
export function encomendasDoDia(dados: DadosPrototipo, lojaId: LojaSelecionada, data = dataRelativa(0)) {
  return listarEncomendas(dados, lojaId).filter(e => e.dataEntrega === data && !['cancelado', 'orcamento'].includes(e.status)).sort((a, b) => a.horaEntrega.localeCompare(b.horaEntrega));
}
export function resumoDoDia(dados: DadosPrototipo, lojaId: LojaSelecionada) {
  const hoje = dataRelativa(0), lista = encomendasDoDia(dados, lojaId, hoje);
  return { quantidade: lista.length, saldoCentavos: lista.reduce((s, e) => s + saldoEncomenda(e), 0), orcamentos: listarEncomendas(dados, lojaId).filter(e => e.status === 'orcamento' && e.dataEntrega >= hoje).length };
}
export function proximosDias(dados: DadosPrototipo, lojaId: LojaSelecionada) {
  return Array.from({ length: 7 }, (_, i) => { const data = dataRelativa(i + 1); return { data, quantidade: encomendasDoDia(dados, lojaId, data).length }; });
}
export function alertasDoDia(dados: DadosPrototipo, lojaId: LojaSelecionada) {
  return listarEncomendas(dados, lojaId).filter(e => (e.dataEntrega === dataRelativa(1) && !['cancelado', 'orcamento'].includes(e.status) && saldoEncomenda(e) > 0) || (e.status === 'orcamento' && e.dataEntrega >= dataRelativa(0) && e.dataEntrega <= dataRelativa(3))).map(e => ({ id: e.id, texto: `#${e.numero} • ${obterCliente(dados, lojaId, e.clienteId)?.nome} • ${e.status === 'orcamento' ? 'Orçamento aguardando confirmação' : 'Pagamento pendente para amanhã'}` }));
}
export function aniversariantes(dados: DadosPrototipo, lojaId: LojaSelecionada) {
  const dias = Array.from({ length: 7 }, (_, i) => dataRelativa(i));
  return listarClientes(dados, lojaId).flatMap(c => { const data = dias.find(d => d.slice(5) === c.aniversario?.slice(5)); return data ? [{ ...c, proximoAniversario: data }] : []; }).sort((a, b) => a.proximoAniversario.localeCompare(b.proximoAniversario));
}
export function limitesPeriodo(periodo: string, inicial = '', final = '') {
  const hoje = dataRelativa(0), d = new Date(`${hoje}T12:00:00Z`), iso = (v: Date) => v.toISOString().slice(0, 10);
  if (periodo === 'amanha') return [dataRelativa(1), dataRelativa(1)];
  if (periodo === 'semana') { const segunda = (d.getUTCDay() + 6) % 7; return [dataRelativa(-segunda), dataRelativa(6 - segunda)]; }
  if (periodo === 'mes' || periodo === 'proximo') { const mes = d.getUTCMonth() + (periodo === 'proximo' ? 1 : 0); return [iso(new Date(Date.UTC(d.getUTCFullYear(), mes, 1))), iso(new Date(Date.UTC(d.getUTCFullYear(), mes + 1, 0)))]; }
  return periodo === 'personalizado' ? [inicial, final] : [hoje, hoje];
}
export function filtrarEncomendas(dados: DadosPrototipo, lojaId: LojaSelecionada, filtros: { inicio?: string; fim?: string; busca?: string; status?: string[]; pagamento?: string; modalidade?: string; inverter?: boolean }) {
  const busca = filtros.busca?.toLocaleLowerCase('pt-BR').trim() ?? '', digitos = busca.replace(/\D/g, '');
  return listarEncomendas(dados, lojaId).filter(e => {
    const c = obterCliente(dados, lojaId, e.clienteId);
    return (!filtros.inicio || e.dataEntrega >= filtros.inicio) && (!filtros.fim || e.dataEntrega <= filtros.fim) && (!filtros.status?.length || filtros.status.includes(e.status)) && (!filtros.pagamento || situacaoPagamento(e) === filtros.pagamento) && (!filtros.modalidade || e.modalidade === filtros.modalidade) && (!busca || c?.nome.toLocaleLowerCase('pt-BR').includes(busca) || String(e.numero) === busca.replace('#', '') || (digitos.length >= 3 && c?.telefone.replace(/\D/g, '').includes(digitos)));
  }).sort((a, b) => `${a.dataEntrega} ${a.horaEntrega}`.localeCompare(`${b.dataEntrega} ${b.horaEntrega}`) * (filtros.inverter ? -1 : 1));
}
export function totaisEncomendas(lista: Encomenda[]) { return { quantidade: lista.length, total: lista.reduce((s, e) => s + totalEncomenda(e), 0), saldo: lista.reduce((s, e) => s + saldoEncomenda(e), 0) }; }
export function diasDoMes(dados: DadosPrototipo, lojaId: LojaSelecionada, mes: string) {
  const data = new Date(`${mes}-01T12:00:00Z`), ultimo = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 0)).getUTCDate();
  return Array.from({ length: ultimo }, (_, i) => { const dia = `${mes}-${String(i + 1).padStart(2, '0')}`, lista = listarEncomendas(dados, lojaId).filter(e => e.dataEntrega === dia && e.status !== 'cancelado'); return { data: dia, quantidade: lista.length, orcamentos: lista.some(e => e.status === 'orcamento'), pendentes: lista.some(e => saldoEncomenda(e) > 0) }; });
}
function validarItem(item: ItemEncomenda) {
  const valor = item.tipo === 'bolo' ? item.valorCentavos : item.valorUnitarioCentavos;
  if (!Number.isSafeInteger(valor) || valor < 0 || (item.tipo === 'produto' && (!Number.isSafeInteger(item.quantidade) || item.quantidade < 1))) throw new Error('Valor ou quantidade inválida.');
}
// Estrutura de escrita para as próximas tarefas. Substituir esta camada ao entrar o banco.
export function salvarEncomenda(dados: DadosPrototipo, lojaId: LojaSelecionada, encomenda: Encomenda, evento: EventoHistorico): DadosPrototipo {
  if (lojaId !== 'consolidado' && encomenda.lojaId !== lojaId) throw new Error('Encomenda de outra loja.');
  if (!dados.lojas.some(l => l.id === encomenda.lojaId)) throw new Error('Loja inválida.');
  if (!obterCliente(dados, encomenda.lojaId, encomenda.clienteId)) throw new Error('Cliente de outra loja.');
  encomenda.itens.forEach(validarItem);
  if (![encomenda.descontoCentavos, encomenda.taxaCartaoCentavos, ...encomenda.pagamentos.map(p => p.valorCentavos)].every(v => Number.isSafeInteger(v) && v >= 0)) throw new Error('Dinheiro deve ser inteiro em centavos.');
  const anterior = obterEncomenda(dados, lojaId, encomenda.id);
  if (dados.encomendas.some(e => e.id === encomenda.id) && !anterior) throw new Error('Encomenda de outra loja.');
  const salva = structuredClone({ ...encomenda, historico: [...(anterior?.historico ?? []), evento] });
  return { ...dados, encomendas: anterior ? dados.encomendas.map(e => e.id === salva.id ? salva : e) : [...dados.encomendas, salva] };
}

export function novoId() { return crypto.randomUUID(); }
export function criarRascunho(lojaId: string, usuarioId: string): Rascunho {
  return { id: novoId(), usuarioId, desconto: { tipo: 'valor', valor: 0 }, taxa: { tipo: 'valor', valor: 0 }, encomenda: { id: novoId(), numero: 0, lojaId: lojaId === 'consolidado' ? '' : lojaId, clienteId: '', status: 'confirmado', dataEntrega: dataRelativa(0), horaEntrega: '', modalidade: 'retirada', itens: [], pagamentos: [], descontoCentavos: 0, taxaCartaoCentavos: 0, observacoes: '', historico: [], criadoEm: new Date().toISOString(), criadoPor: usuarioId } };
}
export function calcularValorBolo(dados: DadosPrototipo, i: Extract<ItemEncomenda, { tipo: 'bolo' }>) {
  return (dados.opcoesBolo.tamanhos.find(t => t.id === i.tamanho)?.valorCentavos ?? 0) + i.adicionais.reduce((s, id) => s + (dados.opcoesBolo.adicionais.find(o => o.id === id)?.valorCentavos ?? 0), 0) + i.decoracoes.reduce((s, id) => s + (dados.opcoesBolo.decoracoes.find(o => o.id === id)?.valorCentavos ?? 0), 0);
}
export function novoItemBolo(): Extract<ItemEncomenda, { tipo: 'bolo' }> { return { id: novoId(), tipo: 'bolo', formato: '', tamanho: '', massa: '', recheios: [], adicionais: [], decoracoes: [], detalhes: '', valorCentavos: 0 }; }
export function calcularTotais(r: Rascunho) {
  const subtotal = r.encomenda.itens.reduce((s, i) => s + (i.tipo === 'bolo' ? i.valorCentavos : i.quantidade * i.valorUnitarioCentavos), 0);
  const descontoCentavos = r.desconto.tipo === 'valor' ? r.desconto.valor : Math.round(subtotal * r.desconto.valor / 10000);
  const taxaCartaoCentavos = r.taxa.tipo === 'valor' ? r.taxa.valor : Math.round((subtotal - descontoCentavos) * r.taxa.valor / 10000);
  const total = subtotal - descontoCentavos + taxaCartaoCentavos, pago = r.encomenda.pagamentos.reduce((s, p) => s + p.valorCentavos, 0);
  return { subtotal, descontoCentavos, taxaCartaoCentavos, total, pago, saldo: total - pago };
}
export function salvarRascunho(dados: DadosPrototipo, r: Rascunho) {
  const t = calcularTotais(r), atualizado = { ...r, encomenda: { ...r.encomenda, descontoCentavos: t.descontoCentavos, taxaCartaoCentavos: t.taxaCartaoCentavos } };
  return { ...dados, rascunhos: dados.rascunhos.some(x => x.id === r.id) ? dados.rascunhos.map(x => x.id === r.id ? atualizado : x) : [...dados.rascunhos, atualizado] };
}
export function descartarRascunho(dados: DadosPrototipo, id: string) { return { ...dados, rascunhos: dados.rascunhos.filter(r => r.id !== id) }; }
export function localizarClientePorTelefone(dados: DadosPrototipo, telefone: string, exceto?: string) { const digitos = telefone.replace(/\D/g, ''); return dados.clientes.find(c => c.id !== exceto && c.telefone.replace(/\D/g, '') === digitos); }
export function validarCliente(c: Cliente) { return { ...(!c.nome.trim() ? { nome: 'Informe o nome.' } : {}), ...(!/^\d{10,11}$/.test(c.telefone.replace(/\D/g, '')) ? { telefone: 'Informe o telefone com DDD, com 10 ou 11 dígitos.' } : {}) }; }
export function salvarCliente(dados: DadosPrototipo, c: Cliente) {
  if (Object.keys(validarCliente(c)).length) throw new Error('Preencha nome e telefone corretamente.');
  if (localizarClientePorTelefone(dados, c.telefone, c.id)) throw new Error('Telefone já cadastrado. Use o cliente existente.');
  return { ...dados, clientes: dados.clientes.some(x => x.id === c.id) ? dados.clientes.map(x => x.id === c.id ? structuredClone(c) : x) : [...dados.clientes, structuredClone(c)] };
}
export function proximoNumeroEncomenda(dados: DadosPrototipo, lojaId: string) { return Math.max(0, ...listarEncomendas(dados, lojaId).map(e => e.numero)) + 1; }
export function validarRascunho(dados: DadosPrototipo, r: Rascunho): Record<string, string> {
  const e = r.encomenda, t = calcularTotais(r), erros: Record<string, string> = {};
  if (!dados.lojas.some(l => l.id === e.lojaId)) erros.loja = 'Escolha a loja.';
  if (!obterCliente(dados, e.lojaId, e.clienteId)) erros.cliente = 'Escolha um cliente.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.dataEntrega)) erros.data = 'Informe a data.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.horaEntrega)) erros.hora = 'Informe a hora.';
  if (e.modalidade === 'entrega' && !e.enderecoEntrega?.trim()) erros.endereco = 'Informe o endereço de entrega.';
  if (!e.itens.length) erros.itens = 'Adicione pelo menos um item.';
  if (t.total < 0 || t.descontoCentavos > t.subtotal) erros.desconto = 'O desconto não pode superar o subtotal.';
  if (![r.desconto.valor, r.taxa.valor, t.total].every(v => Number.isSafeInteger(v) && v >= 0)) erros.valores = 'Desconto, taxa e total devem ser valores positivos em centavos.';
  if (t.saldo < 0) erros.pagamento = 'O valor pago não pode superar o total.';
  return erros;
}
export function confirmarRascunho(dados: DadosPrototipo, lojaId: string, r: Rascunho, status: 'orcamento' | 'confirmado') {
  const erros = validarRascunho(dados, r); if (Object.keys(erros).length) throw new Error(Object.values(erros).join(' '));
  const t = calcularTotais(r), e = { ...r.encomenda, numero: proximoNumeroEncomenda(dados, r.encomenda.lojaId), status, descontoCentavos: t.descontoCentavos, taxaCartaoCentavos: t.taxaCartaoCentavos };
  const detalhes = e.itens.flatMap(i => i.tipo === 'bolo' && i.ajuste ? [`Ajuste do bolo de ${i.ajuste.valorOriginalCentavos} para ${i.valorCentavos} centavos: ${i.ajuste.motivo}`] : []);
  const evento = { id: novoId(), data: new Date().toISOString(), usuarioId: r.usuarioId, acao: status === 'orcamento' ? 'Orçamento criado' : 'Encomenda criada', detalhe: ['Registro no protótipo com valores de teste.', ...detalhes, r.desconto.motivo ? `Motivo do desconto: ${r.desconto.motivo}` : ''].filter(Boolean).join(' ') };
  return { dados: descartarRascunho(salvarEncomenda(dados, lojaId, e, evento), r.id), encomenda: e };
}
export function lerSessaoLocal(): SessaoPrototipo {
  const inicial: SessaoPrototipo = { dados: carregarDadosDeTeste(), usuarioId: null, lojaId: 'matriz' };
  try {
    const texto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!texto) return inicial;
    const salva = JSON.parse(texto) as SessaoPrototipo;
    // Dados de navegador são descartáveis. Incompatibilidade/corrupção restaura a base segura.
    if (!salva.dados || !Array.isArray(salva.dados.encomendas) || !Array.isArray(salva.dados.clientes) || !Array.isArray(salva.dados.produtos) || !Array.isArray(salva.dados.lojas) || !Array.isArray(salva.dados.usuarios)) return inicial;
    const usuario = obterUsuario(inicial.dados, salva.usuarioId);
    if (!usuario) return inicial;
    const lojaId = usuario.perfil === 'atendimento' ? usuario.lojaId : (salva.lojaId === 'consolidado' || inicial.dados.lojas.some(l => l.id === salva.lojaId) ? salva.lojaId : usuario.lojaId);
    return { ...salva, usuarioId: usuario.id, lojaId, dados: { ...inicial.dados, ...salva.dados, rascunhos: Array.isArray(salva.dados.rascunhos) ? salva.dados.rascunhos : [] } };
  } catch { return inicial; }
}
export function gravarSessaoLocal(sessao: SessaoPrototipo) {
  try { localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(sessao)); } catch { /* Modo privado ou quota: continua em memória. */ }
}
export function restaurarDadosDeTeste() {
  try { localStorage.removeItem(CHAVE_ARMAZENAMENTO); } catch { /* Continua em memória. */ }
  return carregarDadosDeTeste();
}
