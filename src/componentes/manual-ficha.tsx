'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { arvoreFicha } from '@/lib/custos';
import { ArvoreFicha } from './detalhe-ficha';
import { GraficoPrecos } from './grafico-precos';
import { LinhasComponentes } from './tela-ficha-tecnica';
import { CustoEncomenda } from './custo-encomenda';
export function ManualFicha() {
  const { estado } = usePrototipo(); if (!estado.pronto) return null; const d = estado.dados, insumo = d.insumos.find(i => i.historicoPrecos.length > 2) ?? d.insumos[0], encomenda = d.encomendas.find(e => e.itens.some(i => i.tipo === 'bolo'));
  return <section className="manual-secao pilha" id="ficha-manual"><h2>Ficha técnica: linhas, árvore e gráfico</h2><p className="suave">Linhas de componentes escolhem insumo ou ficha por grupos, com quantidade na unidade de uso e custo da linha anunciado. A árvore usa details e summary nativos, abertos por Enter ou Espaço. O mini gráfico em SVG tem texto alternativo com o primeiro e o último preço, repetido na legenda. O bloco de custo da encomenda aparece só para o Administrativo. Exemplo sem gravação.</p><LinhasComponentes dados={d} componentes={d.fichas[0]?.componentes.slice(0, 2) ?? []} aoMudar={() => undefined} /><ul className="arvore"><ArvoreFicha no={arvoreFicha(d, 'recheio-chocolate')} raiz /></ul><GraficoPrecos pontos={insumo.historicoPrecos.map(h => ({ data: h.data, valor: h.valorCentavos }))} rotulo={`Evolução do preço de ${insumo.nome}`} />{encomenda && <CustoEncomenda dados={d} encomenda={encomenda} />}</section>;
}
