import configuracao from '@/dados-teste/configuracao.json';
import lojas from '@/dados-teste/lojas.json';
import usuarios from '@/dados-teste/usuarios.json';
import formas from '@/dados-teste/formas-pagamento.json';
import opcoes from '@/dados-teste/opcoes-bolo.json';
import produtos from '@/dados-teste/produtos.json';
import categorias from '@/dados-teste/categorias-produto.json';
import clientes from '@/dados-teste/clientes.json';
import encomendas from '@/dados-teste/encomendas.json';
import encomendasClientes from '@/dados-teste/encomendas-clientes.json';
import caixasTeste from '@/dados-teste/caixas.json';
import type { Caixa, ConferenciaCaixa, MovimentoCaixa, PagamentoVenda, Venda } from './tipos';
import type { Cliente, DadosPrototipo, Encomenda, EventoHistorico, ItemEncomenda, LojaSelecionada, Pagamento, Rascunho, SessaoPrototipo, SituacaoPagamento, StatusEncomenda } from './tipos';
import { formatarData, formatarMoeda } from './formatar';

export const CHAVE_ARMAZENAMENTO = 'sistema-rose-prototipo-v5';
const formatadorDia = new Intl.DateTimeFormat('en-CA', { timeZone: configuracao.fuso, year: 'numeric', month: '2-digit', day: '2-digit' });
export function obterConfiguracao() { return configuracao; }
export function listarPerfisDeTeste() { return carregarDadosDeTeste().usuarios; }

// Calcula a data civil no fuso configurado, sem depender do fuso do navegador.
export function dataRelativa(dias: number, agora = new Date()) {
  const partes = formatadorDia.formatToParts(agora);
  const parte = (tipo: string) => Number(partes.find(p => p.type === tipo)?.value);
  const data = new Date(Date.UTC(parte('year'), parte('month') - 1, parte('day') + dias, 12));
  return data.toISOString().slice(0, 10);
}

export function carregarDadosDeTeste(): DadosPrototipo {
  const dados = structuredClone({
    configuracao, lojas: lojas.itens, usuarios: usuarios.itens, formasPagamento: formas.itens, rascunhos: [],
    opcoesBolo: opcoes, produtos: produtos.itens, categoriasProduto: categorias.itens, clientes: clientes.itens.map(c => ({ ...c, criadoEm: `${dataRelativa(-c.criadoDiasAtras)}T12:00:00-03:00`, aniversario: c.aniversarioMesAtual ? `${c.aniversario!.slice(0, 4)}-${dataRelativa(0).slice(5, 7)}-${c.aniversario!.slice(8)}` : c.aniversario })),
    caixas: caixasTeste.caixas.map(c => ({ ...c, data: dataRelativa(-c.diasAtras), abertoEm: `${dataRelativa(-c.diasAtras)}T08:00:00-03:00`, fechadoEm: `${dataRelativa(-c.diasAtras)}T19:00:00-03:00`, fechadoPor: c.abertoPor })),
    vendas: caixasTeste.vendas.map(v => ({ ...v, data: `${dataRelativa(-v.diasAtras)}T14:00:00-03:00` })),
    movimentosCaixa: caixasTeste.movimentos.map(m => ({ ...m, data: `${dataRelativa(-m.diasAtras)}T09:00:00-03:00` })),
    encomendas: [...encomendas.itens, ...encomendasClientes.itens].map(e => ({ ...e,
      dataEntrega: dataRelativa(e.diasAPartirDeHoje),
      criadoEm: `${dataRelativa(Math.min(0, e.diasAPartirDeHoje - 7))}T12:00:00-03:00`,
      pagamentos: e.pagamentos.map(p => ({ ...p, data: `${dataRelativa(Math.min(0, e.diasAPartirDeHoje - 3))}T10:00:00-03:00` })),
      historico: e.historico.map(h => ({ ...h, data: `${dataRelativa(Math.min(0, e.diasAPartirDeHoje - 7))}T12:00:00-03:00` })),
    })),
  }) as DadosPrototipo;
  dados.caixas.forEach(c => { const diferenca = caixasTeste.caixas.find(x => x.id === c.id)?.diferencaTesteCentavos || 0; c.conferencia = resumoCaixa(dados, c).formas.map(f => ({ formaPagamentoId: f.id, esperadoCentavos: f.valorCentavos, informadoCentavos: f.valorCentavos + (f.id === 'dinheiro' ? diferenca : 0), diferencaCentavos: f.id === 'dinheiro' ? diferenca : 0 })); });
  return dados;
}

function daLoja<T extends { lojaId: string }>(registros: T[], lojaId: LojaSelecionada) {
  return registros.filter(registro => lojaId === 'consolidado' || registro.lojaId === lojaId);
}
export function listarEncomendas(dados: DadosPrototipo, lojaId: LojaSelecionada) { return daLoja(dados.encomendas, lojaId); }
export function obterEncomenda(dados: DadosPrototipo, lojaId: LojaSelecionada, id: string) { return listarEncomendas(dados, lojaId).find(e => e.id === id); }
export function listarClientes(dados: DadosPrototipo, lojaId: LojaSelecionada) { void lojaId; return dados.clientes; }
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
  if (![encomenda.descontoCentavos, encomenda.taxaCartaoCentavos].every(v => Number.isSafeInteger(v) && v >= 0) || !encomenda.pagamentos.every(p => Number.isSafeInteger(p.valorCentavos) && (p.tipo === 'devolucao' ? p.valorCentavos <= 0 : p.valorCentavos >= 0))) throw new Error('Dinheiro deve ser inteiro em centavos.');
  const anterior = obterEncomenda(dados, lojaId, encomenda.id);
  for (const p of encomenda.pagamentos) if (JSON.stringify(anterior?.pagamentos.find(x => x.id === p.id)) !== JSON.stringify(p) && !pagamentoPodeSerCorrigido(dados, p)) throw new Error('Caixa fechado: reabra o caixa para registrar ou corrigir pagamentos deste dia.');
  if (dados.encomendas.some(e => e.id === encomenda.id) && !anterior) throw new Error('Encomenda de outra loja.');
  const salva = structuredClone({ ...encomenda, historico: [...(anterior?.historico ?? []), evento] });
  return { ...dados, encomendas: anterior ? dados.encomendas.map(e => e.id === salva.id ? salva : e) : [...dados.encomendas, salva] };
}

export function novoId() { return crypto.randomUUID(); }
export const sequenciaStatus: StatusEncomenda[] = ['orcamento', 'confirmado', 'em_producao', 'pronto', 'entregue'];
export function nomeStatus(status: StatusEncomenda) { return { orcamento: 'Orçamento', confirmado: 'Confirmado', em_producao: 'Em produção', pronto: 'Pronto', entregue: 'Entregue/Retirado', cancelado: 'Cancelado' }[status]; }
export function pagamentoPodeSerCorrigido(dados: DadosPrototipo, pagamento: Pagamento) { return !dados.caixas.some(c => c.lojaId === pagamento.lojaId && c.data === diaDoRegistro(pagamento.data) && c.status === 'fechado'); }
function eventoEncomenda(usuarioId: string, acao: string, detalhe: string): EventoHistorico { return { id: novoId(), data: new Date().toISOString(), usuarioId, acao, detalhe }; }
export function alterarStatusEncomenda(dados: DadosPrototipo, lojaId: string, id: string, status: StatusEncomenda, usuarioId: string, motivo = '') {
  const e = obterEncomenda(dados, lojaId, id); if (!e || e.status === 'cancelado' || status === 'cancelado') throw new Error('Encomenda indisponível para esta ação.');
  const anterior = sequenciaStatus.indexOf(e.status), proximo = sequenciaStatus.indexOf(status);
  if (proximo < 0 || proximo > anterior + 1 || proximo === anterior) throw new Error('Escolha o próximo status ou retorne com motivo.');
  if (proximo < anterior && !motivo.trim()) throw new Error('Informe o motivo para voltar o status.');
  return salvarEncomenda(dados, lojaId, { ...e, status }, eventoEncomenda(usuarioId, 'Status alterado', `${nomeStatus(e.status)} → ${nomeStatus(status)}${motivo ? `. Motivo: ${motivo}` : ''}`));
}
export function registrarPagamentoEncomenda(dados: DadosPrototipo, lojaId: string, id: string, formaPagamentoId: string, valorCentavos: number, usuarioId: string) {
  const e = obterEncomenda(dados, lojaId, id); if (!e || e.status === 'cancelado') throw new Error('Encomenda indisponível.');
  if (!Number.isSafeInteger(valorCentavos) || valorCentavos <= 0 || valorCentavos > saldoEncomenda(e)) throw new Error('Informe um valor positivo que não supere o saldo.');
  if (!dados.formasPagamento.some(f => f.id === formaPagamentoId)) throw new Error('Forma de pagamento inválida.');
  const pagamento: Pagamento = { id: novoId(), data: new Date().toISOString(), formaPagamentoId, valorCentavos, tipo: dataRelativa(0) < e.dataEntrega ? 'adiantamento' : 'pagamento', usuarioId, lojaId: e.lojaId };
  return salvarEncomenda(dados, lojaId, { ...e, pagamentos: [...e.pagamentos, pagamento] }, eventoEncomenda(usuarioId, 'Pagamento registrado', `${formatarMoeda(valorCentavos)} em ${dados.formasPagamento.find(f => f.id === formaPagamentoId)?.nome}.`));
}
export function corrigirPagamentoEncomenda(dados: DadosPrototipo, lojaId: string, id: string, pagamentoId: string, formaPagamentoId: string, valorCentavos: number, motivo: string, usuarioId: string) {
  const e = obterEncomenda(dados, lojaId, id), p = e?.pagamentos.find(p => p.id === pagamentoId);
  if (!e || !p || !pagamentoPodeSerCorrigido(dados, p)) throw new Error('Este pagamento não pode ser corrigido após o fechamento do caixa.');
  if (!motivo.trim()) throw new Error('Informe o motivo da correção.');
  if (!Number.isSafeInteger(valorCentavos) || valorCentavos <= 0 || (p.tipo !== 'devolucao' && valorCentavos > saldoEncomenda(e) + p.valorCentavos)) throw new Error('Valor inválido para a correção.');
  const novo = { ...p, formaPagamentoId, valorCentavos: p.tipo === 'devolucao' ? -valorCentavos : valorCentavos };
  const pagamentos = e.pagamentos.map(x => x.id === p.id ? novo : x), credito = pagamentos.reduce((s, x) => s + x.valorCentavos, 0);
  if (credito < 0) throw new Error('A devolução não pode superar o recebido.');
  const base = salvarEncomenda(dados, lojaId, { ...e, pagamentos, ...(e.status === 'cancelado' ? { creditoCancelamentoCentavos: credito } : {}) }, eventoEncomenda(usuarioId, 'Pagamento corrigido', `De ${dados.formasPagamento.find(f => f.id === p.formaPagamentoId)?.nome}, ${formatarMoeda(p.valorCentavos)}, para ${dados.formasPagamento.find(f => f.id === formaPagamentoId)?.nome}, ${formatarMoeda(novo.valorCentavos)}. Motivo: ${motivo}`));
  return e.status === 'cancelado' ? { ...base, clientes: base.clientes.map(c => c.id === e.clienteId ? { ...c, creditoCentavos: (c.creditoCentavos || 0) - (e.creditoCancelamentoCentavos || 0) + credito } : c) } : base;
}
export function cancelarEncomenda(dados: DadosPrototipo, lojaId: string, id: string, usuarioId: string, motivo: string, destino: 'devolver' | 'credito', formaPagamentoId: string, valorCentavos: number) {
  const e = obterEncomenda(dados, lojaId, id); if (!e || e.status === 'cancelado') throw new Error('Encomenda indisponível.');
  if (!motivo.trim()) throw new Error('Informe o motivo do cancelamento.');
  const pago = e.pagamentos.reduce((s, p) => s + p.valorCentavos, 0), devolver = destino === 'devolver' ? valorCentavos : 0;
  if (!Number.isSafeInteger(devolver) || devolver < 0 || devolver > pago) throw new Error('A devolução deve ficar entre zero e o valor pago.');
  const pagamentos: Pagamento[] = devolver ? [...e.pagamentos, { id: novoId(), data: new Date().toISOString(), formaPagamentoId, valorCentavos: -devolver, tipo: 'devolucao', usuarioId, lojaId: e.lojaId }] : e.pagamentos;
  const credito = pago - devolver, base = salvarEncomenda(dados, lojaId, { ...e, status: 'cancelado', pagamentos, creditoCancelamentoCentavos: credito }, eventoEncomenda(usuarioId, 'Encomenda cancelada', `Motivo: ${motivo}. Devolução: ${formatarMoeda(devolver)}. Crédito do cliente: ${formatarMoeda(credito)}.`));
  return { ...base, clientes: base.clientes.map(c => c.id === e.clienteId ? { ...c, creditoCentavos: (c.creditoCentavos || 0) + credito } : c) };
}
export function criarRascunhoEdicao(e: Encomenda, usuarioId: string): Rascunho { return { id: novoId(), usuarioId, origemId: e.id, encomenda: structuredClone(e), desconto: { tipo: 'valor', valor: e.descontoCentavos }, taxa: { tipo: 'valor', valor: e.taxaCartaoCentavos } }; }
export function salvarEdicaoEncomenda(dados: DadosPrototipo, lojaId: string, r: Rascunho) {
  const anterior = obterEncomenda(dados, lojaId, r.origemId || ''); if (!anterior || ['entregue', 'cancelado'].includes(anterior.status)) throw new Error('Pedidos finalizados não podem ser alterados.');
  const novo = { ...r.encomenda, pagamentos: anterior.pagamentos, status: anterior.status }, validado = { ...r, encomenda: novo }, erros = validarRascunho(dados, validado);
  if (Object.keys(erros).length) throw new Error(Object.values(erros).join(' '));
  const t = calcularTotais(validado), e = { ...novo, descontoCentavos: t.descontoCentavos, taxaCartaoCentavos: t.taxaCartaoCentavos }, alteracoes: string[] = [];
  if (e.dataEntrega !== anterior.dataEntrega) alteracoes.push(`Data alterada de ${formatarData(anterior.dataEntrega)} para ${formatarData(e.dataEntrega)}`);
  if (e.horaEntrega !== anterior.horaEntrega) alteracoes.push(`Hora alterada de ${anterior.horaEntrega} para ${e.horaEntrega}`);
  for (const i of e.itens) { const antes = anterior.itens.find(x => x.id === i.id); if (!antes) alteracoes.push(`Item incluído: ${resumirItens(dados, { ...e, itens: [i] })}`); else if (JSON.stringify(antes) !== JSON.stringify(i)) alteracoes.push(`Item alterado: ${resumirItens(dados, { ...e, itens: [i] })}${i.tipo === 'bolo' && antes.tipo === 'bolo' ? `, valor de ${formatarMoeda(antes.valorCentavos)} para ${formatarMoeda(i.valorCentavos)}` : ''}`); }
  for (const i of anterior.itens.filter(i => !e.itens.some(x => x.id === i.id))) alteracoes.push(`Item removido: ${resumirItens(dados, { ...anterior, itens: [i] })}`);
  if (totalEncomenda(anterior) !== totalEncomenda(e)) alteracoes.push(`Total alterado de ${formatarMoeda(totalEncomenda(anterior))} para ${formatarMoeda(totalEncomenda(e))}`);
  for (const campo of ['clienteId', 'modalidade', 'enderecoEntrega', 'observacoes'] as const) if (e[campo] !== anterior[campo]) alteracoes.push(`${{ clienteId: 'Cliente', modalidade: 'Modalidade', enderecoEntrega: 'Endereço', observacoes: 'Observações' }[campo]} alterado: ${campo === 'clienteId' ? obterCliente(dados, lojaId, e.clienteId)?.nome : e[campo]}`);
  return { dados: descartarRascunho(salvarEncomenda(dados, lojaId, e, eventoEncomenda(r.usuarioId, 'Encomenda alterada', alteracoes.join('. ') || 'Revisada sem alterações.')), r.id), encomenda: e };
}
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
  const salvo = { ...c, criadoEm: c.criadoEm || new Date().toISOString() };
  return { ...dados, clientes: dados.clientes.some(x => x.id === c.id) ? dados.clientes.map(x => x.id === c.id ? structuredClone(salvo) : x) : [...dados.clientes, structuredClone(salvo)] };
}
export function encomendasDoCliente(dados: DadosPrototipo, clienteId: string) { return filtrarEncomendas(dados, 'consolidado', {}).filter(e => e.clienteId === clienteId); }
export function resumoCliente(dados: DadosPrototipo, clienteId: string) {
  const lista = encomendasDoCliente(dados, clienteId), finalizadas = lista.filter(e => e.status === 'entregue'), limite = new Date(`${dataRelativa(0)}T12:00:00Z`); limite.setUTCMonth(limite.getUTCMonth() - 6);
  const total = finalizadas.reduce((s, e) => s + totalEncomenda(e), 0), pendentes = lista.filter(e => !['orcamento', 'cancelado'].includes(e.status) && saldoEncomenda(e) > 0);
  return { quantidade: lista.filter(e => !['orcamento', 'cancelado'].includes(e.status)).length, total, ticketMedio: finalizadas.length ? Math.round(total / finalizadas.length) : 0, ultima: [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))[0], saldo: pendentes.reduce((s, e) => s + saldoEncomenda(e), 0), pendentes, recorrente: finalizadas.filter(e => e.dataEntrega >= limite.toISOString().slice(0, 10) && e.dataEntrega <= dataRelativa(0)).length >= 2 };
}
export function filtrarClientes(dados: DadosPrototipo, busca = '', filtro = 'todos') {
  const texto = busca.toLocaleLowerCase('pt-BR'), digitos = busca.replace(/\D/g, '');
  return dados.clientes.filter(c => { const s = resumoCliente(dados, c.id); return (!texto || c.nome.toLocaleLowerCase('pt-BR').includes(texto) || (digitos.length >= 3 && c.telefone.replace(/\D/g, '').includes(digitos))) && (filtro === 'todos' || (filtro === 'recorrentes' && s.recorrente) || (filtro === 'pendencia' && s.saldo > 0) || (filtro === 'aniversario' && c.aniversario?.slice(5, 7) === dataRelativa(0).slice(5, 7))); });
}
export function enderecoWhatsapp(c: Cliente) { return `https://wa.me/55${c.telefone.replace(/\D/g, '')}`; }
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
export function diaDoRegistro(iso: string) { return dataRelativa(0, new Date(iso)); }
export function listarCaixas(dados: DadosPrototipo, lojaId: string) { return daLoja(dados.caixas, lojaId).sort((a, b) => b.data.localeCompare(a.data)); }
export function obterCaixa(dados: DadosPrototipo, lojaId: string, data = dataRelativa(0)) { return listarCaixas(dados, lojaId).find(c => c.data === data); }
export function obterCaixaPorId(dados: DadosPrototipo, lojaId: string, id: string) { return listarCaixas(dados, lojaId).find(c => c.id === id); }
export function totalVenda(v: Pick<Venda, 'itens' | 'descontoCentavos' | 'taxaCartaoCentavos'>) { return v.itens.reduce((s, i) => s + i.quantidade * i.valorUnitarioCentavos, 0) - v.descontoCentavos + v.taxaCartaoCentavos; }
export function movimentosDoCaixa(dados: DadosPrototipo, caixa: Caixa) {
  const vendas = dados.vendas.filter(v => v.caixaId === caixa.id && v.status === 'concluida').flatMap(v => v.pagamentos.map((p, n) => ({ id: `${v.id}-${n}`, data: v.data, tipo: 'venda', descricao: `Venda nº ${v.numero}`, formaPagamentoId: p.formaPagamentoId, valorCentavos: p.valorCentavos, usuarioId: v.usuarioId, encomendaId: '', vendaId: v.id })));
  const encomendas = listarEncomendas(dados, caixa.lojaId).flatMap(e => e.pagamentos.filter(p => diaDoRegistro(p.data) === caixa.data).map(p => ({ id: p.id, data: p.data, tipo: p.tipo, descricao: `Encomenda nº ${e.numero}${e.dataEntrega > caixa.data ? ' • entrega futura' : ''}`, formaPagamentoId: p.formaPagamentoId, valorCentavos: p.valorCentavos, usuarioId: p.usuarioId, encomendaId: e.id, vendaId: '' })));
  const manuais = dados.movimentosCaixa.filter(m => m.caixaId === caixa.id).map(m => ({ ...m, descricao: `${m.categoria}: ${m.descricao}`, valorCentavos: (m.tipo === 'sangria' || m.tipo === 'lancamento_saida' ? -1 : 1) * m.valorCentavos, encomendaId: '', vendaId: '' }));
  return [...vendas, ...encomendas, ...manuais].sort((a, b) => b.data.localeCompare(a.data));
}
export function resumoCaixa(dados: DadosPrototipo, caixa: Caixa) {
  const movimentos = movimentosDoCaixa(dados, caixa), formas = dados.formasPagamento.map(f => ({ ...f, valorCentavos: movimentos.filter(m => m.formaPagamentoId === f.id).reduce((s, m) => s + m.valorCentavos, f.id === 'dinheiro' ? caixa.trocoInicialCentavos : 0) }));
  const vendas = dados.vendas.filter(v => v.caixaId === caixa.id && v.status === 'concluida'), recebimentos = movimentos.filter(m => !!m.encomendaId);
  return { formas, dinheiro: formas.find(f => f.id === 'dinheiro')?.valorCentavos || 0, total: formas.reduce((s, f) => s + f.valorCentavos, 0), vendas: vendas.reduce((s, v) => s + totalVenda(v), 0), recebimentos: recebimentos.reduce((s, m) => s + m.valorCentavos, 0), adiantamentosFuturos: recebimentos.filter(m => dados.encomendas.find(e => e.id === m.encomendaId)!.dataEntrega > caixa.data).reduce((s, m) => s + m.valorCentavos, 0), sangrias: movimentos.filter(m => m.tipo === 'sangria').reduce((s, m) => s - m.valorCentavos, 0), suprimentos: movimentos.filter(m => m.tipo === 'suprimento').reduce((s, m) => s + m.valorCentavos, 0), lancamentos: movimentos.filter(m => m.tipo.startsWith('lancamento')).reduce((s, m) => s + m.valorCentavos, 0), descontos: vendas.reduce((s, v) => s + v.descontoCentavos, 0), taxas: vendas.reduce((s, v) => s + v.taxaCartaoCentavos, 0) };
}
export function resumoCaixasDoDia(dados: DadosPrototipo) { const caixas = dados.caixas.filter(c => c.data === dataRelativa(0)); return { abertos: caixas.filter(c => c.status === 'aberto').length, fechados: caixas.filter(c => c.status === 'fechado').length, total: caixas.reduce((s, c) => s + resumoCaixa(dados, c).total, 0), dinheiro: caixas.reduce((s, c) => s + resumoCaixa(dados, c).dinheiro, 0) }; }
function validarOperadorCaixa(dados: DadosPrototipo, lojaId: string, usuarioId: string) { const u = obterUsuario(dados, usuarioId); if (!u || lojaId === 'consolidado' || !dados.lojas.some(l => l.id === lojaId) || (u.perfil === 'atendimento' && u.lojaId !== lojaId)) throw new Error('Escolha uma loja permitida para operar o caixa.'); }
function caixaAberto(dados: DadosPrototipo, caixaId: string, usuarioId: string) { const c = dados.caixas.find(c => c.id === caixaId); if (!c || c.status !== 'aberto') throw new Error('Caixa fechado: operação bloqueada.'); validarOperadorCaixa(dados, c.lojaId, usuarioId); return c; }
export function abrirCaixa(dados: DadosPrototipo, lojaId: string, usuarioId: string, trocoInicialCentavos: number) {
  validarOperadorCaixa(dados, lojaId, usuarioId); if (obterCaixa(dados, lojaId)) throw new Error('Já existe caixa para esta loja hoje.');
  if (!Number.isSafeInteger(trocoInicialCentavos) || trocoInicialCentavos < 0) throw new Error('Troco inicial inválido.');
  const c: Caixa = { id: novoId(), lojaId, data: dataRelativa(0), abertoEm: new Date().toISOString(), abertoPor: usuarioId, trocoInicialCentavos, status: 'aberto', conferencia: [], observacaoFechamento: '', reaberturas: [] };
  return { ...dados, caixas: [...dados.caixas, c] };
}
export function registrarMovimentoCaixa(dados: DadosPrototipo, caixaId: string, usuarioId: string, campos: Omit<MovimentoCaixa, 'id' | 'data' | 'caixaId' | 'usuarioId'>) {
  caixaAberto(dados, caixaId, usuarioId);
  if (!campos.descricao.trim() || !campos.categoria || !Number.isSafeInteger(campos.valorCentavos) || campos.valorCentavos <= 0 || !dados.formasPagamento.some(f => f.id === campos.formaPagamentoId)) throw new Error('Informe valor positivo, forma, categoria e descrição.');
  const m = { ...campos, id: novoId(), data: new Date().toISOString(), caixaId, usuarioId };
  return { ...dados, movimentosCaixa: [...dados.movimentosCaixa, m] };
}
export function conferirCaixa(dados: DadosPrototipo, caixa: Caixa, informados: Record<string, number>): ConferenciaCaixa[] { return resumoCaixa(dados, caixa).formas.map(f => ({ formaPagamentoId: f.id, esperadoCentavos: f.valorCentavos, informadoCentavos: informados[f.id] ?? 0, diferencaCentavos: (informados[f.id] ?? 0) - f.valorCentavos })); }
export function fecharCaixa(dados: DadosPrototipo, caixaId: string, usuarioId: string, informados: Record<string, number>, observacao: string) {
  const c = caixaAberto(dados, caixaId, usuarioId), conferencia = conferirCaixa(dados, c, informados);
  if (conferencia.some(f => !Number.isSafeInteger(f.informadoCentavos) || f.informadoCentavos < 0)) throw new Error('Valores informados devem ser positivos em centavos.');
  if (conferencia.some(f => f.diferencaCentavos !== 0) && !observacao.trim()) throw new Error('Explique a diferença antes de fechar.');
  return { ...dados, caixas: dados.caixas.map(x => x.id === c.id ? { ...c, status: 'fechado' as const, fechadoEm: new Date().toISOString(), fechadoPor: usuarioId, conferencia, observacaoFechamento: observacao } : x) };
}
export function reabrirCaixa(dados: DadosPrototipo, caixaId: string, usuarioId: string, motivo: string) {
  const c = dados.caixas.find(c => c.id === caixaId); if (!c || c.status !== 'fechado' || obterUsuario(dados, usuarioId)?.perfil !== 'administrativo') throw new Error('Somente Administrativo pode reabrir um caixa fechado.');
  if (!motivo.trim()) throw new Error('Informe o motivo da reabertura.');
  return { ...dados, caixas: dados.caixas.map(x => x.id === c.id ? { ...c, status: 'aberto' as const, reaberturas: [...c.reaberturas, { data: new Date().toISOString(), usuarioId, motivo }] } : x) };
}
export function finalizarVenda(dados: DadosPrototipo, caixaId: string, usuarioId: string, campos: Pick<Venda, 'itens' | 'descontoCentavos' | 'taxaCartaoCentavos' | 'pagamentos'>) {
  const c = caixaAberto(dados, caixaId, usuarioId), total = totalVenda(campos);
  if (!campos.itens.length || total <= 0 || ![total, campos.descontoCentavos, campos.taxaCartaoCentavos].every(v => Number.isSafeInteger(v) && v >= 0)) throw new Error('Confira os itens, desconto e taxa.');
  campos.itens.forEach(i => { validarItem(i); if (!listarProdutos(dados, c.lojaId).some(p => p.id === i.produtoId)) throw new Error('Produto indisponível nesta loja.'); });
  validarPagamentosVenda(dados, campos.pagamentos, total);
  const v: Venda = { ...structuredClone(campos), id: novoId(), numero: Math.max(0, ...dados.vendas.filter(v => v.lojaId === c.lojaId).map(v => v.numero)) + 1, lojaId: c.lojaId, caixaId, data: new Date().toISOString(), usuarioId, status: 'concluida', trocoCentavos: campos.pagamentos.filter(p => p.formaPagamentoId === 'dinheiro').reduce((s, p) => s + Math.max(0, (p.recebidoCentavos ?? p.valorCentavos) - p.valorCentavos), 0), historico: [eventoEncomenda(usuarioId, 'Venda concluída', 'Venda de teste no PDV.')] };
  return { dados: { ...dados, vendas: [...dados.vendas, v] }, venda: v };
}
function validarPagamentosVenda(dados: DadosPrototipo, pagamentos: PagamentoVenda[], total: number) {
  if (pagamentos.reduce((s, p) => s + p.valorCentavos, 0) !== total || pagamentos.some(p => !Number.isSafeInteger(p.valorCentavos) || p.valorCentavos <= 0 || (p.recebidoCentavos !== undefined && (!Number.isSafeInteger(p.recebidoCentavos) || p.recebidoCentavos < 0)) || !dados.formasPagamento.some(f => f.id === p.formaPagamentoId) || (p.formaPagamentoId === 'dinheiro' && (p.recebidoCentavos ?? p.valorCentavos) < p.valorCentavos))) throw new Error('Divida o valor exato da venda entre as formas. Dinheiro recebido deve cobrir a parte em dinheiro.');
}
export function cancelarVenda(dados: DadosPrototipo, vendaId: string, usuarioId: string, motivo: string) {
  const v = dados.vendas.find(v => v.id === vendaId); if (!v || v.status === 'cancelada') throw new Error('Venda indisponível.'); caixaAberto(dados, v.caixaId, usuarioId); if (!motivo.trim()) throw new Error('Informe o motivo do cancelamento.');
  return { ...dados, vendas: dados.vendas.map(x => x.id === v.id ? { ...v, status: 'cancelada' as const, motivoCancelamento: motivo, historico: [...v.historico, eventoEncomenda(usuarioId, 'Venda cancelada', motivo)] } : x) };
}
export function corrigirPagamentosVenda(dados: DadosPrototipo, vendaId: string, usuarioId: string, pagamentos: PagamentoVenda[], motivo: string) {
  const v = dados.vendas.find(v => v.id === vendaId); if (!v || v.status === 'cancelada') throw new Error('Venda indisponível.'); caixaAberto(dados, v.caixaId, usuarioId); if (!motivo.trim()) throw new Error('Informe o motivo da correção.'); validarPagamentosVenda(dados, pagamentos, totalVenda(v));
  return { ...dados, vendas: dados.vendas.map(x => x.id === v.id ? { ...v, pagamentos, trocoCentavos: pagamentos.filter(p => p.formaPagamentoId === 'dinheiro').reduce((s, p) => s + Math.max(0, (p.recebidoCentavos ?? p.valorCentavos) - p.valorCentavos), 0), historico: [...v.historico, eventoEncomenda(usuarioId, 'Pagamento da venda corrigido', `Antes: ${v.pagamentos.map(p => dados.formasPagamento.find(f => f.id === p.formaPagamentoId)?.nome).join(', ')}. Depois: ${pagamentos.map(p => dados.formasPagamento.find(f => f.id === p.formaPagamentoId)?.nome).join(', ')}. Motivo: ${motivo}`)] } : x) };
}
