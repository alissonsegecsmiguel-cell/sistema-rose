import { DetalheContagem } from '@/componentes/detalhe-contagem';
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) { return <DetalheContagem id={(await params).id} />; }
