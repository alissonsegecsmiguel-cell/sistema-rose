// Compras: conferência, lançamento, vínculos aprendidos e contas a pagar por categoria.
import type { Compra, ContaPagar, DadosPrototipo, Fornecedor, ItemCompra, ParcelaCompra } from './tipos';
import type { NotaLida } from './nfe';
import { formatarDocumento, normalizar } from './nfe';
import { estoquePadrao, registrarMovimentos } from './estoque';

const novoId = () => crypto.randomUUID();
export const CATEGORIA_SEM_ESTOQUE_PADRAO = 'limpeza';

export function totalItensCompra(c: Pick<Compra, 'itens'>) { return c.itens.reduce((s, i) => s + i.totalCentavos, 0); }
export function totalCompra(c: Pick<Compra, 'itens' | 'freteCentavos' | 'descontoCentavos'>) { return totalItensCompra(c) + c.freteCentavos - c.descontoCentavos; }
/** Custo por unidade de compra do insumo, a partir do item da nota. */
export function custoInsumoPeloItem(dados: DadosPrototipo, item: ItemCompra) { const i = dados.insumos.find(x => x.id === item.insumoId); return i && item.fatorConversao > 0 ? Math.round(item.valorUnitarioCentavos / item.fatorConversao * i.fatorConversao) : 0; }
export function fornecedorPorDocumento(dados: DadosPrototipo, documento: string) { const d = documento.replace(/\D/g, ''); return d ? dados.fornecedores.find(f => (f.documento ?? '').replace(/\D/g, '') === d) : undefined; }

/** Sugere o insumo pelo vínculo memorizado do fornecedor ou pelo nome mais parecido. */
export function sugerirVinculo(dados: DadosPrototipo, fornecedorId: string, descricao: string): { insumoId: string; fatorConversao: number; origem: 'vinculo' | 'nome' } | undefined {
  const n = normalizar(descricao), v = dados.vinculosFornecedor.find(x => x.fornecedorId === fornecedorId && normalizar(x.descricaoNota) === n);
  if (v) return { insumoId: v.insumoId, fatorConversao: v.fatorConversao, origem: 'vinculo' };
  const palavras = new Set(n.split(' ').filter(p => p.length > 2 && !/^\d/.test(p) && p !== 'teste'));
  const melhor = dados.insumos.filter(i => i.ativo).map(i => ({ i, pontos: normalizar(i.nome).split(' ').filter(p => p.length > 2 && p !== 'teste' && [...palavras].some(q => q.startsWith(p.slice(0, 4)) || p.startsWith(q.slice(0, 4)))).length })).sort((a, b) => b.pontos - a.pontos)[0];
  return melhor && melhor.pontos > 0 ? { insumoId: melhor.i.id, fatorConversao: melhor.i.fatorConversao, origem: 'nome' } : undefined;
}
export function novaCompra(dados: DadosPrototipo, lojaId: string, usuarioId: string, data: string): Compra {
  return { id: novoId(), lojaId, fornecedorId: '', data, numeroNota: '', origem: 'manual', itens: [], freteCentavos: 0, descontoCentavos: 0, totalCentavos: 0, estoqueDestinoId: estoquePadrao(dados, lojaId, 'compras')?.id ?? '', condicao: 'a_vista', parcelas: [], formaPagamentoId: dados.formasPagamento[0]?.id, status: 'rascunho', usuarioId };
}
export function novoItemCompra(): ItemCompra { return { descricaoNota: '', quantidade: 1, unidade: 'UN', fatorConversao: 1, valorUnitarioCentavos: 0, totalCentavos: 0 }; }
/** Monta a compra a partir do XML lido, com sugestões de vínculo já aplicadas. */
export function compraDaNota(dados: DadosPrototipo, nota: NotaLida, lojaId: string, usuarioId: string): { compra: Compra; fornecedorNovo?: Fornecedor } {
  const fornecedor = fornecedorPorDocumento(dados, nota.emitenteDocumento), base = novaCompra(dados, lojaId, usuarioId, nota.dataEmissao || new Date().toISOString().slice(0, 10));
  const itens = nota.itens.map(i => { const s = fornecedor ? sugerirVinculo(dados, fornecedor.id, i.descricao) : sugerirVinculo(dados, '', i.descricao); return { descricaoNota: i.descricao, codigo: i.codigo, quantidade: i.quantidade, unidade: i.unidade, valorUnitarioCentavos: i.valorUnitarioCentavos, totalCentavos: i.totalCentavos, insumoId: s?.insumoId, fatorConversao: s?.fatorConversao ?? 1, sugestao: s?.origem }; });
  const compra = { ...base, fornecedorId: fornecedor?.id ?? '', numeroNota: nota.numero, origem: 'xml' as const, chaveNfe: nota.chave, itens, freteCentavos: nota.freteCentavos, descontoCentavos: nota.descontoCentavos, totalCentavos: nota.totalCentavos };
  return { compra, fornecedorNovo: fornecedor ? undefined : { id: novoId(), nome: nota.emitenteNome, documento: formatarDocumento(nota.emitenteDocumento), telefone: '', email: '', contato: '', categorias: [], prazoPadraoDias: 30, observacoes: 'Cadastrado a partir do XML da nota.', ativo: true } };
}
/** Parcelas com vencimentos a cada prazo do fornecedor; a última absorve o arredondamento. */
export function sugerirParcelas(total: number, quantidade: number, data: string, prazoDias: number): ParcelaCompra[] {
  const base = Math.floor(total / quantidade), d = (n: number) => { const x = new Date(`${data}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + prazoDias * n); return x.toISOString().slice(0, 10); };
  return Array.from({ length: quantidade }, (_, n) => ({ vencimento: d(n + 1), valorCentavos: n === quantidade - 1 ? total - base * (quantidade - 1) : base }));
}
export function validarCompra(dados: DadosPrototipo, c: Compra) {
  const e: string[] = [], total = totalCompra(c);
  if (!dados.fornecedores.some(f => f.id === c.fornecedorId)) e.push('Escolha o fornecedor.');
  if (!c.data) e.push('Informe a data da compra.');
  if (!c.itens.length) e.push('Inclua ao menos um item.');
  c.itens.forEach((i, n) => { if (!i.descricaoNota.trim() || !(i.quantidade > 0) || i.totalCentavos < 0) e.push(`Item ${n + 1}: informe descrição, quantidade e valor.`); else if (i.foraDoEstoque ? !i.categoriaDespesaId : !i.insumoId || !(i.fatorConversao > 0)) e.push(`Item ${n + 1}: vincule a um insumo com conversão ou marque Não entra no estoque com a categoria.`); });
  if (c.itens.some(i => !i.foraDoEstoque) && !dados.estoques.some(x => x.id === c.estoqueDestinoId && x.ativo)) e.push('Escolha o estoque de destino.');
  if (total <= 0) e.push('O total da compra deve ser maior que zero.');
  if (c.condicao === 'a_vista' && !c.formaPagamentoId) e.push('Escolha a forma de pagamento.');
  if (c.condicao === 'a_prazo' && (!c.parcelas.length || c.parcelas.some(p => !p.vencimento || !(p.valorCentavos > 0)) || c.parcelas.reduce((s, p) => s + p.valorCentavos, 0) !== total)) e.push(`As parcelas devem somar ${(total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, com vencimento e valor.`);
  return e;
}
const categoriaDoItem = (dados: DadosPrototipo, i: ItemCompra) => i.foraDoEstoque ? i.categoriaDespesaId! : dados.insumos.find(x => x.id === i.insumoId)?.categoriaId ?? CATEGORIA_SEM_ESTOQUE_PADRAO;
/** Valores por categoria de despesa, com frete e desconto rateados pelo valor dos itens. */
export function valoresPorCategoria(dados: DadosPrototipo, c: Compra) {
  const soma = new Map<string, number>(); c.itens.forEach(i => soma.set(categoriaDoItem(dados, i), (soma.get(categoriaDoItem(dados, i)) ?? 0) + i.totalCentavos));
  const itens = totalItensCompra(c), total = totalCompra(c), lista = [...soma].map(([categoria, v]) => ({ categoria, valor: itens > 0 ? Math.round(v * total / itens) : 0 }));
  if (lista.length) lista[lista.length - 1].valor += total - lista.reduce((s, x) => s + x.valor, 0);
  return lista;
}
export function lancarCompra(dados: DadosPrototipo, compra: Compra, usuarioId: string) {
  const erros = validarCompra(dados, compra); if (erros.length) throw new Error(erros.join(' '));
  if (dados.compras.some(c => c.id === compra.id && c.status === 'lancada')) throw new Error('Compra já lançada.');
  const agora = new Date().toISOString(), dataRegistro = `${compra.data}T12:00:00-03:00`, total = totalCompra(compra), c: Compra = { ...compra, totalCentavos: total, status: 'lancada', lancadaEm: agora, usuarioId };
  // 1. Custo atual e histórico do insumo (origem compra).
  let d: DadosPrototipo = { ...dados, insumos: dados.insumos.map(i => { const item = [...c.itens].reverse().find(x => !x.foraDoEstoque && x.insumoId === i.id); if (!item) return i; const valor = custoInsumoPeloItem(dados, item); return { ...i, custoAtualCentavos: valor, atualizadoEm: dataRegistro, historicoPrecos: [...i.historicoPrecos, { data: dataRegistro, valorCentavos: valor, origem: 'compra' as const, usuarioId, referencia: c.id }] }; }) };
  // 2. Entradas no estoque de destino.
  const entradas = c.itens.filter(i => !i.foraDoEstoque && i.insumoId).map(i => ({ tipo: 'entrada_compra' as const, insumoId: i.insumoId!, quantidade: Math.round(i.quantidade * i.fatorConversao * 100) / 100, estoqueDestinoId: c.estoqueDestinoId, descricao: `NF ${c.numeroNota || 'avulsa'}: ${i.descricaoNota}`, referencia: { tipo: 'compra' as const, id: c.id } }));
  if (entradas.length) d = registrarMovimentos(d, entradas, usuarioId, dataRegistro);
  // 3. Vínculos aprendidos para a próxima nota.
  const vinculos = [...d.vinculosFornecedor]; c.itens.filter(i => !i.foraDoEstoque && i.insumoId).forEach(i => { const n = normalizar(i.descricaoNota), idx = vinculos.findIndex(v => v.fornecedorId === c.fornecedorId && normalizar(v.descricaoNota) === n), v = { fornecedorId: c.fornecedorId, descricaoNota: i.descricaoNota, insumoId: i.insumoId!, fatorConversao: i.fatorConversao }; if (idx >= 0) vinculos[idx] = v; else vinculos.push(v); });
  // 4. Contas a pagar por categoria, mesmas parcelas.
  const fornecedor = d.fornecedores.find(f => f.id === c.fornecedorId), categorias = valoresPorCategoria(d, c), parcelas = c.condicao === 'a_vista' ? [{ vencimento: c.data, valorCentavos: total }] : c.parcelas;
  const contas: ContaPagar[] = categorias.flatMap(cat => { let restante = cat.valor; return parcelas.map((p, n) => { const valor = n === parcelas.length - 1 ? restante : Math.round(cat.valor * p.valorCentavos / total); restante -= valor; return { id: novoId(), lojaId: c.lojaId, descricao: `Compra NF ${c.numeroNota || 'avulsa'} • ${fornecedor?.nome ?? 'Fornecedor'} • ${d.categoriasInsumo.find(x => x.id === cat.categoria)?.nome ?? cat.categoria}`, categoriaFinanceiraId: cat.categoria, fornecedorId: c.fornecedorId, valorCentavos: valor, vencimento: p.vencimento, status: c.condicao === 'a_vista' ? 'paga' as const : 'aberta' as const, ...(c.condicao === 'a_vista' ? { pagamento: { data: dataRegistro, formaPagamentoId: c.formaPagamentoId!, origem: 'Compra à vista' } } : {}), origem: 'compra' as const, compraId: c.id, parcela: `${n + 1}/${parcelas.length}` }; }); });
  return { ...d, vinculosFornecedor: vinculos, contasPagar: [...d.contasPagar, ...contas], compras: d.compras.some(x => x.id === c.id) ? d.compras.map(x => x.id === c.id ? c : x) : [...d.compras, c] };
}
export function salvarRascunhoCompra(dados: DadosPrototipo, c: Compra) { if (c.status === 'lancada') throw new Error('Compra já lançada.'); const r = { ...c, totalCentavos: totalCompra(c) }; return { ...dados, compras: dados.compras.some(x => x.id === c.id) ? dados.compras.map(x => x.id === c.id ? r : x) : [...dados.compras, r] }; }
export function salvarFornecedor(dados: DadosPrototipo, f: Fornecedor) {
  if (!f.nome.trim()) throw new Error('Informe o nome do fornecedor.');
  const doc = (f.documento ?? '').replace(/\D/g, ''); if (doc && doc.length !== 11 && doc.length !== 14) throw new Error('Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.');
  if (doc && dados.fornecedores.some(x => x.id !== f.id && (x.documento ?? '').replace(/\D/g, '') === doc)) throw new Error('Já existe fornecedor com este documento.');
  const salvo = { ...f, nome: f.nome.trim(), documento: doc ? formatarDocumento(doc) : '' };
  return { ...dados, fornecedores: dados.fornecedores.some(x => x.id === f.id) ? dados.fornecedores.map(x => x.id === f.id ? salvo : x) : [...dados.fornecedores, salvo] };
}
export function novoFornecedor(): Fornecedor { return { id: novoId(), nome: '', documento: '', telefone: '', email: '', contato: '', categorias: [], prazoPadraoDias: 30, observacoes: '', ativo: true }; }
/** Preços por insumo: último por fornecedor, menor e maior do período e variação. */
export function precosInsumo(dados: DadosPrototipo, insumoId: string, desde: string) {
  const i = dados.insumos.find(x => x.id === insumoId)!, compras = dados.compras.filter(c => c.status === 'lancada' && c.itens.some(x => x.insumoId === insumoId)).sort((a, b) => a.data.localeCompare(b.data));
  const pontos = compras.map(c => { const item = c.itens.find(x => x.insumoId === insumoId)!; return { data: c.data, valor: custoInsumoPeloItem(dados, item), fornecedorId: c.fornecedorId }; }), periodo = pontos.filter(p => p.data >= desde);
  const ultimos = new Map<string, { data: string; valor: number }>(); pontos.forEach(p => ultimos.set(p.fornecedorId, p));
  const valores = periodo.map(p => p.valor), primeiro = periodo[0]?.valor, ultimo = periodo.at(-1)?.valor;
  return { insumo: i, pontos, periodo, porFornecedor: [...ultimos].map(([fornecedorId, p]) => ({ fornecedorId, ...p })), menor: valores.length ? Math.min(...valores) : undefined, maior: valores.length ? Math.max(...valores) : undefined, variacao: primeiro && ultimo ? (ultimo - primeiro) / primeiro * 100 : undefined };
}
