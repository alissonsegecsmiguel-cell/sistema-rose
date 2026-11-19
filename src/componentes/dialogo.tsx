'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Botao } from './botao';
export function Dialogo({ aberto, aoFechar, titulo, children, gaveta = false, grande = false }: { aberto: boolean; aoFechar: () => void; titulo: string; children: ReactNode; gaveta?: boolean; grande?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => {
    const dialogo = ref.current; if (!dialogo || !aberto) return;
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogo.showModal();
    const overflowAnterior = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { dialogo.close(); document.body.style.overflow = overflowAnterior; anterior?.focus(); };
  }, [aberto]);
  return <dialog ref={ref} className={`dialogo ${gaveta ? 'dialogo-gaveta' : ''} ${grande ? 'dialogo-grande' : ''}`} aria-labelledby={id} onCancel={e => { e.preventDefault(); aoFechar(); }} onKeyDown={e => {
    if (e.key !== 'Tab') return;
    const focaveis = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(el => el.getClientRects().length > 0);
    const primeiro = focaveis[0]; const ultimo = focaveis.at(-1);
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo?.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro?.focus(); }
  }}><div className="dialogo-cabecalho"><h2 id={id}>{titulo}</h2><Botao variante="fantasma" aria-label={gaveta ? 'Fechar menu' : 'Fechar diálogo'} icone="fechar" onClick={aoFechar}><span className="sr-only">Fechar</span></Botao></div><div className="pilha">{children}</div></dialog>;
}
