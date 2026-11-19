'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { dataRelativa, producaoDoPeriodo } from '@/lib/dados';
import { Comanda } from './comanda';
import { PaginaImpressao } from './pagina-impressao';
import { LinkBotao } from './link-botao';
import { EstadoVazio } from './estado-vazio';
export function ImpressaoProducao({ data, fim, tipo }: { data?: string; fim?: string; tipo: 'bolos' | 'doces' }) { const { estado } = usePrototipo(); if (!estado.pronto) return null; const inicio = data || dataRelativa(0), lista = producaoDoPeriodo(estado.dados, estado.lojaId, inicio, fim || inicio); return <PaginaImpressao><div className="nao-imprimir"><LinkBotao href={`/producao?data=${inicio}`}>Voltar à produção</LinkBotao></div>{lista.length ? lista.map(e => <Comanda key={e.id} dados={estado.dados} encomenda={e} tipo={tipo} />) : <EstadoVazio titulo="Nenhuma encomenda para produzir" texto="Escolha outra data." />}</PaginaImpressao>; }
