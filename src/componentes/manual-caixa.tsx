'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { ResumoCaixa } from './resumo-caixa';
import { CupomVenda } from './cupom-venda';
import { RelatorioFechamento } from './relatorio-fechamento';
import { PaginaImpressao } from './pagina-impressao';
export function ManualCaixa() { const { estado } = usePrototipo(); if (!estado.pronto) return null; return <section className="manual-secao pilha" id="caixa-manual"><h2>Caixa, PDV e conferência</h2><p className="suave">Resumo compacto fixa os totais durante a operação. PDV reutiliza abas, busca, quantidade e campos monetários. A conferência usa a tabela responsiva com esperado, informado e diferença em texto. Fechar pede confirmação; corrigir ou reabrir pede motivo. Cupom não fiscal e relatório reutilizam a página de impressão.</p><ResumoCaixa dados={estado.dados} caixa={estado.dados.caixas[0]} /><PaginaImpressao><CupomVenda dados={estado.dados} venda={estado.dados.vendas[0]} /><RelatorioFechamento dados={estado.dados} caixa={estado.dados.caixas[0]} /></PaginaImpressao></section>; }
