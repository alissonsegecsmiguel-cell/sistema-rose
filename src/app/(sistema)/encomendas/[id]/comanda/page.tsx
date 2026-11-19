import { ImpressaoEncomenda } from '@/componentes/impressao-encomenda';
export default async function Pagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tipo?: string }> }) { return <ImpressaoEncomenda id={(await params).id} tipo={(await searchParams).tipo === 'doces' ? 'doces' : 'bolos'} />; }
