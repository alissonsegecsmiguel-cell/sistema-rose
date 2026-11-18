'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

export function Dica({ texto, children }: { texto: string; children: (id: string) => ReactNode }) {
  const id = useId();
  const raiz = useRef<HTMLSpanElement>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    if (!visivel) return;
    const aoTeclar = (evento: KeyboardEvent) => { if (evento.key === 'Escape') setVisivel(false); };
    const aoTocarFora = (evento: PointerEvent) => { if (evento.target instanceof Node && !raiz.current?.contains(evento.target)) setVisivel(false); };
    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('pointerdown', aoTocarFora);
    return () => { document.removeEventListener('keydown', aoTeclar); document.removeEventListener('pointerdown', aoTocarFora); };
  }, [visivel]);
  return (
    <span ref={raiz} className="dica-container"
      onPointerEnter={() => setVisivel(true)} onPointerLeave={evento => { if (evento.pointerType !== 'touch') setVisivel(false); }}
      onPointerDown={evento => { if (evento.pointerType === 'touch') setVisivel(true); }}
      onFocusCapture={() => setVisivel(true)}
      onBlurCapture={evento => { if (!evento.currentTarget.contains(evento.relatedTarget)) setVisivel(false); }}
      onKeyDown={evento => { if (evento.key === 'Escape' && visivel) { setVisivel(false); evento.stopPropagation(); } }}
    >
      {children(id)}
      <span id={id} role="tooltip" className="dica-conteudo" hidden={!visivel}>{texto}</span>
    </span>
  );
}
