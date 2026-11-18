'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Usuario } from '@/lib/tipos';
import { Botao } from './botao';

export function MenuUsuario({ usuario, aoTrocarPerfil }: { usuario: Usuario; aoTrocarPerfil: () => void }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const id = useId();
  const palavras = usuario.nome.split(/\s+/).filter(palavra => !/^\d+$/.test(palavra));
  const iniciais = [palavras[0]?.[0], palavras.length > 1 ? palavras.at(-1)?.[0] : null].join('').toLocaleUpperCase('pt-BR');
  const perfil = usuario.perfil === 'administrativo' ? 'Administrativo' : 'Atendimento';

  function fecharComFoco() {
    setAberto(false);
    raiz.current?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')?.focus();
  }

  useEffect(() => {
    if (!aberto) return;
    raiz.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    function aoClicarFora(evento: PointerEvent) {
      if (evento.target instanceof Node && !raiz.current?.contains(evento.target)) setAberto(false);
    }
    document.addEventListener('pointerdown', aoClicarFora);
    return () => document.removeEventListener('pointerdown', aoClicarFora);
  }, [aberto]);

  useEffect(() => {
    const consulta = matchMedia('(max-width: 760px)');
    const aoMudar = () => { if (!consulta.matches) setAberto(false); };
    consulta.addEventListener('change', aoMudar);
    return () => consulta.removeEventListener('change', aoMudar);
  }, []);

  return (
    <div ref={raiz} className="menu-usuario"
      onBlurCapture={evento => { if (!evento.currentTarget.contains(evento.relatedTarget)) setAberto(false); }}
      onKeyDown={evento => {
        if (evento.key === 'Escape' && aberto) { evento.preventDefault(); evento.stopPropagation(); fecharComFoco(); }
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(evento.key)) {
          evento.preventDefault();
          if (!aberto) setAberto(true);
          else raiz.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
        }
      }}
    >
      <Botao id={`${id}-botao`} variante="secundario" className="botao-iniciais"
        aria-label={`Abrir menu do usuário: ${usuario.nome}`} aria-haspopup="menu" aria-expanded={aberto}
        aria-controls={aberto ? `${id}-menu` : undefined} onClick={() => setAberto(!aberto)}>
        <span aria-hidden="true">{iniciais}</span>
      </Botao>
      {aberto && <div id={`${id}-menu`} role="menu" aria-labelledby={`${id}-botao`} className="menu-usuario-painel">
        <div role="none" className="menu-usuario-identidade"><p><strong>{usuario.nome}</strong></p><p className="suave pequeno">{perfil}</p></div>
        <Botao variante="fantasma" icone="sair" role="menuitem" onClick={() => { fecharComFoco(); aoTrocarPerfil(); }}>Trocar perfil</Botao>
      </div>}
    </div>
  );
}
