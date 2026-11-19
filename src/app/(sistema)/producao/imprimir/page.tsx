import { ImpressaoProducao } from '@/componentes/impressao-producao';
export default async function Pagina({ searchParams }: { searchParams: Promise<{ data?: string; fim?: string; tipo?: string }> }) { const p = await searchParams; return <ImpressaoProducao data={p.data} fim={p.fim} tipo={p.tipo === 'doces' ? 'doces' : 'bolos'} />; }
