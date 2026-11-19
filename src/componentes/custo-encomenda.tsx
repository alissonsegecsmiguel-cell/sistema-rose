import type { DadosPrototipo, Encomenda } from '@/lib/tipos';
import { custoEncomenda } from '@/lib/custos';
import { formatarMoeda } from '@/lib/formatar';
import { Cartao } from './cartao';
/** Custo estimado pelo preço atual dos insumos. Somente Administrativo. */
export function CustoEncomenda({ dados, encomenda }: { dados: DadosPrototipo; encomenda: Encomenda }) {
  const c = custoEncomenda(dados, encomenda), limite = dados.montagemBolo.limiteMargemPercentual, pct = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(c.percentual);
  return <Cartao className="pilha-curta numerico"><h2>Custo estimado e margem</h2><p>Receita dos itens após desconto: {formatarMoeda(c.receita)}</p><p>Custo estimado: {formatarMoeda(Math.round(c.custo))}</p><p><strong>Margem: {formatarMoeda(Math.round(c.margem))} ({pct}%)</strong></p>{c.percentual < limite && <span className="selo tom-alerta">Margem abaixo de {limite}%</span>}{c.semFicha.map(s => <span key={s} className="selo tom-alerta">{s}</span>)}<p className="pequeno suave">Calculado na hora pelo custo atual dos insumos. Não inclui taxa de cartão nem mão de obra.</p></Cartao>;
}
