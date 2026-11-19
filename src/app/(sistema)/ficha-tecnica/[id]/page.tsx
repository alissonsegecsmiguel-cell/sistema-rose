import { DetalheFicha } from '@/componentes/detalhe-ficha';
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) { return <DetalheFicha id={(await params).id} />; }
