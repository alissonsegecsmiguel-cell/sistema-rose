import Link from 'next/link';
import { formatarData } from '@/lib/formatar';
export function FaixaDias({ dias }: { dias: { data: string; quantidade: number }[] }) {
  return <nav className="faixa-dias" aria-label="Próximos dias">{dias.map(d => <Link key={d.data} href={`/encomendas?data=${d.data}`} className="cartao pilha-curta"><strong>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${d.data}T12:00:00Z`))}</strong><span>{formatarData(d.data).slice(0, 5)}</span><span className="pequeno suave">{d.quantidade} encomenda{d.quantidade !== 1 ? 's' : ''}</span></Link>)}</nav>;
}
