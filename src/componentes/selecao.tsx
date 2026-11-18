'use client';
import { useId, type SelectHTMLAttributes, type ReactNode } from 'react';
export function Selecao({ rotulo, ajuda, erro, children, id, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { rotulo: string; ajuda?: string; erro?: string; children: ReactNode }) {
  const autoId = useId(); const campoId = id ?? autoId;
  return <div className="campo"><label htmlFor={campoId}>{rotulo}</label><select {...props} id={campoId} aria-invalid={!!erro} aria-describedby={[ajuda && `${campoId}-ajuda`, erro && `${campoId}-erro`].filter(Boolean).join(' ') || undefined}>{children}</select>{ajuda && <p className="campo-ajuda" id={`${campoId}-ajuda`}>{ajuda}</p>}{erro && <p className="campo-erro" id={`${campoId}-erro`}>{erro}</p>}</div>;
}
