'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePrototipo } from '@/lib/prototipo-store';
import { RELATORIOS, periodoRelatorio, type Filtros } from '@/lib/relatorios';
import { dataRelativa } from '@/lib/dados';
import { CabecalhoPagina } from './cabecalho-pagina';
import { Cartao } from './cartao';
import { Selecao } from './selecao';
import { EstadoVazio } from './estado-vazio';
import { LinkBotao } from './link-botao';
import { FiltroPeriodo, PaginaRelatorio } from './pagina-relatorio';

export function TelaRelatorios() {
  const grupos = ['Vendas', 'Resultado', 'Estoque e compras', 'Produção'] as const;
  return <div className="pilha"><CabecalhoPagina titulo="Relatórios" subtitulo="Números do histórico de teste de 90 dias. Escolha um relatório." />{grupos.map(g => <section key={g} className="pilha" aria-labelledby={`grupo-${g}`}><h2 id={`grupo-${g}`}>{g}</h2><div className="grade">{RELATORIOS.filter(r => r.grupo === g).map(r => <Cartao key={r.slug} className="pilha-curta cartao-relatorio"><h3><Link href={`/relatorios/${r.slug}`}>{r.titulo}</Link></h3><p className="suave">{r.descricao}</p></Cartao>)}</div></section>)}</div>;
}

export function TelaRelatorio({ slug }: { slug: string }) { const { estado } = usePrototipo(); return estado.pronto ? <ConteudoRelatorio key={estado.lojaId} slug={slug} /> : null; }
function ConteudoRelatorio({ slug }: { slug: string }) {
  const { estado } = usePrototipo(), def = RELATORIOS.find(r => r.slug === slug);
  const [p, setP] = useState({ periodo: 'mes-anterior', inicio: dataRelativa(-30), fim: dataRelativa(0) }), [lojaId, setLoja] = useState(estado.lojaId), [categoria, setCategoria] = useState(''), [agrupar, setAgrupar] = useState<Filtros['agrupar']>('dia');
  if (!def) return <EstadoVazio titulo="Relatório não encontrado" texto="Confira o endereço." acao={<LinkBotao href="/relatorios">Todos os relatórios</LinkBotao>} />;
  const [inicio, fim] = periodoRelatorio(p.periodo, p.inicio, p.fim), d = estado.dados, filtros: Filtros = { inicio, fim, lojaId, categoria, agrupar };
  const extra = <>{slug === 'mais-vendidos' && <Selecao rotulo="Categoria" value={categoria} onChange={e => setCategoria(e.target.value)}><option value="">Todas</option>{d.categoriasProduto.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Selecao>}{slug === 'faturamento-periodo' && <Selecao rotulo="Agrupar por" value={agrupar} onChange={e => setAgrupar(e.target.value as Filtros['agrupar'])}><option value="dia">Dia</option><option value="semana">Semana</option><option value="mes">Mês</option></Selecao>}</>;
  return <PaginaRelatorio slug={slug} titulo={def.titulo} ajuda={`${def.ajuda} Período: ${inicio.split('-').reverse().join('/')} a ${fim.split('-').reverse().join('/')}.`} resultado={def.gerar(d, filtros)} filtros={<><FiltroPeriodo periodo={p.periodo} inicio={p.inicio} fim={p.fim} aoMudar={setP} /><Selecao rotulo="Loja" value={lojaId} onChange={e => setLoja(e.target.value)}><option value="consolidado">Consolidado</option>{d.lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}</Selecao>{extra}</>} />;
}
