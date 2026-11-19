import { TelaRelatorio } from '@/componentes/tela-relatorios';
export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) { return <TelaRelatorio slug={(await params).slug} />; }
