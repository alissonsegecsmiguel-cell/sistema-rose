import { TelaCaixa } from '@/componentes/tela-caixa';
export default async function Pagina({ searchParams }: { searchParams: Promise<{ id?: string }> }) { return <TelaCaixa id={(await searchParams).id} />; }
