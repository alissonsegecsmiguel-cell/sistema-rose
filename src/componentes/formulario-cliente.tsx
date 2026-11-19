'use client';
import { useState } from 'react';
import type { Cliente } from '@/lib/tipos';
import { localizarClientePorTelefone, novoId, validarCliente } from '@/lib/dados';
import { usePrototipo } from '@/lib/prototipo-store';
import { CampoTexto } from './campo-texto';
import { CampoTextoLongo } from './campo-texto-longo';
import { Botao } from './botao';
import { Aviso } from './aviso';
import { LinkBotao } from './link-botao';
export function FormularioCliente({ lojaId, cliente, aoSalvar, aoUsarExistente }: { lojaId: string; cliente?: Cliente; aoSalvar: (c: Cliente) => void; aoUsarExistente?: (c: Cliente) => void }) {
  const { estado } = usePrototipo(), [c, setC] = useState<Cliente>(() => cliente ?? { id: novoId(), lojaId, nome: '', telefone: '' }), [erros, setErros] = useState<Record<string, string>>({});
  const existente = c.telefone.replace(/\D/g, '').length >= 10 ? localizarClientePorTelefone(estado.dados, c.telefone, c.id) : undefined;
  return <form className="pilha" noValidate onSubmit={e => { e.preventDefault(); const v = validarCliente(c); setErros(v); if (!Object.keys(v).length && !existente) aoSalvar(c); }}><CampoTexto rotulo="Nome" required value={c.nome} erro={erros.nome} onChange={e => setC({ ...c, nome: e.target.value })} /><CampoTexto rotulo="Telefone" type="tel" required value={c.telefone} erro={erros.telefone} onChange={e => setC({ ...c, telefone: e.target.value })} /><CampoTexto rotulo="Aniversário (opcional)" type="date" value={c.aniversario || ''} onChange={e => setC({ ...c, aniversario: e.target.value })} /><CampoTextoLongo rotulo="Endereço (opcional)" value={c.endereco || ''} onChange={e => setC({ ...c, endereco: e.target.value })} /><CampoTextoLongo rotulo="Observações (opcional)" value={c.observacoes || ""} onChange={e => setC({ ...c, observacoes: e.target.value })} />{existente && <Aviso tom="alerta" titulo="Telefone já cadastrado"><p>{existente.nome} • {existente.telefone}</p><LinkBotao href={`/clientes/${existente.id}`}>Ver cliente existente</LinkBotao>{aoUsarExistente && <Botao variante="secundario" onClick={() => aoUsarExistente(existente)}>Usar cliente existente</Botao>}</Aviso>}<Botao type="submit" disabled={!!existente}>Salvar cliente</Botao></form>;
}
