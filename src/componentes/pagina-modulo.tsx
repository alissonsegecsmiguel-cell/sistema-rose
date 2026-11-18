import { modulos, novaEncomenda } from '@/lib/permissoes';
import { CabecalhoPagina } from './cabecalho-pagina';
import { EstadoVazio } from './estado-vazio';
export function PaginaModulo({ rota }: { rota: string }) { const modulo = [...modulos, novaEncomenda].find(m => m.rota === rota)!; return <><CabecalhoPagina titulo={modulo.titulo} /><EstadoVazio icone={modulo.icone} texto={modulo.texto} /></>; }
