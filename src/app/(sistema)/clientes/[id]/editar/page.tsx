import { TelaFormularioCliente } from '@/componentes/tela-formulario-cliente';
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) { return <TelaFormularioCliente id={(await params).id} />; }
