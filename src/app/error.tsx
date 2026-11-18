'use client';
import { EstadoVazio } from '@/componentes/estado-vazio';
import { Botao } from '@/componentes/botao';
export default function Erro({ reset }: { reset: () => void }) { return <main className="pagina-publica"><EstadoVazio icone="alerta" titulo="Não foi possível abrir esta tela" texto="Tente novamente para continuar no protótipo." acao={<Botao onClick={reset}>Tentar novamente</Botao>} /></main>; }
