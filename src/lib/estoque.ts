// Saldos, movimentos, contagem e baixa automática. Saldo é sempre a soma dos movimentos.
import type { Contagem, DadosPrototipo, Encomenda, Estoque, ItemEncomenda, MovimentoEstoque, Venda } from './tipos';

export const MOTIVOS_RETIRADA = ['Consumo interno', 'Pró-labore', 'Desperdício', 'Vencimento', 'Quebra ou dano', 'Outros'] as const;
export const MOTIVOS_PERDA = ['Desperdício', 'Vencimento', 'Quebra ou dano'];
export const NOMES_MOVIMENTO: Record<MovimentoEstoque['tipo'], string> = { entrada_compra: 'Entrada por compra', entrada_avulsa: 'Entrada sem nota', saida_producao: 'Saída para produção', saida_venda: 'Saída por venda', transferencia: 'Transferência', ajuste_contagem: 'Ajuste de contagem', retirada: 'Retirada' };
const id = () => crypto.randomUUID();

/** Efeito do movimento em um estoque: positivo entra, negativo sai. */
export function efeito(m: MovimentoEstoque, estoqueId: string) { return (m.estoqueDestinoId === estoqueId ? m.quantidade : 0) - (m.estoqueOrigemId === estoqueId ? m.quantidade : 0); }
export function saldo(dados: DadosPrototipo, estoqueId: string, insumoId: string, ate?: string) { return dados.movimentosEstoque.reduce((s, m) => m.insumoId === insumoId && (!ate || m.data <= ate) ? s + efeito(m, estoqueId) : s, 0); }
export function estoquesDaLoja(dados: DadosPrototipo, lojaId: string, incluirInativos = false) { return dados.estoques.filter(e => (incluirInativos || e.ativo) && (lojaId === 'consolidado' || e.lojaId === lojaId)); }
export function estoquePadrao(dados: DadosPrototipo, lojaId: string, tipo: 'compras' | 'baixas') { return dados.estoques.find(e => e.ativo && e.lojaId === lojaId && (tipo === 'compras' ? e.padraoCompras : e.padraoBaixas)); }
export function custoDoMovimento(dados: DadosPrototipo, m: MovimentoEstoque) { const i = dados.insumos.find(x => x.id === m.insumoId); return i && i.fatorConversao > 0 ? m.quantidade / i.fatorConversao * m.custoUnitarioCentavos : 0; }
export function valorEmEstoque(dados: DadosPrototipo, insumoId: string, quantidade: number) { const i = dados.insumos.find(x => x.id === insumoId); return i && i.fatorConversao > 0 ? quantidade / i.fatorConversao * i.custoAtualCentavos : 0; }

export function tabelaSaldos(dados: DadosPrototipo, lojaId: string, filtros: { estoqueId?: string; categoriaId?: string } = {}) {
  const estoques = estoquesDaLoja(dados, lojaId).filter(e => !filtros.estoqueId || e.id === filtros.estoqueId);
  return { estoques, linhas: dados.insumos.filter(i => i.ativo && (!filtros.categoriaId || i.categoriaId === filtros.categoriaId)).map(i => { const porEstoque = Object.fromEntries(estoques.map(e => [e.id, saldo(dados, e.id, i.id)])), total = Object.values(porEstoque).reduce((s, v) => s + v, 0); return { insumo: i, porEstoque, total, valor: valorEmEstoque(dados, i.id, total), abaixo: abaixoDoMinimo(dados, lojaId, i.id) }; }) };
}
/** Compara o total de cada loja com o mínimo do insumo. No Consolidado, vale se alguma loja estiver abaixo. */
export function abaixoDoMinimo(dados: DadosPrototipo, lojaId: string, insumoId: string) {
  const i = dados.insumos.find(x => x.id === insumoId); if (!i || !i.ativo || !i.estoqueMinimo) return false;
  const lojas = lojaId === 'consolidado' ? dados.lojas.map(l => l.id) : [lojaId];
  return lojas.some(l => estoquesDaLoja(dados, l).reduce((s, e) => s + saldo(dados, e.id, insumoId), 0) < i.estoqueMinimo);
}
export function insumosAbaixoDoMinimo(dados: DadosPrototipo, lojaId: string) { return dados.insumos.filter(i => abaixoDoMinimo(dados, lojaId, i.id)); }

type NovoMovimento = Omit<MovimentoEstoque, 'id' | 'data' | 'custoUnitarioCentavos' | 'usuarioId'>;
function criar(dados: DadosPrototipo, m: NovoMovimento, usuarioId: string, data: string): MovimentoEstoque { return { ...m, id: id(), data, usuarioId, custoUnitarioCentavos: dados.insumos.find(i => i.id === m.insumoId)?.custoAtualCentavos ?? 0 }; }
export function registrarMovimentos(dados: DadosPrototipo, lista: NovoMovimento[], usuarioId: string, data = new Date().toISOString()) {
  if (lista.some(m => !dados.insumos.some(i => i.id === m.insumoId) || !Number.isFinite(m.quantidade) || m.quantidade === 0)) throw new Error('Informe insumos e quantidades válidas.');
  return { ...dados, movimentosEstoque: [...dados.movimentosEstoque, ...lista.map(m => criar(dados, m, usuarioId, data))] };
}
export type ItemQuantidade = { insumoId: string; quantidade: number };
/** Itens que deixariam saldo negativo na origem. A tela avisa e pede confirmação com motivo. */
export function faltas(dados: DadosPrototipo, estoqueId: string, itens: ItemQuantidade[]) { const soma = new Map<string, number>(); itens.forEach(i => soma.set(i.insumoId, (soma.get(i.insumoId) ?? 0) + i.quantidade)); return [...soma].flatMap(([insumoId, q]) => { const s = saldo(dados, estoqueId, insumoId); return q > s ? [{ insumoId, saldo: s, quantidade: q }] : []; }); }
export function transferir(dados: DadosPrototipo, origem: string, destino: string, itens: ItemQuantidade[], usuarioId: string, motivoSaldoNegativo = '') {
  if (!origem || !destino || origem === destino) throw new Error('Escolha origem e destino diferentes.');
  if (!itens.length || itens.some(i => !(i.quantidade > 0))) throw new Error('Inclua itens com quantidade maior que zero.');
  if (faltas(dados, origem, itens).length && !motivoSaldoNegativo.trim()) throw new Error('Saldo insuficiente na origem. Confirme e informe o motivo para continuar.');
  return registrarMovimentos(dados, itens.map(i => ({ tipo: 'transferencia', insumoId: i.insumoId, quantidade: i.quantidade, estoqueOrigemId: origem, estoqueDestinoId: destino, descricao: motivoSaldoNegativo ? `Saldo negativo autorizado: ${motivoSaldoNegativo}` : '' })), usuarioId);
}
export function entradaOuRetirada(dados: DadosPrototipo, tipo: 'entrada' | 'retirada', estoqueId: string, itens: ItemQuantidade[], motivo: string, descricao: string, usuarioId: string) {
  if (!estoqueId || !itens.length || itens.some(i => !(i.quantidade > 0))) throw new Error('Escolha o estoque e inclua itens com quantidade maior que zero.');
  if (tipo === 'retirada' && !MOTIVOS_RETIRADA.includes(motivo as typeof MOTIVOS_RETIRADA[number])) throw new Error('Escolha o motivo da retirada.');
  if ((motivo === 'Desperdício' || tipo === 'entrada') && !descricao.trim()) throw new Error(motivo === 'Desperdício' ? 'Descreva o que aconteceu no desperdício.' : 'Descreva a origem da entrada.');
  return registrarMovimentos(dados, itens.map(i => tipo === 'entrada' ? { tipo: 'entrada_avulsa' as const, insumoId: i.insumoId, quantidade: i.quantidade, estoqueDestinoId: estoqueId, motivo: motivo || undefined, descricao } : { tipo: 'retirada' as const, insumoId: i.insumoId, quantidade: i.quantidade, estoqueOrigemId: estoqueId, motivo, descricao }), usuarioId);
}

// Contagem
export function iniciarContagem(dados: DadosPrototipo, estoqueId: string, usuarioId: string): { dados: DadosPrototipo; contagem: Contagem } {
  if (dados.contagens.some(c => c.estoqueId === estoqueId && c.status === 'rascunho')) throw new Error('Já existe uma contagem em andamento neste estoque.');
  const contagem: Contagem = { id: id(), estoqueId, data: new Date().toISOString(), status: 'rascunho', usuarioId, itens: dados.insumos.filter(i => i.ativo).map(i => ({ insumoId: i.id, saldoSistema: 0, contado: null, diferenca: 0 })) };
  return { dados: { ...dados, contagens: [...dados.contagens, contagem] }, contagem };
}
export function salvarContagem(dados: DadosPrototipo, contagem: Contagem) { return { ...dados, contagens: dados.contagens.map(c => c.id === contagem.id ? contagem : c) }; }
/** Diferenças pelo saldo atual. Itens não contados ficam fora do ajuste. */
export function diferencasContagem(dados: DadosPrototipo, c: Contagem) { return c.itens.filter(i => i.contado !== null).map(i => { const s = saldo(dados, c.estoqueId, i.insumoId), dif = (i.contado ?? 0) - s; return { insumoId: i.insumoId, saldoSistema: s, contado: i.contado!, diferenca: dif, valor: valorEmEstoque(dados, i.insumoId, dif) }; }); }
export function concluirContagem(dados: DadosPrototipo, contagemId: string, usuarioId: string) {
  const c = dados.contagens.find(x => x.id === contagemId); if (!c || c.status !== 'rascunho') throw new Error('Contagem indisponível.');
  const difs = diferencasContagem(dados, c); if (!difs.length) throw new Error('Informe ao menos um item contado.');
  const ajustes = difs.filter(d => d.diferenca !== 0), agora = new Date().toISOString();
  const novo = ajustes.length ? registrarMovimentos(dados, ajustes.map(d => ({ tipo: 'ajuste_contagem', insumoId: d.insumoId, quantidade: d.diferenca, estoqueDestinoId: c.estoqueId, descricao: 'Ajuste da contagem', referencia: { tipo: 'contagem', id: c.id } })), usuarioId, agora) : dados;
  return salvarContagem(novo, { ...c, status: 'concluida', concluidaEm: agora, itens: difs.map(({ valor, ...d }) => { void valor; return d; }) });
}
export function valorAjustadoContagem(dados: DadosPrototipo, c: Contagem) { return dados.movimentosEstoque.filter(m => m.referencia?.tipo === 'contagem' && m.referencia.id === c.id).reduce((s, m) => s + custoDoMovimento(dados, m), 0); }

// Perdas
export function perdas(dados: DadosPrototipo, lojaId: string, inicio: string, fim: string) {
  const ids = new Set(estoquesDaLoja(dados, lojaId, true).map(e => e.id));
  const lista = dados.movimentosEstoque.filter(m => m.tipo === 'retirada' && MOTIVOS_PERDA.includes(m.motivo ?? '') && ids.has(m.estoqueOrigemId ?? '') && m.data.slice(0, 10) >= inicio && m.data.slice(0, 10) <= fim);
  const soma = <K extends string>(chave: (m: MovimentoEstoque) => K) => { const r = new Map<K, number>(); lista.forEach(m => r.set(chave(m), (r.get(chave(m)) ?? 0) + custoDoMovimento(dados, m))); return [...r].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor); };
  return { total: lista.reduce((s, m) => s + custoDoMovimento(dados, m), 0), porMotivo: soma(m => m.motivo ?? 'Outros'), porInsumo: soma(m => m.insumoId).slice(0, 10), porMes: soma(m => m.data.slice(0, 7)).sort((a, b) => a.nome.localeCompare(b.nome)), movimentos: lista };
}

// Baixa automática pela ficha técnica.
type Acumulado = Map<string, number>;
function somar(acc: Acumulado, insumoId: string, q: number) { acc.set(insumoId, (acc.get(insumoId) ?? 0) + q); }
export function explodirFicha(dados: DadosPrototipo, fichaId: string, quantidade: number, acc: Acumulado = new Map(), caminho: string[] = []) {
  const f = dados.fichas.find(x => x.id === fichaId); if (!f || caminho.includes(fichaId) || !(f.rendimentoQuantidade > 0)) return acc;
  const fator = quantidade / f.rendimentoQuantidade * (1 + (f.perdaPercentual ?? 0) / 100);
  for (const c of f.componentes) { if (c.tipo === 'insumo') somar(acc, c.insumoId, c.quantidade * fator); else explodirFicha(dados, c.fichaId, c.quantidade * fator, acc, [...caminho, fichaId]); }
  return acc;
}
const multiplicador = { unidade: 1, cento: 100, kg: 1000 } as const;
/** Insumos de um item. Retorna também o nome do item quando falta ficha. */
export function necessidadeItem(dados: DadosPrototipo, item: ItemEncomenda): { insumos: Acumulado; semFicha?: string } {
  const acc: Acumulado = new Map();
  if (item.tipo === 'bolo') {
    const m = dados.montagemBolo, t = m.tamanhos.find(x => x.tamanhoId === item.tamanho); if (!t) return { insumos: acc, semFicha: 'Bolo sem montagem de tamanho' };
    const porVinculo = (opcaoId: string, gramas?: number) => { const v = m.vinculos[opcaoId]; if (!v) return false; if (v.tipo === 'ficha') explodirFicha(dados, v.fichaId, gramas ?? v.quantidade, acc); else somar(acc, v.insumoId, gramas ?? v.quantidade); return true; };
    const faltando = [!porVinculo(item.massa, t.gramasMassa) && 'massa', ...item.recheios.map(r => !porVinculo(r, t.gramasRecheio / item.recheios.length) && 'recheio'), ...[...item.adicionais, ...item.decoracoes].map(o => !porVinculo(o) && 'opção')].filter(Boolean);
    t.fixos.forEach(c => { if (c.tipo === 'insumo') somar(acc, c.insumoId, c.quantidade); else explodirFicha(dados, c.fichaId, c.quantidade, acc); });
    return { insumos: acc, semFicha: faltando.length ? `Bolo (${faltando.join(', ')})` : undefined };
  }
  const produto = dados.produtos.find(p => p.id === item.produtoId), unidades = item.quantidade * multiplicador[item.unidadeVenda ?? produto?.unidadeVenda ?? 'unidade'];
  const ficha = dados.fichas.find(f => f.produtoId === item.produtoId); if (ficha) return { insumos: explodirFicha(dados, ficha.id, unidades, acc) };
  const revenda = dados.insumos.find(i => i.produtoRevendaId === item.produtoId); if (revenda) { somar(acc, revenda.id, unidades); return { insumos: acc }; }
  return { insumos: acc, semFicha: produto?.nome ?? 'Produto' };
}
const arredondar = (q: number) => Math.round(q * 100) / 100;
function baixar(dados: DadosPrototipo, lojaId: string, itens: ItemEncomenda[], tipo: 'saida_producao' | 'saida_venda', referencia: MovimentoEstoque['referencia'], usuarioId: string) {
  const estoque = estoquePadrao(dados, lojaId, 'baixas'), semFicha: string[] = [], acc: Acumulado = new Map();
  for (const item of itens) { const r = necessidadeItem(dados, item); if (r.semFicha) semFicha.push(r.semFicha); r.insumos.forEach((q, i) => somar(acc, i, q)); }
  if (!estoque) return { dados, semFicha: [...semFicha, 'Loja sem estoque padrão de baixas'] };
  const lista = [...acc].map(([insumoId, q]) => ({ tipo, insumoId, quantidade: arredondar(q), estoqueOrigemId: estoque.id, descricao: 'Baixa automática pela ficha técnica', referencia })).filter(m => m.quantidade > 0);
  return { dados: lista.length ? registrarMovimentos(dados, lista, usuarioId) : dados, semFicha };
}
/** Desfaz as baixas ainda ativas de uma referência, com movimentos de quantidade negativa. */
export function estornar(dados: DadosPrototipo, referencia: NonNullable<MovimentoEstoque['referencia']>, usuarioId: string) {
  const daRef = dados.movimentosEstoque.filter(m => m.referencia?.tipo === referencia.tipo && m.referencia.id === referencia.id && (m.tipo === 'saida_producao' || m.tipo === 'saida_venda'));
  const ativos = daRef.filter(m => m.quantidade > 0 && !daRef.some(x => x.estornoDe === m.id));
  if (!ativos.length) return dados;
  const agora = new Date().toISOString();
  return { ...dados, movimentosEstoque: [...dados.movimentosEstoque, ...ativos.map(m => ({ ...m, id: id(), data: agora, usuarioId, quantidade: -m.quantidade, estornoDe: m.id, descricao: 'Estorno da baixa automática' }))] };
}
export function baixarEncomenda(dados: DadosPrototipo, e: Encomenda, usuarioId: string) { return baixar(dados, e.lojaId, e.itens, 'saida_producao', { tipo: 'encomenda', id: e.id }, usuarioId); }
export function baixarVenda(dados: DadosPrototipo, v: Venda, usuarioId: string) { return baixar(dados, v.lojaId, v.itens, 'saida_venda', { tipo: 'venda', id: v.id }, usuarioId); }
export function novoEstoque(lojaId: string): Estoque { return { id: id(), nome: '', lojaId, tipo: 'outro', padraoCompras: false, padraoBaixas: false, ativo: true }; }
/** Um padrão de compras e um de baixas por loja: marcar um desmarca o anterior. */
export function salvarEstoque(dados: DadosPrototipo, e: Estoque) {
  if (!e.nome.trim() || !dados.lojas.some(l => l.id === e.lojaId)) throw new Error('Informe nome e loja do estoque.');
  if (!e.ativo && (e.padraoCompras || e.padraoBaixas)) throw new Error('Estoque padrão não pode ser inativado. Defina outro padrão antes.');
  const lista = dados.estoques.some(x => x.id === e.id) ? dados.estoques.map(x => x.id === e.id ? e : x) : [...dados.estoques, e];
  return { ...dados, estoques: lista.map(x => x.id === e.id || x.lojaId !== e.lojaId ? x : { ...x, padraoCompras: e.padraoCompras ? false : x.padraoCompras, padraoBaixas: e.padraoBaixas ? false : x.padraoBaixas }) };
}
