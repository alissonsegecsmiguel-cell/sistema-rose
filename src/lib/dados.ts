import configuracao from '@/dados-teste/configuracao.json';
import lojas from '@/dados-teste/lojas.json';
import usuarios from '@/dados-teste/usuarios.json';
import formas from '@/dados-teste/formas-pagamento.json';
import opcoes from '@/dados-teste/opcoes-bolo.json';
import produtos from '@/dados-teste/produtos.json';
import categorias from '@/dados-teste/categorias-produto.json';
import clientes from '@/dados-teste/clientes.json';
import encomendas from '@/dados-teste/encomendas.json';
import type { DadosPrototipo, Encomenda, EventoHistorico, ItemEncomenda, LojaSelecionada, SessaoPrototipo, SituacaoPagamento } from './tipos';

export const CHAVE_ARMAZENAMENTO = 'sistema-rose-prototipo-v1';
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
    configuracao, lojas: lojas.itens, usuarios: usuarios.itens, formasPagamento: formas.itens,
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
    return { ...salva, usuarioId: usuario.id, lojaId, dados: { ...inicial.dados, encomendas: salva.dados.encomendas, clientes: salva.dados.clientes, produtos: salva.dados.produtos } };
  } catch { return inicial; }
}
export function gravarSessaoLocal(sessao: SessaoPrototipo) {
  try { localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(sessao)); } catch { /* Modo privado ou quota: continua em memória. */ }
}
export function restaurarDadosDeTeste() {
  try { localStorage.removeItem(CHAVE_ARMAZENAMENTO); } catch { /* Continua em memória. */ }
  return carregarDadosDeTeste();
}
