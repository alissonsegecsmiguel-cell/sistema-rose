'use client';
import Link from 'next/link';
import { usePrototipo } from '@/lib/prototipo-store';
import { dataRelativa } from '@/lib/dados';
import { totalCompra } from '@/lib/compras';
import { formatarData, formatarMoeda } from '@/lib/formatar';
import { CabecalhoPagina } from './cabecalho-pagina';
import { Cartao } from './cartao';
import { Tabela } from './tabela';
import { LinkBotao } from './link-botao';
import { EstadoVazio } from './estado-vazio';
import { Indicador } from './indicador';
import { TabelaMovimentos } from './tela-estoque';
import type { ContaPagar, DadosPrototipo } from '@/lib/tipos';

export function TabelaContas({ dados, contas, legenda }: { dados: DadosPrototipo; contas: ContaPagar[]; legenda: string }) {
  return contas.length ? <Tabela legenda={legenda} colunas={[{ chave: 'descricao', titulo: 'Descrição' }, { chave: 'categoria', titulo: 'Categoria' }, { chave: 'parcela', titulo: 'Parcela' }, { chave: 'vencimento', titulo: 'Vencimento' }, { chave: 'valor', titulo: 'Valor' }, { chave: 'situacao', titulo: 'Situação' }]} linhas={contas.map(c => ({ id: c.id, celulas: { descricao: c.descricao, categoria: dados.categoriasFinanceiras.find(x => x.id === c.categoriaFinanceiraId)?.nome ?? c.categoriaFinanceiraId, parcela: c.parcela ?? 'Única', vencimento: formatarData(c.vencimento), valor: <span className="numerico">{formatarMoeda(c.valorCentavos)}</span>, situacao: c.status === 'paga' ? <span className="selo tom-sucesso">Paga</span> : c.vencimento < dataRelativa(0) ? <span className="selo tom-erro">Vencida</span> : <span className="selo tom-alerta">Aberta</span> } }))} /> : <p className="suave">Nenhuma conta gerada.</p>;
}
export function DetalheCompra({ id }: { id: string }) {
  const { estado } = usePrototipo(); if (!estado.pronto) return null; const d = estado.dados, c = d.compras.find(x => x.id === id && (estado.lojaId === 'consolidado' || x.lojaId === estado.lojaId));
  if (!c) return <EstadoVazio titulo="Compra não encontrada" texto="Confira a loja selecionada." acao={<LinkBotao href="/compras">Voltar às compras</LinkBotao>} />;
  const fornecedor = d.fornecedores.find(f => f.id === c.fornecedorId), movimentos = d.movimentosEstoque.filter(m => m.referencia?.tipo === 'compra' && m.referencia.id === c.id), contas = d.contasPagar.filter(x => x.compraId === c.id);
  return <div className="pilha"><CabecalhoPagina titulo={c.numeroNota ? `Compra NF ${c.numeroNota}` : 'Compra avulsa'} subtitulo={`${fornecedor?.nome ?? 'Fornecedor'} • ${formatarData(c.data)} • ${d.lojas.find(l => l.id === c.lojaId)?.nome} • ${c.origem === 'xml' ? 'Importada do XML' : 'Lançada à mão'}`} acoes={<LinkBotao href="/compras">Voltar às compras</LinkBotao>} />
    <div className="grade"><Indicador rotulo="Total" valor={formatarMoeda(totalCompra(c))} icone="compras" /><Indicador rotulo="Condição" valor={c.condicao === 'a_vista' ? 'À vista' : `A prazo, ${c.parcelas.length}x`} icone="financeiro" /></div>
    <Cartao className="pilha"><h2>Itens</h2><Tabela legenda="Itens da compra" colunas={[{ chave: 'descricao', titulo: 'Descrição na nota' }, { chave: 'quantidade', titulo: 'Quantidade' }, { chave: 'unitario', titulo: 'Unitário' }, { chave: 'total', titulo: 'Total' }, { chave: 'destino', titulo: 'Insumo ou despesa' }]} linhas={c.itens.map((i, n) => ({ id: `${n}`, celulas: { descricao: i.descricaoNota, quantidade: `${i.quantidade} ${i.unidade}`, unitario: formatarMoeda(i.valorUnitarioCentavos), total: formatarMoeda(i.totalCentavos), destino: i.foraDoEstoque ? `Despesa: ${d.categoriasInsumo.find(x => x.id === i.categoriaDespesaId)?.nome}` : <Link href={`/ficha-tecnica/insumos/${i.insumoId}`}>{d.insumos.find(x => x.id === i.insumoId)?.nome}</Link> } }))} /><p className="pequeno numerico">Frete: {formatarMoeda(c.freteCentavos)} • Desconto: {formatarMoeda(c.descontoCentavos)}</p>{c.chaveNfe && <p className="pequeno suave quebra-livre">Chave: {c.chaveNfe}</p>}</Cartao>
    <Cartao className="pilha"><h2>Entradas no estoque</h2><TabelaMovimentos dados={d} lista={movimentos} legenda="Entradas geradas pela compra" /></Cartao>
    <Cartao className="pilha"><h2>Contas a pagar geradas</h2><TabelaContas dados={d} contas={contas} legenda="Contas da compra" /></Cartao></div>;
}
export function DetalheFornecedor({ id }: { id: string }) {
  const { estado } = usePrototipo(); if (!estado.pronto) return null; const d = estado.dados, f = d.fornecedores.find(x => x.id === id);
  if (!f) return <EstadoVazio titulo="Fornecedor não encontrado" texto="Confira o endereço." acao={<LinkBotao href="/compras?aba=fornecedores">Voltar aos fornecedores</LinkBotao>} />;
  const desde = dataRelativa(-90), compras = d.compras.filter(c => c.fornecedorId === id && c.status === 'lancada').sort((a, b) => b.data.localeCompare(a.data)), insumos = Array.from(new Set(compras.flatMap(c => c.itens.map(i => i.insumoId)).filter(Boolean))) as string[];
  return <div className="pilha"><CabecalhoPagina titulo={f.nome} subtitulo={[f.documento, f.contato, f.telefone, f.email].filter(Boolean).join(' • ')} acoes={<LinkBotao href="/compras?aba=fornecedores">Voltar aos fornecedores</LinkBotao>} /><div className="grade"><Indicador rotulo="Comprado em 90 dias" valor={formatarMoeda(compras.filter(c => c.data >= desde).reduce((s, c) => s + totalCompra(c), 0))} icone="compras" /><Indicador rotulo="Prazo padrão" valor={`${f.prazoPadraoDias} dias`} icone="financeiro" /></div>
    <Cartao className="pilha-curta"><h2>Insumos fornecidos</h2>{insumos.length ? <ul>{insumos.map(i => <li key={i}><Link href={`/ficha-tecnica/insumos/${i}`}>{d.insumos.find(x => x.id === i)?.nome}</Link></li>)}</ul> : <p className="suave">Nenhum insumo comprado ainda.</p>}</Cartao>
    <Cartao className="pilha"><h2>Compras</h2>{compras.length ? <Tabela legenda="Compras do fornecedor" colunas={[{ chave: 'data', titulo: 'Data' }, { chave: 'nota', titulo: 'Nota' }, { chave: 'total', titulo: 'Total' }, { chave: 'acoes', titulo: 'Ações' }]} linhas={compras.map(c => ({ id: c.id, celulas: { data: formatarData(c.data), nota: c.numeroNota ? `NF ${c.numeroNota}` : 'Avulsa', total: formatarMoeda(totalCompra(c)), acoes: <LinkBotao href={`/compras/${c.id}`}>Ver compra</LinkBotao> } }))} /> : <p className="suave">Nenhuma compra lançada.</p>}</Cartao></div>;
}
