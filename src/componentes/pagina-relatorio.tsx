'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { ResultadoRelatorio, TabelaRelatorio, TipoColuna } from '@/lib/relatorios';
import { gerarCsv } from '@/lib/relatorios';
import { formatarMoeda } from '@/lib/formatar';
import { CabecalhoPagina } from './cabecalho-pagina';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { Selecao } from './selecao';
import { Cartao } from './cartao';
import { Indicador } from './indicador';
import { Aviso } from './aviso';
import { EstadoVazio } from './estado-vazio';
import { GraficoBarras } from './grafico-barras';
import { useNotificacao } from './notificacao';

export function formatarValor(v: string | number, tipo: TipoColuna) { if (typeof v === 'string') return v; if (tipo === 'moeda') return formatarMoeda(Math.round(v)); if (tipo === 'percentual') return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v)}%`; return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v); }

/** Período com atalhos e datas personalizadas. */
export function FiltroPeriodo({ periodo, inicio, fim, aoMudar }: { periodo: string; inicio: string; fim: string; aoMudar: (p: { periodo: string; inicio: string; fim: string }) => void }) {
  return <><Selecao rotulo="Período" value={periodo} onChange={e => aoMudar({ periodo: e.target.value, inicio, fim })}><option value="hoje">Hoje</option><option value="7dias">Últimos 7 dias</option><option value="mes">Este mês</option><option value="mes-anterior">Mês anterior</option><option value="personalizado">Personalizado</option></Selecao>{periodo === 'personalizado' && <><CampoTexto rotulo="Data inicial" type="date" value={inicio} onChange={e => aoMudar({ periodo, inicio: e.target.value, fim })} /><CampoTexto rotulo="Data final" type="date" value={fim} onChange={e => aoMudar({ periodo, inicio, fim: e.target.value })} /></>}</>;
}
/** Baixa a tabela em CSV gerado no navegador (; e vírgula decimal, com acentos para o Excel). */
export function ExportarCsv({ tabela, arquivo }: { tabela: TabelaRelatorio; arquivo: string }) {
  const notificar = useNotificacao();
  return <Botao variante="secundario" aria-label={`Exportar CSV: ${tabela.titulo}`} onClick={() => { const url = URL.createObjectURL(new Blob([gerarCsv(tabela)], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a'); a.href = url; a.download = `${arquivo}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); notificar(`CSV de ${tabela.titulo} gerado.`); }}>Exportar CSV</Botao>;
}
/** Tabela com cabeçalhos que ordenam ao clicar ou com Enter; aria-sort indica a ordem. */
export function TabelaOrdenavel({ tabela }: { tabela: TabelaRelatorio }) {
  const [ordem, setOrdem] = useState<{ chave: string; asc: boolean }>(), linhas = ordem ? [...tabela.linhas].sort((a, b) => { const x = a[ordem.chave], y = b[ordem.chave], r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR'); return ordem.asc ? r : -r; }) : tabela.linhas;
  if (!tabela.linhas.length) return <EstadoVazio titulo={`${tabela.titulo}: sem dados`} texto="Escolha outro período ou loja." />;
  return <div className="tabela-container"><table className="tabela"><caption>{tabela.titulo}</caption><thead><tr>{tabela.colunas.map(c => <th key={c.chave} scope="col" aria-sort={ordem?.chave === c.chave ? (ordem.asc ? 'ascending' : 'descending') : 'none'}><button type="button" className="botao-ordenar" onClick={() => setOrdem({ chave: c.chave, asc: ordem?.chave === c.chave ? !ordem.asc : c.tipo === 'texto' })}>{c.titulo}<span aria-hidden="true">{ordem?.chave === c.chave ? (ordem.asc ? ' ▲' : ' ▼') : ''}</span></button></th>)}</tr></thead><tbody>{linhas.map((l, n) => <tr key={n}>{tabela.colunas.map(c => <td key={c.chave} data-rotulo={c.titulo} className={c.tipo === 'texto' ? '' : 'numerico'}>{formatarValor(l[c.chave] ?? '', c.tipo)}</td>)}</tr>)}</tbody></table></div>;
}
/** Estrutura comum: filtros, ajuda, indicadores, gráfico, tabelas, CSV e impressão A4. */
export function PaginaRelatorio({ titulo, ajuda, filtros, resultado, slug }: { titulo: string; ajuda: string; filtros: React.ReactNode; resultado: ResultadoRelatorio; slug: string }) {
  return <div className="pilha pagina-relatorio"><style media="print">{'@page { size: A4; margin: 12mm; }'}</style><CabecalhoPagina titulo={titulo} subtitulo={ajuda} acoes={<div className="linha nao-imprimir"><Link className="botao botao-secundario" href="/relatorios">Todos os relatórios</Link><Botao variante="secundario" onClick={() => window.print()}>Imprimir</Botao></div>} />
    <Cartao className="grade nao-imprimir">{filtros}</Cartao>{resultado.avisos?.map(a => <Aviso key={a}>{a}</Aviso>)}
    <div className="grade">{resultado.indicadores.map(i => <Indicador key={i.rotulo} rotulo={i.rotulo} valor={formatarValor(i.valor, i.tipo)} ajuda={i.ajuda} />)}</div>
    {resultado.grafico && resultado.grafico.barras.length > 0 && <Cartao className="pilha"><h2>{resultado.grafico.rotulo}</h2><GraficoBarras rotulo={resultado.grafico.rotulo} barras={resultado.grafico.barras.map(b => ({ rotulo: b.rotulo.length > 18 ? `${b.rotulo.slice(0, 17)}…` : b.rotulo, valor: Math.abs(b.valor), texto: formatarValor(b.valor, resultado.grafico!.tipo), negativo: b.valor < 0 }))} /></Cartao>}
    {resultado.tabelas.map(t => <section key={t.titulo} className="pilha" aria-label={t.titulo}><div className="linha nao-imprimir"><ExportarCsv tabela={t} arquivo={`${slug}-${t.titulo.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}`} /></div><TabelaOrdenavel tabela={t} /></section>)}</div>;
}
