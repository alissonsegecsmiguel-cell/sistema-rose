import { DetalheInsumo } from '@/componentes/detalhe-ficha';
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) { return <DetalheInsumo id={(await params).id} />; }
