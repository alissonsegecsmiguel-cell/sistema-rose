'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { dataRelativa, resumoProducao } from '@/lib/dados';
import { ResumoProducaoDia } from './resumo-producao-dia';
import { CartaoProducao } from './cartao-producao';
import { useNotificacao } from './notificacao';
export function ManualProducao() { const { estado } = usePrototipo(), notificar = useNotificacao(); if (!estado.pronto) return null; const resumo = resumoProducao(estado.dados, 'consolidado', dataRelativa(0), dataRelativa(2)), b = resumo.bolos[0]; return <section className="manual-secao pilha" id="producao-manual"><h2>Produção por bolo e resumo do período</h2><p className="suave">Um cartão por bolo, com status da encomenda. Comanda reutilizada sem valores, hora em destaque, alvos de 44px. Resumo conta tamanhos, massas e recheios; produtos agrupam pela observação exata. Bebidas e festa ficam separados. Próximos 3 dias inclui hoje e os dois seguintes.</p><ResumoProducaoDia resumo={resumo} />{b && <CartaoProducao dados={estado.dados} encomenda={b.encomenda} item={b.item} aoIniciar={() => notificar('Exemplo: produção iniciada.')} aoPronto={() => notificar('Exemplo: produção pronta.')} />}</section>; }
