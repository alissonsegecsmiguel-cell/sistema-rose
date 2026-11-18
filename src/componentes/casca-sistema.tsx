'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePrototipo } from '@/lib/prototipo-store';
import { podeAcessar } from '@/lib/permissoes';
import { Marca } from './marca';
import { MenuLateral } from './menu-lateral';
import { BarraSuperior } from './barra-superior';
import { Dialogo } from './dialogo';
import { Botao } from './botao';
import { FaixaPrototipo } from './faixa-prototipo';
import { EstadoVazio } from './estado-vazio';
import { CabecalhoPagina } from './cabecalho-pagina';
import { LinkBotao } from './link-botao';
import { useNotificacao } from './notificacao';
export function CascaSistema({ children }: { children: ReactNode }) {
  const { estado, usuario, escolherPerfil, restaurar } = usePrototipo(); const router = useRouter(); const rota = usePathname();
  const [menuAberto, setMenuAberto] = useState(false); const [confirmar, setConfirmar] = useState(false); const notificar = useNotificacao();
  useEffect(() => { if (estado.pronto && !usuario) router.replace('/entrar'); }, [estado.pronto, usuario, router]);
  if (!estado.pronto || !usuario) return <main className="pagina-publica" aria-busy="true"><p>Carregando protótipo…</p></main>;
  return <><a href="#conteudo" className="pular-conteudo">Pular para o conteúdo</a><FaixaPrototipo aoRestaurar={() => setConfirmar(true)} /><div className="casca"><aside className="menu-lateral"><Marca /><MenuLateral perfil={usuario.perfil} rota={rota} /></aside><div className="area-sistema"><BarraSuperior aoAbrirMenu={() => setMenuAberto(true)} aoTrocarPerfil={() => { escolherPerfil(null); router.push('/entrar'); }} /><main id="conteudo" tabIndex={-1} className="conteudo-sistema">{podeAcessar(usuario.perfil, rota) ? children : <><CabecalhoPagina titulo="Acesso restrito" /><EstadoVazio icone="perfil" titulo="Você não tem acesso a esta área" texto="Este perfil de teste tem acesso às áreas de atendimento da sua loja." acao={<LinkBotao href="/visao-geral">Voltar à Visão geral</LinkBotao>} /></>}</main></div></div><Dialogo aberto={menuAberto} aoFechar={() => setMenuAberto(false)} titulo="Menu do sistema" gaveta><div className="marca"><Marca /></div><MenuLateral perfil={usuario.perfil} rota={rota} aoNavegar={() => setMenuAberto(false)} /></Dialogo><Dialogo aberto={confirmar} aoFechar={() => setConfirmar(false)} titulo="Restaurar dados de teste?"><p>As alterações feitas neste navegador serão substituídas pelos dados fictícios iniciais. O perfil e a loja selecionados serão mantidos.</p><div className="linha"><Botao variante="secundario" onClick={() => setConfirmar(false)}>Cancelar</Botao><Botao onClick={() => { restaurar(); setConfirmar(false); notificar('Dados de teste restaurados.'); }}>Restaurar dados</Botao></div></Dialogo></>;
}
