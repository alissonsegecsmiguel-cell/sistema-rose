import { DetalheEncomenda } from '@/componentes/detalhe-encomenda';
export default async function Pagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ voltar?: string }> }) { return <DetalheEncomenda id={(await params).id} voltar={(await searchParams).voltar} />; }
