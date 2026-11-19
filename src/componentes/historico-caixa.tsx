'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { listarCaixas, resumoCaixa } from '@/lib/dados';
import { formatarData, formatarMoeda } from '@/lib/formatar';
import { CabecalhoPagina } from './cabecalho-pagina';
import { Tabela } from './tabela';
import { LinkBotao } from './link-botao';
export function HistoricoCaixa() { const { estado } = usePrototipo(); if (!estado.pronto) return null; const d = estado.dados; return <div className="pilha"><CabecalhoPagina titulo="Histórico dos caixas" acoes={<LinkBotao href="/caixa">Voltar ao caixa</LinkBotao>} /><Tabela legenda="Caixas por dia e loja" colunas={[{ chave: 'data', titulo: 'Dia' }, { chave: 'loja', titulo: 'Loja' }, { chave: 'status', titulo: 'Status' }, { chave: 'formas', titulo: 'Totais por forma' }, { chave: 'diferenca', titulo: 'Diferença' }, { chave: 'pessoas', titulo: 'Abertura e fechamento' }, { chave: 'acao', titulo: 'Ações' }]} linhas={listarCaixas(d, estado.lojaId).map(c => ({ id: c.id, celulas: { data: formatarData(c.data), loja: d.lojas.find(l => l.id === c.lojaId)?.nome, status: c.status === 'fechado' ? 'Fechado' : 'Aberto', formas: resumoCaixa(d, c).formas.map(f => `${f.nome}: ${formatarMoeda(f.valorCentavos)}`).join(' • '), diferenca: formatarMoeda(c.conferencia.reduce((s, f) => s + f.diferencaCentavos, 0)), pessoas: `${d.usuarios.find(u => u.id === c.abertoPor)?.nome} / ${d.usuarios.find(u => u.id === c.fechadoPor)?.nome || 'Ainda aberto'}`, acao: <LinkBotao href={`/caixa?id=${c.id}`}>Ver fechamento</LinkBotao> } }))} /></div>; }
