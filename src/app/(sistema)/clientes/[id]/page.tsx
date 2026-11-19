import { DetalheCliente } from '@/componentes/detalhe-cliente';
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) { return <DetalheCliente id={(await params).id} />; }
