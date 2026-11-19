import type { Caixa, DadosPrototipo } from '@/lib/tipos';
import { resumoCaixa } from '@/lib/dados';
import { formatarMoeda, formatarHora } from '@/lib/formatar';
export function ResumoCaixa({ dados, caixa }: { dados: DadosPrototipo; caixa: Caixa }) {
  const r = resumoCaixa(dados, caixa);
  return <section className="caixa-resumo pilha-curta" aria-label="Totais do caixa"><p>{caixa.status === 'aberto' ? 'Aberto' : 'Fechado'} desde {formatarHora(caixa.abertoEm)} • {dados.usuarios.find(u => u.id === caixa.abertoPor)?.nome}</p><strong>Dinheiro na gaveta esperado: {formatarMoeda(r.dinheiro)}</strong><div className="totais-formas">{r.formas.map(f => <div key={f.id}><span className="pequeno suave">{f.nome}</span><strong className="numerico">{formatarMoeda(f.valorCentavos)}</strong></div>)}</div></section>;
}
