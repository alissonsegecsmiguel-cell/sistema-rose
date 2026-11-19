import { FolhaContagem } from '@/componentes/detalhe-contagem';
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) { return <FolhaContagem id={(await params).id} />; }
