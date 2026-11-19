// Funções puras de custo. Recebem os dados e não gravam nada.
// Valores intermediários ficam em centavos com fração; arredonde só ao exibir.
import type { ComponenteFicha, DadosPrototipo, Encomenda, FichaTecnica, Insumo, ItemEncomenda } from './tipos';

export class ErroCicloFicha extends Error {}
export type CustoFicha = { total: number; final: number; porUnidade: number };
export type NoArvore = { id: string; nome: string; tipo: 'ficha' | 'insumo'; quantidade: number; unidade: string; custo: number; filhos: NoArvore[] };
type Bolo = Extract<ItemEncomenda, { tipo: 'bolo' }>;

export function custoPorUnidadeUso(insumo: Insumo) { return insumo.fatorConversao > 0 ? insumo.custoAtualCentavos / insumo.fatorConversao : 0; }
const nomeFicha = (dados: DadosPrototipo, id: string) => dados.fichas.find(f => f.id === id)?.nome ?? id;

export function custoFicha(dados: DadosPrototipo, id: string, caminho: string[] = []): CustoFicha {
  if (caminho.includes(id)) throw new ErroCicloFicha(`Ciclo entre fichas: ${[...caminho.slice(caminho.indexOf(id)), id].map(x => nomeFicha(dados, x)).join(' > ')}. Uma ficha não pode conter a si mesma, nem por outra ficha.`);
  const ficha = dados.fichas.find(f => f.id === id); if (!ficha) return { total: 0, final: 0, porUnidade: 0 };
  const total = ficha.componentes.reduce((s, c) => s + custoComponente(dados, c, [...caminho, id]), 0), final = total * (1 + (ficha.perdaPercentual ?? 0) / 100);
  return { total, final, porUnidade: ficha.rendimentoQuantidade > 0 ? final / ficha.rendimentoQuantidade : 0 };
}
export function custoComponente(dados: DadosPrototipo, c: ComponenteFicha, caminho: string[] = []) {
  if (c.tipo === 'insumo') { const i = dados.insumos.find(x => x.id === c.insumoId); return i ? c.quantidade * custoPorUnidadeUso(i) : 0; }
  return c.quantidade * custoFicha(dados, c.fichaId, caminho).porUnidade;
}
export function unidadeComponente(dados: DadosPrototipo, c: ComponenteFicha) { return c.tipo === 'insumo' ? dados.insumos.find(i => i.id === c.insumoId)?.unidadeUso ?? 'un' : dados.fichas.find(f => f.id === c.fichaId)?.rendimentoUnidade ?? 'g'; }
export function nomeComponente(dados: DadosPrototipo, c: ComponenteFicha) { return c.tipo === 'insumo' ? dados.insumos.find(i => i.id === c.insumoId)?.nome ?? 'Insumo removido' : nomeFicha(dados, c.fichaId); }

/** Valida a ficha como se já estivesse salva, inclusive ciclos. Retorna a lista de erros. */
export function validarFicha(dados: DadosPrototipo, ficha: FichaTecnica) {
  const erros: string[] = [];
  if (!ficha.nome.trim()) erros.push('Informe o nome da ficha.');
  if (!(ficha.rendimentoQuantidade > 0)) erros.push('Informe um rendimento maior que zero.');
  if ((ficha.perdaPercentual ?? 0) < 0 || (ficha.perdaPercentual ?? 0) >= 100) erros.push('A perda deve ficar entre 0% e 99%.');
  if (!ficha.componentes.length) erros.push('Inclua pelo menos um insumo ou ficha.');
  if (ficha.componentes.some(c => !(c.quantidade > 0))) erros.push('Cada linha precisa de quantidade maior que zero.');
  if (ficha.componentes.some(c => c.tipo === 'ficha' && c.fichaId === ficha.id)) erros.push('Uma ficha não pode usar a si mesma.');
  else try { const lista = dados.fichas.some(f => f.id === ficha.id) ? dados.fichas.map(f => f.id === ficha.id ? ficha : f) : [...dados.fichas, ficha]; custoFicha({ ...dados, fichas: lista }, ficha.id); } catch (e) { if (e instanceof ErroCicloFicha) erros.push(e.message); else throw e; }
  return erros;
}

export function arvoreFicha(dados: DadosPrototipo, id: string, quantidade?: number, caminho: string[] = []): NoArvore {
  const ficha = dados.fichas.find(f => f.id === id)!, custo = custoFicha(dados, id, caminho), q = quantidade ?? ficha.rendimentoQuantidade;
  return { id, nome: ficha.nome, tipo: 'ficha', quantidade: q, unidade: ficha.rendimentoUnidade, custo: q * custo.porUnidade, filhos: ficha.componentes.map(c => c.tipo === 'ficha' ? arvoreFicha(dados, c.fichaId, c.quantidade, [...caminho, id]) : { id: c.insumoId, nome: nomeComponente(dados, c), tipo: 'insumo', quantidade: c.quantidade, unidade: unidadeComponente(dados, c), custo: custoComponente(dados, c), filhos: [] }) };
}
export function fichasQueUsamInsumo(dados: DadosPrototipo, insumoId: string) { return dados.fichas.filter(f => f.componentes.some(c => c.tipo === 'insumo' && c.insumoId === insumoId)); }
export function ondeFichaEUsada(dados: DadosPrototipo, fichaId: string) {
  const o = dados.opcoesBolo, todas = [...o.massas, ...o.recheios, ...o.adicionais, ...o.decoracoes];
  return { fichas: dados.fichas.filter(f => f.componentes.some(c => c.tipo === 'ficha' && c.fichaId === fichaId)), opcoes: Object.entries(dados.montagemBolo.vinculos).filter(([, c]) => c.tipo === 'ficha' && c.fichaId === fichaId).map(([id]) => todas.find(x => x.id === id)?.nome ?? id), tamanhos: dados.montagemBolo.tamanhos.filter(t => t.fixos.some(c => c.tipo === 'ficha' && c.fichaId === fichaId)).map(t => o.tamanhos.find(x => x.id === t.tamanhoId)?.nome ?? t.tamanhoId) };
}
export function margem(precoCentavos: number, custoCentavos: number) { return { valor: precoCentavos - custoCentavos, percentual: precoCentavos > 0 ? (precoCentavos - custoCentavos) / precoCentavos * 100 : 0 }; }
const multiplicador = { unidade: 1, cento: 100, kg: 1000 } as const;
/** Custo de uma unidade de venda do produto, pela ficha vinculada ou pelo insumo de revenda. */
export function custoProduto(dados: DadosPrototipo, produtoId: string): number | undefined {
  const produto = dados.produtos.find(p => p.id === produtoId), m = multiplicador[produto?.unidadeVenda ?? 'unidade'];
  const ficha = dados.fichas.find(f => f.produtoId === produtoId); if (ficha) return custoFicha(dados, ficha.id).porUnidade * m;
  const revenda = dados.insumos.find(i => i.produtoRevendaId === produtoId); return revenda ? custoPorUnidadeUso(revenda) * m : undefined;
}

/** Custo do bolo por combinação: massa e recheios por gramas do tamanho; adicionais, decorações e fixos pelos vínculos. */
export function custoBolo(dados: DadosPrototipo, bolo: Bolo, precoCentavos = bolo.valorCentavos) {
  const m = dados.montagemBolo, t = m.tamanhos.find(x => x.tamanhoId === bolo.tamanho), avisos: string[] = [], o = dados.opcoesBolo;
  const nome = (id: string) => [...o.massas, ...o.recheios, ...o.adicionais, ...o.decoracoes].find(x => x.id === id)?.nome ?? id;
  const porFicha = (opcaoId: string, gramas: number) => { const v = m.vinculos[opcaoId]; if (!v) { avisos.push(`Sem ficha técnica para ${nome(opcaoId)}`); return 0; } return v.tipo === 'ficha' ? gramas * custoFicha(dados, v.fichaId).porUnidade : custoComponente(dados, { ...v, quantidade: gramas }); };
  const vinculo = (opcaoId: string) => { const v = m.vinculos[opcaoId]; if (!v) { avisos.push(`Sem ficha técnica para ${nome(opcaoId)}`); return 0; } return custoComponente(dados, v); };
  if (!t && bolo.tamanho) avisos.push('Tamanho sem montagem cadastrada');
  const massa = t && bolo.massa ? porFicha(bolo.massa, t.gramasMassa) : 0;
  const recheios = t ? bolo.recheios.reduce((s, id) => s + porFicha(id, t.gramasRecheio / bolo.recheios.length), 0) : 0;
  const adicionais = bolo.adicionais.reduce((s, id) => s + vinculo(id), 0), decoracoes = bolo.decoracoes.reduce((s, id) => s + vinculo(id), 0);
  const fixos = t ? t.fixos.reduce((s, c) => s + custoComponente(dados, c), 0) : 0, total = massa + recheios + adicionais + decoracoes + fixos;
  return { massa, recheios, adicionais, decoracoes, fixos, total, preco: precoCentavos, ...(() => { const r = margem(precoCentavos, total); return { margem: r.valor, margemPercentual: r.percentual }; })(), avisos };
}

/** Combinações principais: cada tamanho ativo com cada massa ativa e o primeiro recheio ativo. */
export function tabelaCustoTamanhoMassa(dados: DadosPrototipo, preco: (b: Bolo) => number) {
  const ativos = <T extends { ativo: boolean; ordem: number }>(l: T[]) => l.filter(x => x.ativo).sort((a, b) => a.ordem - b.ordem), o = dados.opcoesBolo, recheio = ativos(o.recheios)[0];
  return ativos(o.tamanhos).flatMap(t => ativos(o.massas).map(ms => { const bolo: Bolo = { id: `${t.id}-${ms.id}`, tipo: 'bolo', formato: '', tamanho: t.id, massa: ms.id, recheios: recheio ? [recheio.id] : [], adicionais: [], decoracoes: [], detalhes: '', valorCentavos: 0 }; const c = custoBolo(dados, bolo, preco(bolo)); return { id: bolo.id, tamanho: t.nome, massa: ms.nome, recheio: recheio?.nome ?? 'Sem recheio', custo: c.total, preco: c.preco, margem: c.margem, percentual: c.margemPercentual, baixa: c.margemPercentual < dados.montagemBolo.limiteMargemPercentual }; }));
}

/** Custo estimado da encomenda pelos preços atuais dos insumos; receita pelos valores salvos no pedido. */
export function custoEncomenda(dados: DadosPrototipo, e: Encomenda) {
  const semFicha: string[] = [];
  const itens = e.itens.map(i => { if (i.tipo === 'bolo') { const c = custoBolo(dados, i); semFicha.push(...c.avisos); return { id: i.id, custo: c.total, preco: i.valorCentavos }; } const unitario = custoProduto(dados, i.produtoId); if (unitario === undefined) semFicha.push(`Sem ficha técnica para ${dados.produtos.find(p => p.id === i.produtoId)?.nome ?? 'produto'}`); return { id: i.id, custo: (unitario ?? 0) * i.quantidade, preco: i.quantidade * i.valorUnitarioCentavos }; });
  const custo = itens.reduce((s, i) => s + i.custo, 0), receita = itens.reduce((s, i) => s + i.preco, 0) - e.descontoCentavos, r = margem(receita, custo);
  return { itens, custo, receita, margem: r.valor, percentual: r.percentual, semFicha: Array.from(new Set(semFicha)) };
}
export function insumosAlteradosRecentes(dados: DadosPrototipo, desde: string) {
  return dados.insumos.flatMap(i => { const h = [...i.historicoPrecos].sort((a, b) => a.data.localeCompare(b.data)), recentes = h.filter(p => p.data.slice(0, 10) >= desde); if (!recentes.length) return []; const anterior = h[h.indexOf(recentes[0]) - 1]; return [{ insumo: i, anteriorCentavos: anterior?.valorCentavos ?? recentes[0].valorCentavos, atualCentavos: i.custoAtualCentavos, data: recentes.at(-1)!.data }]; }).sort((a, b) => b.data.localeCompare(a.data));
}
