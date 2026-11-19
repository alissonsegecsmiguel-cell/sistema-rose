'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { useNotificacao } from './notificacao';
import { MenuAcoes } from './menu-acoes';
import { Comanda } from './comanda';
import { Comprovante } from './comprovante';
import { PaginaImpressao } from './pagina-impressao';
export function ManualAcoes() {
  const { estado } = usePrototipo(), notificar = useNotificacao(); if (!estado.pronto) return null; const e = estado.dados.encomendas[0];
  return <section className="manual-secao pilha" id="acoes-manual"><h2>Ações e impressão</h2><p className="suave">Menu de ações abre com Enter, aceita setas, Home e End; Esc fecha e devolve o foco. Ações da encomenda usam diálogos com motivo obrigatório para retorno, cancelamento e correção. Linha de pagamento mostra quem registrou e o botão de correção quando permitido.</p><MenuAcoes itens={[{ id: 'exemplo', rotulo: 'Ação de exemplo', acao: () => notificar('Ação demonstrada.') }, { id: 'outra', rotulo: 'Outra ação', acao: () => notificar('Outra ação demonstrada.') }]} /><p>Comanda de cozinha sem valores e comprovante do cliente com valores. Os exemplos abaixo permitem escolher 80mm ou A4; a impressão oculta a navegação e os controles.</p><PaginaImpressao><Comanda dados={estado.dados} encomenda={e} tipo="bolos" /><Comanda dados={estado.dados} encomenda={e} tipo="doces" /><Comprovante dados={estado.dados} encomenda={e} /></PaginaImpressao></section>;
}
