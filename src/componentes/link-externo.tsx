import type { ReactNode } from 'react';
export function LinkExterno({ href, children }: { href: string; children: ReactNode }) { return <a className="botao botao-secundario" href={href} target="_blank" rel="noopener noreferrer">{children}<span className="sr-only"> (abre em nova aba)</span></a>; }
