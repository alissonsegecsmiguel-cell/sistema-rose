import type { ReactNode } from 'react';
export function CabecalhoPagina({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: string; acoes?: ReactNode }) { return <header className="cabecalho-pagina"><div className="pilha-curta"><h1>{titulo}</h1>{subtitulo && <p className="suave">{subtitulo}</p>}</div>{acoes && <div className="linha">{acoes}</div>}</header>; }
