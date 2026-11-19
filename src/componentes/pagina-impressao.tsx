'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Selecao } from './selecao';
import { Botao } from './botao';
export function PaginaImpressao({ children, formatoInicial = 'cupom' }: { children: ReactNode; formatoInicial?: 'cupom' | 'a4' }) {
  const [formato, setFormato] = useState<string>(formatoInicial);
  return <div className={`pagina-impressao papel-${formato}`}><div className="nao-imprimir linha"><Selecao rotulo="Tamanho de impressão" value={formato} onChange={e => setFormato(e.target.value)}><option value="cupom">Cupom 80mm</option><option value="a4">A4</option></Selecao><Botao onClick={() => window.print()}>Imprimir</Botao></div><style media="print">{`@page { size: ${formato === 'a4' ? 'A4' : '80mm 297mm'}; margin: 5mm; }`}</style><div className="papel">{children}</div></div>;
}
