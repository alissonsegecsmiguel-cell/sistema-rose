import { Suspense } from 'react';
import { TelaEditarEncomenda } from '@/componentes/formulario-encomenda';
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) { return <Suspense><TelaEditarEncomenda id={(await params).id} /></Suspense>; }
