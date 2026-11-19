'use client';
import { useState } from 'react';
import { usePrototipo } from '@/lib/prototipo-store';
import { dataRelativa } from '@/lib/dados';
import type { ItemQuantidade } from '@/lib/estoque';
import { perdas } from '@/lib/estoque';
import { formatarMoeda } from '@/lib/formatar';
import { GraficoBarras } from './grafico-barras';
import { ItensEstoque, TabelaMovimentos } from './tela-estoque';
export function ManualEstoque() {
  const { estado } = usePrototipo(), [itens, setItens] = useState<ItemQuantidade[]>([{ insumoId: 'farinha-trigo', quantidade: 500 }]); if (!estado.pronto) return null;
  const d = estado.dados, p = perdas(d, 'consolidado', dataRelativa(-90), dataRelativa(0));
  return <section className="manual-secao pilha" id="estoque-manual"><h2>Estoque: itens, movimentos e barras</h2><p className="suave">Linhas de itens mostram o saldo da origem ao lado da quantidade. A tabela de movimentos traz tipo, origem e destino, motivo e link para a origem do registro. O gráfico de barras em SVG escreve o valor de cada barra e resume tudo no texto alternativo. Exemplo sem gravação.</p><ItensEstoque dados={d} itens={itens} aoMudar={setItens} estoqueId="almox-matriz" /><GraficoBarras rotulo="Exemplo de perdas por mês" barras={p.porMes.map(m => ({ rotulo: m.nome, valor: m.valor, texto: formatarMoeda(Math.round(m.valor)) }))} /><TabelaMovimentos dados={d} lista={d.movimentosEstoque.slice(-3)} legenda="Exemplo de movimentações" /></section>;
}
