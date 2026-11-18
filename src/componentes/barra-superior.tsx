'use client';
import { listarLojas } from '@/lib/dados';
import { usePrototipo } from '@/lib/prototipo-store';
import type { Usuario } from '@/lib/tipos';
import { useState } from 'react';
import { Botao } from './botao';
import { Selecao } from './selecao';
import { Icone } from './icone';
import { Marca } from './marca';
import { MenuUsuario } from './menu-usuario';
export function BarraSuperior({ aoAbrirMenu, aoTrocarPerfil, usuarioExemplo }: { aoAbrirMenu: () => void; aoTrocarPerfil: () => void; usuarioExemplo?: Usuario }) {
  const { estado, usuario: atual, escolherLoja } = usePrototipo();
  const [lojaExemplo, setLojaExemplo] = useState('matriz');
  const usuario = usuarioExemplo ?? atual; if (!usuario) return null;
  const lojas = listarLojas(estado.dados);
  return (
    <header className="barra-superior">
      <Botao variante="secundario" className="botao-menu" icone="menu" aria-label="Abrir menu" aria-haspopup="dialog" onClick={aoAbrirMenu}><span className="sr-only">Menu</span></Botao>
      <Marca compacta />
      <div className="barra-loja">
        {usuario.perfil === 'administrativo' ? (
          <Selecao rotulo="Loja selecionada" rotuloCompacto value={usuarioExemplo ? lojaExemplo : estado.lojaId} onChange={e => usuarioExemplo ? setLojaExemplo(e.target.value) : escolherLoja(e.target.value)}>
            {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}<option value="consolidado">Consolidado</option>
          </Selecao>
        ) : <div className="loja-fixa"><Icone nome="loja" /><div><small className="suave">Sua loja</small><span>{lojas.find(l => l.id === usuario.lojaId)?.nome}</span></div></div>}
      </div>
      <div className="barra-usuario">
        <div><strong>{usuario.nome}</strong><small>{usuario.perfil === 'administrativo' ? 'Administrativo' : 'Atendimento'}</small></div>
        <Botao variante="fantasma" icone="sair" onClick={aoTrocarPerfil}>Trocar perfil</Botao>
      </div>
      <MenuUsuario usuario={usuario} aoTrocarPerfil={aoTrocarPerfil} />
    </header>
  );
}
