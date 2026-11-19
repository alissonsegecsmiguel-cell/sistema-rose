'use client';
import Link from 'next/link';
import type { NoArvore } from '@/lib/custos';
import { usePrototipo } from '@/lib/prototipo-store';
import { arvoreFicha, custoFicha, custoPorUnidadeUso, fichasQueUsamInsumo, ondeFichaEUsada } from '@/lib/custos';
import { formatarData, formatarMoeda } from '@/lib/formatar';
import { CabecalhoPagina } from './cabecalho-pagina';
import { Cartao } from './cartao';
import { LinkBotao } from './link-botao';
import { EstadoVazio } from './estado-vazio';
import { Tabela } from './tabela';
import { GraficoPrecos } from './grafico-precos';
import { moedaUnidade } from './tela-ficha-tecnica';
import { EstoqueDoInsumo } from './tela-estoque';

const numero = (v: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v);
/** Árvore expansível da ficha: subfichas abrem com details/summary nativos, acessíveis por teclado. */
export function ArvoreFicha({ no, raiz = false }: { no: NoArvore; raiz?: boolean }) {
  const rotulo = <><strong>{no.nome}</strong> <span className="numerico">{numero(no.quantidade)} {no.unidade} • {formatarMoeda(Math.round(no.custo))}</span></>;
  if (!no.filhos.length) return <li className="arvore-folha">{no.tipo === 'insumo' ? <><Link href={`/ficha-tecnica/insumos/${no.id}`}>{no.nome}</Link> <span className="numerico">{numero(no.quantidade)} {no.unidade} • {formatarMoeda(Math.round(no.custo))}</span></> : rotulo}</li>;
  return <li><details className="arvore-no" open={raiz}><summary>{rotulo}</summary><ul className="arvore">{no.filhos.map((f, i) => <ArvoreFicha key={`${f.id}-${i}`} no={f} />)}</ul></details></li>;
}

export function DetalheFicha({ id }: { id: string }) {
  const { estado } = usePrototipo(); if (!estado.pronto) return null; const dados = estado.dados, f = dados.fichas.find(x => x.id === id);
  if (!f) return <EstadoVazio titulo="Ficha não encontrada" texto="Confira o endereço." acao={<LinkBotao href="/ficha-tecnica">Voltar às fichas</LinkBotao>} />;
  const c = custoFicha(dados, id), uso = ondeFichaEUsada(dados, id), produto = dados.produtos.find(p => p.id === f.produtoId);
  return <div className="pilha"><CabecalhoPagina titulo={f.nome} subtitulo={`${f.tipo === 'base' ? 'Ficha base' : 'Ficha de produto'} • rende ${numero(f.rendimentoQuantidade)} ${f.rendimentoUnidade}`} acoes={<LinkBotao href="/ficha-tecnica">Voltar às fichas</LinkBotao>} />
    <div className="grade"><Cartao className="pilha-curta numerico"><h2>Custo</h2><p>Componentes: {formatarMoeda(Math.round(c.total))}</p><p>Perda: {numero(f.perdaPercentual ?? 0)}%</p><p><strong>Custo final: {formatarMoeda(Math.round(c.final))}</strong></p><p>Por unidade: {moedaUnidade(c.porUnidade, f.rendimentoUnidade)}</p>{produto && <p>Produto: {produto.nome} • {formatarMoeda(produto.valorCentavos)}</p>}</Cartao>
      <Cartao className="pilha-curta"><h2>Onde esta ficha é usada</h2>{uso.fichas.length || uso.opcoes.length ? <ul className="pilha-curta">{uso.fichas.map(x => <li key={x.id}><Link href={`/ficha-tecnica/${x.id}`}>{x.nome}</Link></li>)}{uso.opcoes.map(x => <li key={x}>Montagem do bolo: {x}</li>)}{uso.tamanhos.map(x => <li key={x}>Fixos do tamanho {x}</li>)}</ul> : <p className="suave">Ainda não é usada em outra ficha ou na montagem do bolo.</p>}</Cartao></div>
    <Cartao className="pilha"><h2>Composição</h2><p className="pequeno suave">Abra cada ficha para ver as subfichas e os insumos.</p><ul className="arvore"><ArvoreFicha no={arvoreFicha(dados, id)} raiz /></ul></Cartao>
    {f.modoPreparo && <Cartao className="pilha-curta"><h2>Modo de preparo</h2><p className="texto-leitura">{f.modoPreparo}</p></Cartao>}</div>;
}

export function DetalheInsumo({ id, extra }: { id: string; extra?: React.ReactNode }) {
  const { estado } = usePrototipo(); if (!estado.pronto) return null; const dados = estado.dados, i = dados.insumos.find(x => x.id === id);
  if (!i) return <EstadoVazio titulo="Insumo não encontrado" texto="Confira o endereço." acao={<LinkBotao href="/ficha-tecnica?aba=insumos">Voltar aos insumos</LinkBotao>} />;
  const historico = [...i.historicoPrecos].sort((a, b) => a.data.localeCompare(b.data)), fichas = fichasQueUsamInsumo(dados, id);
  return <div className="pilha"><CabecalhoPagina titulo={i.nome} subtitulo={`${dados.categoriasInsumo.find(c => c.id === i.categoriaId)?.nome} • ${formatarMoeda(i.custoAtualCentavos)} por ${i.unidadeCompra} • ${moedaUnidade(custoPorUnidadeUso(i), i.unidadeUso)}`} acoes={<LinkBotao href="/ficha-tecnica?aba=insumos">Voltar aos insumos</LinkBotao>} />
    <div className="grade"><Cartao className="pilha"><h2>Histórico de preços</h2><GraficoPrecos pontos={historico.map(h => ({ data: h.data, valor: h.valorCentavos }))} rotulo={`Evolução do preço de ${i.nome}`} /><Tabela legenda="Preços registrados" colunas={[{ chave: 'data', titulo: 'Data' }, { chave: 'valor', titulo: `Valor por ${i.unidadeCompra}` }, { chave: 'origem', titulo: 'Origem' }]} linhas={[...historico].reverse().map((h, n) => ({ id: `${h.data}-${n}`, celulas: { data: formatarData(h.data), valor: <span className="numerico">{formatarMoeda(h.valorCentavos)}</span>, origem: h.origem === 'compra' ? 'Compra' : 'Manual' } }))} /></Cartao>
      <Cartao className="pilha-curta"><h2>Fichas que usam este insumo</h2>{fichas.length ? <ul className="pilha-curta">{fichas.map(f => <li key={f.id}><Link href={`/ficha-tecnica/${f.id}`}>{f.nome}</Link></li>)}</ul> : <p className="suave">Nenhuma ficha usa este insumo.</p>}</Cartao></div>{extra}<EstoqueDoInsumo insumoId={id} /></div>;
}
