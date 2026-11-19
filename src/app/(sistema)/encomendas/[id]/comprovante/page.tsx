import { ImpressaoEncomenda } from '@/componentes/impressao-encomenda';
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) { return <ImpressaoEncomenda id={(await params).id} tipo="comprovante" />; }
