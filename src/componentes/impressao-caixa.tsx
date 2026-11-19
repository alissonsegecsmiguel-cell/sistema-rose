'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { obterCaixaPorId } from '@/lib/dados';
import { PaginaImpressao } from './pagina-impressao';
import { CupomVenda } from './cupom-venda';
import { RelatorioFechamento } from './relatorio-fechamento';
import { EstadoVazio } from './estado-vazio';
import { LinkBotao } from './link-botao';
export function ImpressaoCaixa({ id, tipo }: { id: string; tipo: 'venda' | 'fechamento' }) { const { estado } = usePrototipo(); if (!estado.pronto) return null; const { dados, lojaId } = estado, venda = dados.vendas.find(v => v.id === id && (lojaId === 'consolidado' || v.lojaId === lojaId)), caixa = obterCaixaPorId(dados, lojaId, id); if ((tipo === 'venda' && !venda) || (tipo === 'fechamento' && !caixa)) return <EstadoVazio titulo="Registro não encontrado" texto="Confira a loja selecionada." />; return <PaginaImpressao><div className="nao-imprimir"><LinkBotao href="/caixa">Voltar ao caixa</LinkBotao></div>{tipo === 'venda' ? <CupomVenda dados={dados} venda={venda!} /> : <RelatorioFechamento dados={dados} caixa={caixa!} />}</PaginaImpressao>; }
