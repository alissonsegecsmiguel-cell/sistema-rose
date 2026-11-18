import { CabecalhoPagina } from '@/componentes/cabecalho-pagina';
import { EstadoVazio } from '@/componentes/estado-vazio';
import { LinkBotao } from '@/componentes/link-botao';
export default function NaoEncontrada() { return <main className="pagina-publica"><CabecalhoPagina titulo="Página não encontrada" /><EstadoVazio titulo="Não encontramos esta página" texto="Confira o endereço ou volte ao início para escolher um perfil de teste." acao={<LinkBotao href="/entrar">Voltar ao início</LinkBotao>} /></main>; }
