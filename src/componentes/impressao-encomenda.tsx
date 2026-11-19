'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { obterEncomenda } from '@/lib/dados';
import { Comanda } from './comanda';
import { Comprovante } from './comprovante';
import { PaginaImpressao } from './pagina-impressao';
import { EstadoVazio } from './estado-vazio';
import { LinkBotao } from './link-botao';
export function ImpressaoEncomenda({ id, tipo }: { id: string; tipo: 'bolos' | 'doces' | 'comprovante' }) {
  const { estado } = usePrototipo(); if (!estado.pronto) return null; const e = obterEncomenda(estado.dados, estado.lojaId, id);
  if (!e) return <EstadoVazio titulo="Encomenda não encontrada" texto="Confira a loja selecionada." />;
  return <PaginaImpressao><div className="nao-imprimir"><LinkBotao href={`/encomendas/${id}`}>Voltar à encomenda</LinkBotao></div>{tipo === 'comprovante' ? <Comprovante dados={estado.dados} encomenda={e} /> : <Comanda dados={estado.dados} encomenda={e} tipo={tipo} />}</PaginaImpressao>;
}
