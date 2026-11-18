'use client';
import { useId, useRef, useState, type ReactNode } from 'react';
export function Abas({ rotulo, itens }: { rotulo: string; itens: { id: string; titulo: string; conteudo: ReactNode; desabilitada?: boolean }[] }) {
  const [ativa, setAtiva] = useState(itens.find(i => !i.desabilitada)?.id); const id = useId(); const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return <div className="abas"><div role="tablist" aria-label={rotulo} className="abas-lista">{itens.map((item, indice) => <button key={item.id} ref={el => { refs.current[indice] = el; }} type="button" role="tab" id={`${id}-aba-${item.id}`} aria-controls={`${id}-painel-${item.id}`} aria-selected={ativa === item.id} tabIndex={ativa === item.id ? 0 : -1} disabled={item.desabilitada} onClick={() => setAtiva(item.id)} onKeyDown={e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault(); const habilitados = itens.map((i, n) => i.desabilitada ? -1 : n).filter(n => n >= 0); const pos = habilitados.indexOf(indice);
    const proxima = e.key === 'Home' ? habilitados[0] : e.key === 'End' ? habilitados.at(-1)! : habilitados[(pos + (e.key === 'ArrowRight' ? 1 : -1) + habilitados.length) % habilitados.length];
    setAtiva(itens[proxima].id); refs.current[proxima]?.focus();
  }}>{item.titulo}</button>)}</div>{itens.map(item => <div key={item.id} id={`${id}-painel-${item.id}`} role="tabpanel" aria-labelledby={`${id}-aba-${item.id}`} tabIndex={0} hidden={ativa !== item.id} className="abas-painel">{item.conteudo}</div>)}</div>;
}
