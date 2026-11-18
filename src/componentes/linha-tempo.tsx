import { formatarData, formatarHora } from '@/lib/formatar';
export function LinhaTempo({ eventos }: { eventos: { id: string; data: string; usuario: string; titulo: string; detalhe: string }[] }) {
  return <ol className="linha-tempo">{eventos.map(e => <li key={e.id}><strong>{e.titulo}</strong><p className="pequeno suave">{formatarData(e.data)} às {formatarHora(e.data)} • {e.usuario}</p><p>{e.detalhe}</p></li>)}</ol>;
}
