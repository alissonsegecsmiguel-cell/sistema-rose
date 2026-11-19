'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { quadroEncomendas } from '@/lib/dados';
import { QuadroKanban } from './quadro-kanban';
import { useNotificacao } from './notificacao';
export function ManualQuadro() {
  const { estado } = usePrototipo(), notificar = useNotificacao(); if (!estado.pronto) return null;
  return <section className="manual-secao pilha" id="quadro-manual"><h2>Quadro de encomendas (QuadroKanban)</h2><p className="suave">Cinco colunas por status com quantidade e valor. Acima de 760px, o cartão é arrastado com eventos de ponteiro; a coluna de destino fica destacada e a de origem mostra cursor de bloqueio. Em todas as larguras, o botão Mover para abre um menu acessível por teclado, e o resultado é anunciado pela notificação. Até 760px, as colunas viram abas com a quantidade. Selos Hoje, Atrasada, Começar hoje e Cliente ainda não retirou usam texto e cor. Neste exemplo, mover só mostra uma notificação.</p><QuadroKanban dados={estado.dados} lojaId="consolidado" colunas={quadroEncomendas(estado.dados, 'consolidado').map(c => ({ ...c, itens: c.itens.slice(0, 2) }))} aoMover={(e, destino) => notificar(`Exemplo: encomenda nº ${e.numero} iria para ${destino === 'em_producao' ? 'Em produção' : destino}.`)} retorno="/design-system" /></section>;
}
