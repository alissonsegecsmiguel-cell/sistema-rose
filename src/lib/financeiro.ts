// Cálculos do financeiro: realizado, previsto, fluxo, DRE gerencial e conciliação. Funções puras.
import type { CategoriaFinanceira, ContaPagar, ContaReceber, DadosPrototipo, Encomenda, GrupoDre, Venda } from './tipos';
import { custoBolo, custoProduto } from './custos';

export const GRUPOS_DRE: { id: GrupoDre; nome: string }[] = [{ id: 'receita', nome: 'Receita' }, { id: 'deducao', nome: 'Dedução' }, { id: 'custo', nome: 'Custo (CMV)' }, { id: 'despesa_operacional', nome: 'Despesa operacional' }, { id: 'despesa_financeira', nome: 'Despesa financeira' }, { id: 'outras', nome: 'Outras' }];
const dia = (iso: string) => iso.slice(0, 10);
export function somarDias(data: string, n: number) { const d = new Date(`${data}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function limitesMes(mes: string) { const [a, m] = mes.split('-').map(Number); return [`${mes}-01`, new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10)] as const; }
export function mesAnterior(mes: string) { const [a, m] = mes.split('-').map(Number); return new Date(Date.UTC(a, m - 2, 1)).toISOString().slice(0, 7); }
const daLoja = (lojaId: string, id: string) => lojaId === 'consolidado' || lojaId === id;
const forma = (d: DadosPrototipo, id: string) => d.formasPagamento.find(f => f.id === id);
export function taxaDaForma(d: DadosPrototipo, id: string) { return forma(d, id)?.taxaPercentual ?? 0; }
export function categoriaFinanceira(d: DadosPrototipo, id: string): CategoriaFinanceira | undefined { return d.categoriasFinanceiras.find(c => c.id === id); }

export type Lancamento = { data: string; tipo: 'entrada' | 'saida'; valor: number; descricao: string; categoria: string; origem: string; link?: string };
type Recebimento = { lojaId: string; data: string; formaPagamentoId: string; valor: number; descricao: string; link?: string };
/** Recebimentos de clientes na data em que aconteceram (vendas de balcão e pagamentos de encomendas). */
export function recebimentos(d: DadosPrototipo, lojaId: string): Recebimento[] {
  const vendas = d.vendas.filter(v => v.status === 'concluida' && daLoja(lojaId, v.lojaId)).flatMap(v => v.pagamentos.map(p => ({ lojaId: v.lojaId, data: dia(v.data), formaPagamentoId: p.formaPagamentoId, valor: p.valorCentavos, descricao: `Venda nº ${v.numero}`, link: `/caixa/venda/${v.id}/cupom` })));
  const encomendas = d.encomendas.filter(e => daLoja(lojaId, e.lojaId)).flatMap(e => e.pagamentos.map(p => ({ lojaId: e.lojaId, data: dia(p.data), formaPagamentoId: p.formaPagamentoId, valor: p.valorCentavos, descricao: `Encomenda nº ${e.numero}`, link: `/encomendas/${e.id}` })));
  return [...vendas, ...encomendas];
}
/** Data em que o dinheiro cai: prazo da forma; valor líquido da taxa da maquininha. */
export function liquidacao(d: DadosPrototipo, r: Recebimento) { const f = forma(d, r.formaPagamentoId); return { data: somarDias(r.data, f?.prazoRecebimentoDias ?? 0), liquido: Math.round(r.valor * (1 - (f?.taxaPercentual ?? 0) / 100)) }; }
const contaPagarLink = '/financeiro?aba=pagar', contaReceberLink = '/financeiro?aba=receber';
/** Realizado: dinheiro que entrou ou saiu até hoje. Cartão entra na data de liquidação. */
export function realizado(d: DadosPrototipo, lojaId: string, inicio: string, fim: string, hoje: string): Lancamento[] {
  const entradas = recebimentos(d, lojaId).flatMap(r => { const l = liquidacao(d, r); return l.data >= inicio && l.data <= fim && l.data <= hoje ? [{ data: l.data, tipo: r.valor >= 0 ? 'entrada' as const : 'saida' as const, valor: Math.abs(r.valor < 0 ? r.valor : l.liquido), descricao: r.descricao, categoria: forma(d, r.formaPagamentoId)?.nome ?? '', origem: 'Recebimento', link: r.link }] : []; });
  const receber = d.contasReceber.filter(c => c.status === 'recebida' && daLoja(lojaId, c.lojaId) && c.recebimento && dia(c.recebimento.data) >= inicio && dia(c.recebimento.data) <= fim).map(c => ({ data: dia(c.recebimento!.data), tipo: 'entrada' as const, valor: c.valorCentavos, descricao: c.descricao, categoria: 'Conta a receber', origem: 'Conta a receber', link: contaReceberLink }));
  const pagas = d.contasPagar.filter(c => c.status === 'paga' && daLoja(lojaId, c.lojaId) && c.pagamento && dia(c.pagamento.data) >= inicio && dia(c.pagamento.data) <= fim).map(c => ({ data: dia(c.pagamento!.data), tipo: 'saida' as const, valor: c.valorCentavos, descricao: c.descricao, categoria: categoriaFinanceira(d, c.categoriaFinanceiraId)?.nome ?? '', origem: 'Conta a pagar', link: c.compraId ? `/compras/${c.compraId}` : contaPagarLink }));
  const caixa = d.movimentosCaixa.filter(m => m.tipo === 'lancamento_saida' && !m.contaPagarId && dia(m.data) >= inicio && dia(m.data) <= fim && daLoja(lojaId, d.caixas.find(c => c.id === m.caixaId)?.lojaId ?? '')).map(m => ({ data: dia(m.data), tipo: 'saida' as const, valor: m.valorCentavos, descricao: `${m.categoria}: ${m.descricao}`, categoria: m.categoria, origem: 'Lançamento de caixa' }));
  return [...entradas, ...receber, ...pagas, ...caixa].sort((a, b) => a.data.localeCompare(b.data));
}
export function saldoEncomendaAReceber(e: Encomenda) { const total = e.itens.reduce((s, i) => s + (i.tipo === 'bolo' ? i.valorCentavos : i.quantidade * i.valorUnitarioCentavos), 0) - e.descontoCentavos + e.taxaCartaoCentavos; return Math.max(0, total - e.pagamentos.reduce((s, p) => s + p.valorCentavos, 0)); }
/** Contas a receber calculadas pelas encomendas com saldo, sem duplicar em cadastro. */
export function aReceberEncomendas(d: DadosPrototipo, lojaId: string) { return d.encomendas.filter(e => daLoja(lojaId, e.lojaId) && !['cancelado', 'orcamento'].includes(e.status) && saldoEncomendaAReceber(e) > 0).map(e => ({ id: e.id, lojaId: e.lojaId, descricao: `Encomenda nº ${e.numero}`, clienteId: e.clienteId, valorCentavos: saldoEncomendaAReceber(e), vencimento: e.dataEntrega, link: `/encomendas/${e.id}` })); }
/** Previsto: contas em aberto, saldos de encomendas e cartões ainda não liquidados. Atrasados entram no próprio dia de hoje. */
export function previsto(d: DadosPrototipo, lojaId: string, inicio: string, fim: string, hoje: string): Lancamento[] {
  const quando = (v: string) => v < hoje ? hoje : v, dentro = (v: string) => quando(v) >= inicio && quando(v) <= fim;
  const cartoes = recebimentos(d, lojaId).flatMap(r => { const l = liquidacao(d, r); return l.data > hoje && dentro(l.data) && r.valor > 0 ? [{ data: l.data, tipo: 'entrada' as const, valor: l.liquido, descricao: `${r.descricao} (${forma(d, r.formaPagamentoId)?.nome})`, categoria: 'Cartão a receber', origem: 'Previsto', link: r.link }] : []; });
  const pagar = d.contasPagar.filter(c => c.status === 'aberta' && daLoja(lojaId, c.lojaId) && dentro(c.vencimento)).map(c => ({ data: quando(c.vencimento), tipo: 'saida' as const, valor: c.valorCentavos, descricao: c.descricao, categoria: categoriaFinanceira(d, c.categoriaFinanceiraId)?.nome ?? '', origem: c.vencimento < hoje ? 'Atrasada' : 'Previsto', link: contaPagarLink }));
  const receber = [...d.contasReceber.filter(c => c.status === 'aberta' && daLoja(lojaId, c.lojaId)).map(c => ({ ...c, link: contaReceberLink })), ...aReceberEncomendas(d, lojaId)].filter(c => dentro(c.vencimento)).map(c => ({ data: quando(c.vencimento), tipo: 'entrada' as const, valor: c.valorCentavos, descricao: c.descricao, categoria: 'A receber', origem: c.vencimento < hoje ? 'Atrasada' : 'Previsto', link: c.link }));
  return [...cartoes, ...pagar, ...receber].sort((a, b) => a.data.localeCompare(b.data));
}
export function fluxoDeCaixa(d: DadosPrototipo, lojaId: string, inicio: string, fim: string, hoje: string, agrupar: 'dia' | 'mes' = 'dia') {
  const chave = (v: string) => agrupar === 'mes' ? v.slice(0, 7) : v, r = realizado(d, lojaId, inicio, fim, hoje), p = previsto(d, lojaId, inicio, fim, hoje), mapa = new Map<string, { realizadoEntradas: number; realizadoSaidas: number; previstoEntradas: number; previstoSaidas: number }>();
  const linha = (k: string) => { if (!mapa.has(k)) mapa.set(k, { realizadoEntradas: 0, realizadoSaidas: 0, previstoEntradas: 0, previstoSaidas: 0 }); return mapa.get(k)!; };
  r.forEach(l => { const x = linha(chave(l.data)); if (l.tipo === 'entrada') x.realizadoEntradas += l.valor; else x.realizadoSaidas += l.valor; });
  p.forEach(l => { const x = linha(chave(l.data)); if (l.tipo === 'entrada') x.previstoEntradas += l.valor; else x.previstoSaidas += l.valor; });
  let acumulado = 0;
  return { linhas: [...mapa].sort(([a], [b]) => a.localeCompare(b)).map(([periodo, v]) => { const saldo = v.realizadoEntradas + v.previstoEntradas - v.realizadoSaidas - v.previstoSaidas; acumulado += saldo; return { periodo, ...v, saldo, acumulado }; }), realizado: r, previsto: p };
}

// DRE gerencial simplificado (competência): vendas e encomendas entregues no mês, CMV pela ficha atual,
// despesas pelas contas com vencimento no mês. Contas de grupo custo (compras) não entram: o CMV já cobre.
function itensDoMes(d: DadosPrototipo, lojaId: string, mes: string) {
  const [inicio, fim] = limitesMes(mes);
  const vendas = d.vendas.filter(v => v.status === 'concluida' && daLoja(lojaId, v.lojaId) && dia(v.data) >= inicio && dia(v.data) <= fim);
  const encomendas = d.encomendas.filter(e => e.status === 'entregue' && daLoja(lojaId, e.lojaId) && e.dataEntrega >= inicio && e.dataEntrega <= fim);
  return { inicio, fim, vendas, encomendas };
}
const brutoVenda = (v: Venda) => v.itens.reduce((s, i) => s + i.quantidade * i.valorUnitarioCentavos, 0) + v.taxaCartaoCentavos;
const brutoEncomenda = (e: Encomenda) => e.itens.reduce((s, i) => s + (i.tipo === 'bolo' ? i.valorCentavos : i.quantidade * i.valorUnitarioCentavos), 0) + e.taxaCartaoCentavos;
export function dreDoMes(d: DadosPrototipo, lojaId: string, mes: string) {
  const { inicio, fim, vendas, encomendas } = itensDoMes(d, lojaId, mes), semFicha = new Set<string>();
  const balcao = vendas.reduce((s, v) => s + brutoVenda(v), 0), encomendasReceita = encomendas.reduce((s, e) => s + brutoEncomenda(e), 0), receitaBruta = balcao + encomendasReceita;
  const descontos = vendas.reduce((s, v) => s + v.descontoCentavos, 0) + encomendas.reduce((s, e) => s + e.descontoCentavos, 0);
  const taxas = Math.round([...vendas.flatMap(v => v.pagamentos), ...encomendas.flatMap(e => e.pagamentos.filter(p => p.valorCentavos > 0))].reduce((s, p) => s + p.valorCentavos * taxaDaForma(d, p.formaPagamentoId) / 100, 0));
  const receitaLiquida = receitaBruta - descontos - taxas;
  let cmv = 0, semFichaValor = 0;
  for (const i of [...vendas.flatMap(v => v.itens), ...encomendas.flatMap(e => e.itens)]) {
    if (i.tipo === 'bolo') { const c = custoBolo(d, i); cmv += c.total; c.avisos.forEach(a => semFicha.add(a)); continue; }
    const c = custoProduto(d, i.produtoId); if (c === undefined) { semFicha.add(d.produtos.find(p => p.id === i.produtoId)?.nome ?? 'Produto'); semFichaValor += i.quantidade * i.valorUnitarioCentavos; } else cmv += c * i.quantidade;
  }
  cmv = Math.round(cmv); const lucroBruto = receitaLiquida - cmv;
  const contas = d.contasPagar.filter(c => daLoja(lojaId, c.lojaId) && c.vencimento >= inicio && c.vencimento <= fim);
  const caixa = d.movimentosCaixa.filter(m => m.tipo === 'lancamento_saida' && !m.contaPagarId && dia(m.data) >= inicio && dia(m.data) <= fim && daLoja(lojaId, d.caixas.find(c => c.id === m.caixaId)?.lojaId ?? ''));
  const porGrupo = (grupo: GrupoDre) => { const m = new Map<string, number>(); contas.filter(c => (categoriaFinanceira(d, c.categoriaFinanceiraId)?.grupo ?? 'outras') === grupo).forEach(c => m.set(c.categoriaFinanceiraId, (m.get(c.categoriaFinanceiraId) ?? 0) + c.valorCentavos)); if (grupo === 'outras') caixa.forEach(x => m.set('outras-despesas', (m.get('outras-despesas') ?? 0) + x.valorCentavos)); return [...m].map(([id, valor]) => ({ id, nome: categoriaFinanceira(d, id)?.nome ?? id, valor })).sort((a, b) => b.valor - a.valor); };
  const operacionais = porGrupo('despesa_operacional'), financeiras = porGrupo('despesa_financeira'), outras = porGrupo('outras'), soma = (l: { valor: number }[]) => l.reduce((s, x) => s + x.valor, 0);
  const resultado = lucroBruto - soma(operacionais) - soma(financeiras) - soma(outras);
  return { mes, receitaBruta, balcao, encomendas: encomendasReceita, descontos, taxas, receitaLiquida, cmv, semFicha: [...semFicha], semFichaValor, lucroBruto, margemBruta: receitaLiquida ? lucroBruto / receitaLiquida * 100 : 0, operacionais, financeiras, outras, resultado, margemLiquida: receitaLiquida ? resultado / receitaLiquida * 100 : 0 };
}
export function variacao(atual: number, anterior: number) { return anterior ? (atual - anterior) / Math.abs(anterior) * 100 : undefined; }
/** Soma recebida nos caixas fechados do mês (vendas e encomendas), para conferir com a receita do DRE. */
export function recebidoEmCaixasFechados(d: DadosPrototipo, lojaId: string, mes: string) {
  const [inicio, fim] = limitesMes(mes), caixas = d.caixas.filter(c => c.status === 'fechado' && daLoja(lojaId, c.lojaId) && c.data >= inicio && c.data <= fim);
  return caixas.reduce((s, c) => s + d.vendas.filter(v => v.caixaId === c.id && v.status === 'concluida').reduce((t, v) => t + v.pagamentos.reduce((u, p) => u + p.valorCentavos, 0), 0) + d.encomendas.filter(e => e.lojaId === c.lojaId).reduce((t, e) => t + e.pagamentos.filter(p => dia(p.data) === c.data).reduce((u, p) => u + p.valorCentavos, 0), 0), 0);
}

/** Explica a diferença entre a receita bruta do DRE (competência) e o recebido nos caixas fechados (caixa):
 * receita = caixas − recebido no mês de outras encomendas + recebido fora do mês ou fora de caixa fechado + saldo em aberto + descontos. */
export function conferenciaReceita(d: DadosPrototipo, lojaId: string, mes: string) {
  const { inicio, fim, vendas, encomendas } = itensDoMes(d, lojaId, mes), caixas = recebidoEmCaixasFechados(d, lojaId, mes), ids = new Set(encomendas.map(e => e.id));
  const fechado = (lojaIdCaixa: string, data: string) => d.caixas.some(c => c.lojaId === lojaIdCaixa && c.data === data && c.status === 'fechado');
  const outras = d.encomendas.filter(e => daLoja(lojaId, e.lojaId) && !ids.has(e.id)).flatMap(e => e.pagamentos.filter(p => dia(p.data) >= inicio && dia(p.data) <= fim && fechado(e.lojaId, dia(p.data)))).reduce((s, p) => s + p.valorCentavos, 0);
  const foraDoMes = encomendas.flatMap(e => e.pagamentos.filter(p => !(dia(p.data) >= inicio && dia(p.data) <= fim && fechado(e.lojaId, dia(p.data))))).reduce((s, p) => s + p.valorCentavos, 0) + vendas.filter(v => d.caixas.find(c => c.id === v.caixaId)?.status !== 'fechado').reduce((s, v) => s + v.pagamentos.reduce((t, p) => t + p.valorCentavos, 0), 0);
  const saldo = encomendas.reduce((s, e) => s + brutoEncomenda(e) - e.descontoCentavos - e.pagamentos.reduce((t, p) => t + p.valorCentavos, 0), 0), descontos = vendas.reduce((s, v) => s + v.descontoCentavos, 0) + encomendas.reduce((s, e) => s + e.descontoCentavos, 0);
  const receitaBruta = dreDoMes(d, lojaId, mes).receitaBruta, explicado = caixas - outras + foraDoMes + saldo + descontos;
  return { receitaBruta, caixas, outras, foraDoMes, saldo, descontos, diferenca: receitaBruta - explicado };
}

/** Conciliação: por dia e forma (exceto dinheiro), vendido, taxa, líquido e data prevista; conferência gravada. */
export function conciliacao(d: DadosPrototipo, lojaId: string, inicio: string, fim: string, formaId = '') {
  const mapa = new Map<string, { lojaId: string; data: string; formaPagamentoId: string; vendido: number }>();
  recebimentos(d, lojaId).filter(r => r.formaPagamentoId !== 'dinheiro' && r.valor > 0 && r.data >= inicio && r.data <= fim && (!formaId || r.formaPagamentoId === formaId)).forEach(r => { const k = `${r.lojaId}|${r.data}|${r.formaPagamentoId}`; const x = mapa.get(k) ?? { lojaId: r.lojaId, data: r.data, formaPagamentoId: r.formaPagamentoId, vendido: 0 }; x.vendido += r.valor; mapa.set(k, x); });
  return [...mapa.values()].sort((a, b) => b.data.localeCompare(a.data) || a.formaPagamentoId.localeCompare(b.formaPagamentoId)).map(x => { const f = forma(d, x.formaPagamentoId), taxa = Math.round(x.vendido * (f?.taxaPercentual ?? 0) / 100), c = d.conciliacoes.find(y => y.lojaId === x.lojaId && y.data === x.data && y.formaPagamentoId === x.formaPagamentoId); return { ...x, chave: `${x.lojaId}|${x.data}|${x.formaPagamentoId}`, taxaPercentual: f?.taxaPercentual ?? 0, taxa, liquido: x.vendido - taxa, dataPrevista: somarDias(x.data, f?.prazoRecebimentoDias ?? 0), conferido: c, diferenca: c ? c.recebidoCentavos - (x.vendido - taxa) : undefined }; });
}
export function resumoFinanceiro(d: DadosPrototipo, lojaId: string, hoje: string) {
  const mes = hoje.slice(0, 7), [inicio, fim] = limitesMes(mes), r = realizado(d, lojaId, inicio, fim, hoje), entradas = r.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0), saidas = r.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0), semana = somarDias(hoje, 7);
  const pagar = d.contasPagar.filter(c => c.status === 'aberta' && daLoja(lojaId, c.lojaId)), receber: (ContaReceber | ReturnType<typeof aReceberEncomendas>[number])[] = [...d.contasReceber.filter(c => c.status === 'aberta' && daLoja(lojaId, c.lojaId)), ...aReceberEncomendas(d, lojaId)];
  return { entradas, saidas, resultado: entradas - saidas, pagar7: pagar.filter(c => c.vencimento >= hoje && c.vencimento <= semana), receber7: receber.filter(c => c.vencimento >= hoje && c.vencimento <= semana), atrasadasPagar: pagar.filter(c => c.vencimento < hoje), atrasadasReceber: d.contasReceber.filter(c => c.status === 'aberta' && daLoja(lojaId, c.lojaId) && c.vencimento < hoje) };
}
export function filtrarContasPagar(d: DadosPrototipo, lojaId: string, f: { inicio?: string; fim?: string; status?: string; categoria?: string; fornecedorId?: string; origem?: string }): ContaPagar[] {
  return d.contasPagar.filter(c => daLoja(lojaId, c.lojaId) && (!f.inicio || c.vencimento >= f.inicio) && (!f.fim || c.vencimento <= f.fim) && (!f.status || c.status === f.status) && (!f.categoria || c.categoriaFinanceiraId === f.categoria) && (!f.fornecedorId || c.fornecedorId === f.fornecedorId) && (!f.origem || c.origem === f.origem)).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}
