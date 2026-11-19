import { ImpressaoCaixa } from '@/componentes/impressao-caixa';
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) { return <ImpressaoCaixa id={(await params).id} tipo="venda" />; }
