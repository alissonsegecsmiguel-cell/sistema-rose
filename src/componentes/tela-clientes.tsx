'use client';
import { useState } from 'react';
import { usePrototipo } from '@/lib/prototipo-store';
import { enderecoWhatsapp, filtrarClientes, resumoCliente } from '@/lib/dados';
import { formatarData, formatarMoeda } from '@/lib/formatar';
import { CabecalhoPagina } from './cabecalho-pagina';
import { LinkBotao } from './link-botao';
import { LinkExterno } from './link-externo';
import { CampoTexto } from './campo-texto';
import { Opcao } from './opcao';
import { Tabela } from './tabela';
import { EstadoVazio } from './estado-vazio';
export function TelaClientes() {
  const { estado } = usePrototipo(), [busca, setBusca] = useState(''), [filtro, setFiltro] = useState('todos'); if (!estado.pronto) return null;
  const dados = estado.dados, clientes = filtrarClientes(dados, busca, filtro);
  return <div className="pilha"><CabecalhoPagina titulo="Clientes" subtitulo="Cadastro compartilhado entre Matriz e Filial." acoes={<LinkBotao variante="primario" href="/clientes/novo">Novo cliente</LinkBotao>} /><CampoTexto rotulo="Buscar cliente por nome ou telefone" value={busca} onChange={e => setBusca(e.target.value)} /><fieldset><legend>Clientes</legend><div className="linha">{[['todos', 'Todos'], ['recorrentes', 'Recorrentes'], ['pendencia', 'Com pendência'], ['aniversario', 'Aniversariantes do mês']].map(([id, n]) => <Opcao key={id} type="radio" name="filtro-clientes" pilula checked={filtro === id} onChange={() => setFiltro(id)}>{n}</Opcao>)}</div></fieldset><p className="pequeno suave">Recorrente: ao menos duas encomendas entregues ou retiradas nos últimos seis meses. Regra a revisar com o cliente. Total gasto considera encomendas entregues ou retiradas.</p>{clientes.length ? <Tabela legenda="Clientes encontrados" colunas={[{ chave: 'nome', titulo: 'Nome' }, { chave: 'telefone', titulo: 'Telefone' }, { chave: 'quantidade', titulo: 'Encomendas' }, { chave: 'gasto', titulo: 'Total gasto' }, { chave: 'ultima', titulo: 'Última encomenda' }, { chave: 'saldo', titulo: 'Saldo pendente' }, { chave: 'recorrente', titulo: 'Recorrência' }, { chave: 'acoes', titulo: 'Ações' }]} linhas={clientes.map(c => { const s = resumoCliente(dados, c.id); return { id: c.id, celulas: { nome: c.nome, telefone: c.telefone, quantidade: s.quantidade, gasto: formatarMoeda(s.total), ultima: s.ultima ? formatarData(s.ultima.dataEntrega) : 'Sem encomendas', saldo: formatarMoeda(s.saldo), recorrente: s.recorrente ? <span className="selo tom-sucesso">Recorrente</span> : 'Primeiras compras', acoes: <div className="linha"><LinkBotao href={`/clientes/${c.id}`}>Ver cliente</LinkBotao><LinkExterno href={enderecoWhatsapp(c)}>WhatsApp</LinkExterno></div> } }; })} /> : <EstadoVazio titulo="Nenhum cliente encontrado" texto="Tente outro nome, telefone ou filtro." />}</div>;
}
