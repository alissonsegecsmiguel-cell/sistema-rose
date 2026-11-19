import { ImpressaoDre } from '@/componentes/manual-financeiro';
export default async function Pagina({ searchParams }: { searchParams: Promise<{ mes?: string }> }) { return <ImpressaoDre mes={(await searchParams).mes} />; }
