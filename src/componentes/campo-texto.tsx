'use client';
import { useId, type InputHTMLAttributes } from 'react';
export function CampoTexto({ rotulo, ajuda, erro, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { rotulo: string; ajuda?: string; erro?: string }) {
  const autoId = useId(); const campoId = id ?? autoId;
  return <div className="campo"><label htmlFor={campoId}>{rotulo}</label><input {...props} id={campoId} aria-invalid={!!erro} aria-describedby={[ajuda && `${campoId}-ajuda`, erro && `${campoId}-erro`].filter(Boolean).join(' ') || undefined} />{ajuda && <p className="campo-ajuda" id={`${campoId}-ajuda`}>{ajuda}</p>}{erro && <p className="campo-erro" id={`${campoId}-erro`}>{erro}</p>}</div>;
}
