import type { DadosPrototipo, Encomenda, ItemEncomenda } from '@/lib/tipos';
import { Cartao } from './cartao';
import { Comanda } from './comanda';
import { Botao } from './botao';
import { LinkBotao } from './link-botao';
import { SeloStatus } from './selo-status';
export function CartaoProducao({ dados, encomenda, item, aoIniciar, aoPronto }: { dados: DadosPrototipo; encomenda: Encomenda; item: Extract<ItemEncomenda, { tipo: 'bolo' }>; aoIniciar: () => void; aoPronto: () => void }) { return <Cartao className="pilha cartao-producao"><Comanda dados={dados} encomenda={{ ...encomenda, itens: [item] }} tipo="bolos" /><SeloStatus status={encomenda.status} modalidade={encomenda.modalidade} /><div className="linha">{encomenda.status === 'confirmado' && <Botao onClick={aoIniciar}>Iniciar</Botao>}{encomenda.status === 'em_producao' && <Botao onClick={aoPronto}>Pronto</Botao>}<LinkBotao href={`/encomendas/${encomenda.id}`}>Ver encomenda</LinkBotao></div></Cartao>; }
