'use client';
import { useId, useState } from 'react';
/** Campo de arquivo com rótulo, ajuda e nome do arquivo escolhido. O arquivo fica no navegador. */
export function CampoArquivo({ rotulo, accept, aoEscolher, ajuda = 'O arquivo é lido somente neste navegador.' }: { rotulo: string; accept?: string; aoEscolher: (arquivo: File) => void; ajuda?: string }) {
  const id = useId(), [nome, setNome] = useState('');
  return <div className="campo campo-arquivo"><label htmlFor={id}>{rotulo}</label><input id={id} type="file" accept={accept} aria-describedby={`${id}-ajuda`} onChange={e => { const f = e.target.files?.[0]; if (f) { setNome(f.name); aoEscolher(f); } e.target.value = ''; }} /><p className="campo-ajuda" id={`${id}-ajuda`}>{nome ? `Último arquivo: ${nome}. ` : ''}{ajuda}</p></div>;
}
