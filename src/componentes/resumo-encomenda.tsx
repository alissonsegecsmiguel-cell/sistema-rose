import type { DadosPrototipo, Rascunho } from '@/lib/tipos';
import { calcularTotais, resumirItens, situacaoPagamento } from '@/lib/dados';
import { formatarMoeda } from '@/lib/formatar';
import { Cartao } from './cartao';
import { Botao } from './botao';
import { SeloStatus } from './selo-status';
export function ResumoEncomenda({ dados, rascunho, orcamento, aoSalvar }: { dados: DadosPrototipo; rascunho: Rascunho; orcamento?: boolean; aoSalvar: (status: 'orcamento' | 'confirmado') => void }) {
  const t = calcularTotais(rascunho);
  return <Cartao className="pilha"><h2>Resumo do pedido</h2><p>{resumirItens(dados, rascunho.encomenda) || 'Adicione itens ao pedido.'}</p><dl className="resumo-valores">{[['Subtotal', t.subtotal], ['Desconto', -t.descontoCentavos], ['Taxa de cartão', t.taxaCartaoCentavos], ['Total', t.total], ['Pago', t.pago], ['Saldo', t.saldo]].map(([nome, valor]) => <div key={nome}><dt>{nome}</dt><dd className="numerico">{formatarMoeda(Number(valor))}</dd></div>)}</dl><SeloStatus status={situacaoPagamento(rascunho.encomenda)} /><Botao variante={orcamento ? 'primario' : 'secundario'} onClick={() => aoSalvar('orcamento')}>Salvar como orçamento</Botao><Botao variante={orcamento ? 'secundario' : 'primario'} onClick={() => aoSalvar('confirmado')}>Confirmar encomenda</Botao></Cartao>;
}
