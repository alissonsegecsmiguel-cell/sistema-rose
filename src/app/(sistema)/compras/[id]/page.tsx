import { DetalheCompra } from '@/componentes/detalhe-compra';
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) { return <DetalheCompra id={(await params).id} />; }
