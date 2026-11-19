'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DadosPrototipo, Encomenda, LojaSelecionada, StatusEncomenda } from '@/lib/tipos';
import { COLUNAS_QUADRO, alertasCartaoQuadro, obterCliente, resumirItens, saldoEncomenda, situacaoPagamento, situacaoPrazo } from '@/lib/dados';
import { formatarData, formatarMoeda } from '@/lib/formatar';
import { Abas } from './abas';
import { MenuAcoes } from './menu-acoes';
import { SeloStatus } from './selo-status';
import { Icone } from './icone';
import { EstadoVazio } from './estado-vazio';

export type ColunaQuadro = { status: StatusEncomenda; titulo: string; itens: Encomenda[]; totalCentavos: number };
type Arraste = { id: string; origem: StatusEncomenda; x: number; y: number; dx: number; dy: number; ativo: boolean; alvo?: StatusEncomenda };

/** Quadro por status. Arrasta com ponteiro acima de 760px; o botão Mover para funciona em todas as larguras e pelo teclado. */
export function QuadroKanban({ dados, lojaId, colunas, aoMover, retorno = '/encomendas?aba=quadro', agora }: { dados: DadosPrototipo; lojaId: LojaSelecionada; colunas: ColunaQuadro[]; aoMover: (e: Encomenda, destino: StatusEncomenda) => void; retorno?: string; agora?: Date }) {
  const [compacto, setCompacto] = useState(false), [arraste, setArraste] = useState<Arraste>(), arrastou = useRef(false), router = useRouter();
  useEffect(() => { const m = window.matchMedia('(max-width: 760px)'), aplicar = () => setCompacto(m.matches); aplicar(); m.addEventListener('change', aplicar); return () => m.removeEventListener('change', aplicar); }, []);
  const aoMoverRef = useRef(aoMover); useEffect(() => { aoMoverRef.current = aoMover; });
  const iniciar = (e: Encomenda, x: number, y: number) => {
    arrastou.current = false; let atual: Arraste = { id: e.id, origem: e.status, x, y, dx: 0, dy: 0, ativo: false };
    const mover = (ev: PointerEvent) => { const dx = ev.clientX - x, dy = ev.clientY - y; if (!atual.ativo && Math.hypot(dx, dy) < 6) return; arrastou.current = true; const quadro = document.querySelector<HTMLElement>('.quadro'), caixa = quadro?.getBoundingClientRect(); if (quadro && caixa) { if (ev.clientX > caixa.right - 48) quadro.scrollLeft += 24; else if (ev.clientX < caixa.left + 48) quadro.scrollLeft -= 24; } const sob = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>('[data-coluna]')?.dataset.coluna as StatusEncomenda | undefined; atual = { ...atual, dx, dy, ativo: true, alvo: sob }; setArraste(atual); };
    const soltar = () => { window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', soltar); window.removeEventListener('pointercancel', cancelar); setArraste(undefined); if (atual.ativo && atual.alvo && atual.alvo !== e.status) aoMoverRef.current(e, atual.alvo); };
    const cancelar = () => { window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', soltar); window.removeEventListener('pointercancel', cancelar); setArraste(undefined); };
    window.addEventListener('pointermove', mover); window.addEventListener('pointerup', soltar); window.addEventListener('pointercancel', cancelar);
  };
  const link = (e: Encomenda) => `/encomendas/${e.id}?voltar=${encodeURIComponent(retorno)}`;
  const cartao = (e: Encomenda) => {
    const cliente = obterCliente(dados, lojaId, e.clienteId)?.nome ?? 'Cliente', prazo = situacaoPrazo(e, agora), alertas = alertasCartaoQuadro(e, agora), saldo = saldoEncomenda(e), meu = arraste?.id === e.id && arraste.ativo;
    const destinos = COLUNAS_QUADRO.filter(c => c.status !== e.status);
    return <article key={e.id} className={`cartao cartao-quadro ${meu ? 'arrastando' : ''} ${meu && (!arraste?.alvo || arraste.alvo === e.status) ? 'bloqueado' : ''}`} style={meu ? { transform: `translate(${arraste!.dx}px, ${arraste!.dy}px)` } : undefined} aria-label={`Encomenda nº ${e.numero}, ${cliente}`}
      onPointerDown={ev => { if (compacto || ev.button !== 0 || (ev.target as HTMLElement).closest('a, button, [role="menu"]')) return; ev.preventDefault(); iniciar(e, ev.clientX, ev.clientY); }}
      onClick={ev => { if (arrastou.current) { arrastou.current = false; return; } if ((ev.target as HTMLElement).closest('a, button, [role="menu"]')) return; router.push(link(e)); }}>
      <div className="linha cartao-quadro-topo"><Link href={link(e)} className="cartao-quadro-titulo">nº {e.numero} • {cliente}</Link>{prazo === 'atrasada' && <span className="selo tom-erro">Atrasada</span>}{prazo === 'hoje' && <span className="selo tom-info">Hoje</span>}</div>
      <p className="pequeno numerico">{formatarData(e.dataEntrega)}{e.horaEntrega ? ` às ${e.horaEntrega}` : ''}{lojaId === 'consolidado' ? ` • ${dados.lojas.find(l => l.id === e.lojaId)?.nome}` : ''}</p>
      <p className="pequeno">{resumirItens(dados, e)}</p>
      <div className="linha"><span className="linha pequeno suave"><Icone nome={e.modalidade === 'entrega' ? 'entrega' : 'loja'} tamanho={16} />{e.modalidade === 'entrega' ? 'Entrega' : 'Retirada'}</span><SeloStatus status={situacaoPagamento(e)} />{saldo > 0 && <span className="pequeno numerico">Saldo {formatarMoeda(saldo)}</span>}</div>
      {alertas.map(a => <span key={a} className="selo tom-alerta">{a}</span>)}
      <MenuAcoes rotulo="Mover para..." rotuloAcessivel={`Mover encomenda nº ${e.numero} para`} itens={destinos.map(c => ({ id: c.status, rotulo: c.titulo, acao: () => aoMover(e, c.status) }))} />
    </article>;
  };
  const corpo = (c: ColunaQuadro) => c.itens.length ? <div className="pilha-curta quadro-lista">{c.itens.map(cartao)}</div> : <p className="pequeno suave">Nenhuma encomenda nesta coluna.</p>;
  const cabecalho = (c: ColunaQuadro) => <p className="pequeno suave numerico">{c.itens.length} {c.itens.length === 1 ? 'encomenda' : 'encomendas'} • {formatarMoeda(c.totalCentavos)}</p>;
  if (!colunas.some(c => c.itens.length)) return <EstadoVazio titulo="Nenhuma encomenda no quadro" texto="Escolha outro período ou limpe a busca." />;
  if (compacto) return <Abas rotulo="Colunas do quadro" itens={colunas.map(c => ({ id: c.status, titulo: `${c.titulo} ${c.itens.length}`, conteudo: <div className="pilha" data-coluna={c.status}>{cabecalho(c)}{corpo(c)}</div> }))} />;
  return <div className="quadro" role="list" aria-label="Quadro de encomendas por status">{colunas.map(c => { const destino = arraste?.ativo && arraste.alvo === c.status ? (c.status === arraste.origem ? 'bloqueado' : 'permitido') : undefined; return <section key={c.status} role="listitem" className="quadro-coluna" data-coluna={c.status} data-destino={destino} aria-labelledby={`quadro-${c.status}`}><div className="pilha-curta"><h3 id={`quadro-${c.status}`}>{c.titulo}</h3>{cabecalho(c)}</div>{corpo(c)}</section>; })}</div>;
}
