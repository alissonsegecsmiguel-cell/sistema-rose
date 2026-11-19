// Gerador determinístico do histórico de teste: mesma semente, mesmo resultado.
// Completa o passado (de 7 a 96 dias atrás) com vendas de balcão, encomendas entregues pagas na entrega,
// caixas fechados e despesas fixas mensais. Tudo marcado como teste. Os dados manuais dos JSON continuam valendo.
import type { Caixa, ContaPagar, DadosPrototipo, Encomenda, ItemEncomenda, Venda } from './tipos';

/** Gerador pseudoaleatório mulberry32: rápido e reprodutível. */
export function criarAleatorio(semente: number) { let a = semente >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const SEMENTE_HISTORICO = 20261118;
export const PRIMEIRO_DIA_HISTORICO = 7, ULTIMO_DIA_HISTORICO = 96;
type Produto = Extract<ItemEncomenda, { tipo: 'produto' }>;
const pesoFormas: [string, number][] = [['dinheiro', 0.3], ['pix', 0.35], ['debito', 0.2], ['credito', 0.15]];

export function gerarHistorico(dados: DadosPrototipo, dia: (diasAtras: number) => string, semente = SEMENTE_HISTORICO) {
  const r = criarAleatorio(semente), escolher = <T,>(l: T[]) => l[Math.floor(r() * l.length)], forma = () => { let x = r(); for (const [id, p] of pesoFormas) { if ((x -= p) <= 0) return id; } return 'dinheiro'; };
  const balcao = dados.produtos.filter(p => p.ativo && p.vendeBalcao), docinhos = dados.produtos.filter(p => p.categoriaId === 'docinhos');
  const tamanhos = dados.opcoesBolo.tamanhos.filter(t => ['PP', 'P', 'M'].includes(t.nome)), massas = dados.opcoesBolo.massas, recheios = dados.opcoesBolo.recheios;
  const caixas: Caixa[] = [], vendas: Venda[] = [], encomendas: Encomenda[] = [], contas: ContaPagar[] = [];
  for (const loja of dados.lojas) {
    const escala = loja.id === 'matriz' ? 1 : 0.6, atendente = dados.usuarios.find(u => u.perfil === 'atendimento' && u.lojaId === loja.id)?.id ?? dados.usuarios[0].id;
    let numeroVenda = 1000, numeroEncomenda = loja.id === 'matriz' ? 5000 : 7000;
    for (let d = ULTIMO_DIA_HISTORICO; d >= PRIMEIRO_DIA_HISTORICO; d--) {
      const data = dia(d), semana = new Date(`${data}T12:00:00Z`).getUTCDay(), ritmo = semana === 0 || semana === 6 ? 1.6 : semana === 5 ? 1.2 : 1;
      const caixaId = `hist-caixa-${loja.id}-${d}`;
      caixas.push({ id: caixaId, lojaId: loja.id, data, abertoEm: `${data}T08:00:00-03:00`, abertoPor: atendente, trocoInicialCentavos: 10000, status: 'fechado', fechadoEm: `${data}T19:00:00-03:00`, fechadoPor: atendente, conferencia: [], observacaoFechamento: 'Caixa do histórico de teste.', reaberturas: [] });
      const qtdVendas = Math.max(1, Math.round((2 + r() * 4) * ritmo * escala));
      for (let v = 0; v < qtdVendas; v++) {
        const itens: Produto[] = Array.from({ length: 1 + Math.floor(r() * 2) }, () => { const p = escolher(balcao); return { id: `hist-v-${loja.id}-${d}-${v}-${p.id}`, tipo: 'produto' as const, produtoId: p.id, quantidade: p.categoriaId === 'docinhos' ? 2 + Math.floor(r() * 8) : 1 + Math.floor(r() * 2), observacao: '', valorUnitarioCentavos: p.valorCentavos, unidadeVenda: p.unidadeVenda }; }).filter((x, i, l) => l.findIndex(y => y.produtoId === x.produtoId) === i);
        const total = itens.reduce((s, i) => s + i.quantidade * i.valorUnitarioCentavos, 0), f = forma(), hora = String(9 + Math.floor(r() * 9)).padStart(2, '0');
        vendas.push({ id: `hist-venda-${loja.id}-${d}-${v}`, numero: ++numeroVenda, lojaId: loja.id, caixaId, data: `${data}T${hora}:${String(Math.floor(r() * 60)).padStart(2, '0')}:00-03:00`, itens, descontoCentavos: 0, taxaCartaoCentavos: 0, pagamentos: [{ formaPagamentoId: f, valorCentavos: total, ...(f === 'dinheiro' ? { recebidoCentavos: Math.ceil(total / 1000) * 1000 } : {}) }], trocoCentavos: f === 'dinheiro' ? Math.ceil(total / 1000) * 1000 - total : 0, usuarioId: atendente, status: 'concluida', historico: [{ id: `hist-venda-ev-${loja.id}-${d}-${v}`, data: `${data}T${hora}:00:00-03:00`, usuarioId: atendente, acao: 'Venda concluída', detalhe: 'Venda do histórico de teste.' }] });
      }
      if (r() < 0.55 * ritmo * escala) {
        const t = escolher(tamanhos), bolo: ItemEncomenda = { id: `hist-e-${loja.id}-${d}-bolo`, tipo: 'bolo', formato: 'formatos-1', tamanho: t.id, massa: escolher(massas).id, recheios: [escolher(recheios).id], adicionais: [], decoracoes: [], detalhes: 'Bolo do histórico de teste.', valorCentavos: t.valorCentavos };
        const itens: ItemEncomenda[] = [bolo]; if (r() < 0.6) { const p = escolher(docinhos); itens.push({ id: `hist-e-${loja.id}-${d}-doce`, tipo: 'produto', produtoId: p.id, quantidade: 20 + 10 * Math.floor(r() * 4), observacao: 'Sabores variados (teste)', valorUnitarioCentavos: p.valorCentavos, unidadeVenda: p.unidadeVenda }); }
        const total = itens.reduce((s, i) => s + (i.tipo === 'bolo' ? i.valorCentavos : i.quantidade * i.valorUnitarioCentavos), 0), id = `hist-encomenda-${loja.id}-${d}`, f = forma();
        encomendas.push({ id, numero: ++numeroEncomenda, lojaId: loja.id, clienteId: 'cliente-historico-teste', status: 'entregue', dataEntrega: data, horaEntrega: '16:00', modalidade: r() < 0.7 ? 'retirada' : 'entrega', itens, pagamentos: [{ id: `${id}-pg`, data: `${data}T16:00:00-03:00`, formaPagamentoId: f, valorCentavos: total, tipo: 'pagamento', usuarioId: atendente, lojaId: loja.id }], descontoCentavos: 0, taxaCartaoCentavos: 0, observacoes: 'Encomenda do histórico de teste.', historico: [{ id: `${id}-h1`, data: `${dia(d + 5)}T12:00:00-03:00`, usuarioId: atendente, acao: 'Encomenda criada', detalhe: 'Histórico de teste.' }, { id: `${id}-h2`, data: `${data}T16:00:00-03:00`, usuarioId: atendente, acao: 'Status alterado', detalhe: 'Pronto → Entregue/Retirado' }], criadoEm: `${dia(d + 5)}T12:00:00-03:00`, criadoPor: atendente });
      }
    }
  }
  // Despesas fixas mensais de teste: três meses passados, o atual e o próximo. Vencidas ficam pagas, exceto uma atrasada.
  const hoje = dia(0), [ano, mes] = hoje.split('-').map(Number);
  const fixas: [string, string, number, number, number][] = [['aluguel', 'Aluguel da loja (teste)', 5, 120000, 80000], ['salarios', 'Folha de salários (teste)', 5, 250000, 150000], ['pro-labore', 'Pró-labore dos sócios (teste)', 5, 150000, 0], ['energia-agua', 'Energia e água (teste)', 10, 40000, 25000], ['marketing', 'Anúncios em redes sociais (teste)', 15, 15000, 8000], ['tarifas-bancarias', 'Tarifas bancárias (teste)', 1, 3000, 2000]];
  for (let m = -3; m <= 1; m++) {
    const base = new Date(Date.UTC(ano, mes - 1 + m, 1));
    for (const [categoria, descricao, diaVenc, matriz, filial] of fixas) for (const loja of dados.lojas) {
      const valor = loja.id === 'matriz' ? matriz : filial; if (!valor) continue;
      const vencimento = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), diaVenc)).toISOString().slice(0, 10), atrasada = m === -1 && categoria === 'energia-agua' && loja.id === 'filial', paga = vencimento < hoje && !atrasada;
      contas.push({ id: `hist-conta-${categoria}-${loja.id}-${vencimento.slice(0, 7)}`, lojaId: loja.id, descricao, categoriaFinanceiraId: categoria, valorCentavos: valor, vencimento, status: paga ? 'paga' : 'aberta', ...(paga ? { pagamento: { data: `${vencimento}T10:00:00-03:00`, formaPagamentoId: 'pix', origem: 'Conta bancária' } } : {}), origem: 'manual', recorrencia: { tipo: 'mensal', dia: diaVenc }, recorrenciaId: `hist-rec-${categoria}-${loja.id}` });
    }
  }
  const manutencao = dia(40); contas.push({ id: 'hist-conta-manutencao-matriz', lojaId: 'matriz', descricao: 'Conserto da batedeira (teste)', categoriaFinanceiraId: 'manutencao', valorCentavos: 25000, vencimento: manutencao, status: 'paga', pagamento: { data: `${manutencao}T10:00:00-03:00`, formaPagamentoId: 'dinheiro', origem: 'Conta bancária' }, origem: 'manual' });
  return { caixas, vendas, encomendas, contas };
}
