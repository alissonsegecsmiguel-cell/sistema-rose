'use client';
import { useState } from 'react';
import { usePrototipo } from '@/lib/prototipo-store';
import type { Compra } from '@/lib/tipos';
import { CampoArquivo } from './campo-arquivo';
import { ConferenciaCompra } from './tela-compras';
import { TabelaContas } from './detalhe-compra';
import { useNotificacao } from './notificacao';
export function ManualCompras() {
  const { estado } = usePrototipo(), notificar = useNotificacao(), [compra, setCompra] = useState<Compra | undefined>(() => estado.dados.compras.find(c => c.itens.length > 1)); if (!estado.pronto || !compra) return null; const d = estado.dados;
  return <section className="manual-secao pilha" id="compras-manual"><h2>Compras: arquivo, conferência e contas</h2><p className="suave">CampoArquivo tem rótulo, ajuda e nome do último arquivo, e o arquivo nunca sai do navegador. A conferência mostra cada item com vínculo ao insumo, selo de sugestão, conversão escrita por extenso e novo custo; itens fora do estoque escolhem a categoria de despesa. Parcelas mostram a soma contra o total. A tabela de contas usa selos Paga, Aberta e Vencida em texto. Exemplo sem gravação.</p><CampoArquivo rotulo="Exemplo de arquivo" accept=".xml" aoEscolher={f => notificar(`Exemplo: ${f.name} escolhido, nada foi lido.`)} /><ConferenciaCompra dados={d} compra={compra} aoMudar={setCompra} /><TabelaContas dados={d} contas={d.contasPagar.slice(0, 3)} legenda="Exemplo de contas a pagar" /></section>;
}
