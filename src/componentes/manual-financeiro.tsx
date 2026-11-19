'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { dataRelativa } from '@/lib/dados';
import { mesAnterior } from '@/lib/financeiro';
import { formatarMoeda } from '@/lib/formatar';
import { GraficoBarras } from './grafico-barras';
import { TabelaDre } from './tela-financeiro';
import { PaginaImpressao } from './pagina-impressao';
import { LinkBotao } from './link-botao';
export function ManualFinanceiro() {
  const { estado } = usePrototipo(); if (!estado.pronto) return null;
  return <section className="manual-secao pilha" id="financeiro-manual"><h2>Financeiro: barras com saldo negativo e DRE</h2><p className="suave">GraficoBarras escreve o valor de cada barra; saldo negativo usa a cor de erro e o sinal de menos no texto, nunca só a cor. O DRE é uma tabela com mês, mês anterior e variação, imprimível em A4.</p><GraficoBarras rotulo="Exemplo de saldos" barras={[{ rotulo: 'Positivo', valor: 120000, texto: formatarMoeda(120000) }, { rotulo: 'Negativo', valor: 45000, texto: `−${formatarMoeda(45000)}`, negativo: true }]} /><TabelaDre dados={estado.dados} lojaId="consolidado" mes={mesAnterior(dataRelativa(0).slice(0, 7))} /></section>;
}
/** DRE em A4 para impressão. */
export function ImpressaoDre({ mes }: { mes?: string }) {
  const { estado } = usePrototipo(); if (!estado.pronto) return null; const m = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : mesAnterior(dataRelativa(0).slice(0, 7));
  return <PaginaImpressao formatoInicial="a4"><div className="nao-imprimir"><LinkBotao href="/financeiro?aba=dre">Voltar ao financeiro</LinkBotao></div><h1>DRE gerencial</h1><p>{estado.lojaId === 'consolidado' ? 'Consolidado' : estado.dados.lojas.find(l => l.id === estado.lojaId)?.nome} • Valores de teste. Não substitui a contabilidade.</p><TabelaDre dados={estado.dados} lojaId={estado.lojaId} mes={m} /></PaginaImpressao>;
}
