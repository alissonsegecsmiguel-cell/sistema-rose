import { DetalheFornecedor } from '@/componentes/detalhe-compra';
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) { return <DetalheFornecedor id={(await params).id} />; }
