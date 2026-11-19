'use client';
import { useRouter } from 'next/navigation';
import { usePrototipo } from '@/lib/prototipo-store';
import { obterCliente, salvarCliente } from '@/lib/dados';
import { FormularioCliente } from './formulario-cliente';
import { CabecalhoPagina } from './cabecalho-pagina';
import { LinkBotao } from './link-botao';
import { Cartao } from './cartao';
import { EstadoVazio } from './estado-vazio';
import { useNotificacao } from './notificacao';
export function TelaFormularioCliente({ id }: { id?: string }) {
  const { estado, usuario, atualizar } = usePrototipo(), router = useRouter(), notificar = useNotificacao(); if (!estado.pronto || !usuario) return null;
  const cliente = id ? obterCliente(estado.dados, estado.lojaId, id) : undefined;
  if (id && !cliente) return <EstadoVazio titulo="Cliente não encontrado" texto="Confira o endereço." />;
  return <div className="pilha"><CabecalhoPagina titulo={id ? 'Editar cliente' : 'Novo cliente'} acoes={<LinkBotao href={id ? `/clientes/${id}` : '/clientes'}>Voltar aos clientes</LinkBotao>} /><Cartao><FormularioCliente key={id || 'novo'} cliente={cliente} lojaId={estado.lojaId === 'consolidado' ? usuario.lojaId : estado.lojaId} aoSalvar={c => { atualizar(salvarCliente(estado.dados, c)); notificar('Cliente salvo.'); router.push(`/clientes/${c.id}`); }} /></Cartao></div>;
}
