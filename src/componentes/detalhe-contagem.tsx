'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { estoquesDaLoja, valorAjustadoContagem, valorEmEstoque } from '@/lib/estoque';
import { formatarData, formatarMoeda } from '@/lib/formatar';
import { CabecalhoPagina } from './cabecalho-pagina';
import { Tabela } from './tabela';
import { LinkBotao } from './link-botao';
import { EstadoVazio } from './estado-vazio';
import { PaginaImpressao } from './pagina-impressao';
const qtd = (v: number, u: string) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v)} ${u}`;
export function DetalheContagem({ id }: { id: string }) {
  const { estado } = usePrototipo(); if (!estado.pronto) return null; const d = estado.dados, c = d.contagens.find(x => x.id === id), un = (i: string) => d.insumos.find(x => x.id === i)?.unidadeUso ?? '';
  if (!c || !estoquesDaLoja(d, estado.lojaId, true).some(e => e.id === c.estoqueId)) return <EstadoVazio titulo="Contagem não encontrada" texto="Confira a loja selecionada." acao={<LinkBotao href="/estoque?aba=contagem">Voltar às contagens</LinkBotao>} />;
  const itens = c.itens.filter(i => i.contado !== null);
  return <div className="pilha"><CabecalhoPagina titulo={`Contagem de ${d.estoques.find(e => e.id === c.estoqueId)?.nome}`} subtitulo={`${c.status === 'concluida' ? 'Concluída' : 'Em andamento'} em ${formatarData(c.concluidaEm ?? c.data)} • valor ajustado ${formatarMoeda(Math.round(valorAjustadoContagem(d, c)))}`} acoes={<><LinkBotao href="/estoque?aba=contagem">Voltar às contagens</LinkBotao><LinkBotao href={`/estoque/contagem/${c.id}/imprimir`}>Imprimir folha</LinkBotao></>} />{itens.length ? <Tabela legenda="Itens contados" colunas={[{ chave: 'insumo', titulo: 'Insumo' }, { chave: 'sistema', titulo: 'Sistema' }, { chave: 'contado', titulo: 'Contado' }, { chave: 'diferenca', titulo: 'Diferença' }, { chave: 'valor', titulo: 'Valor' }]} linhas={itens.map(i => ({ id: i.insumoId, celulas: { insumo: d.insumos.find(x => x.id === i.insumoId)?.nome, sistema: qtd(i.saldoSistema, un(i.insumoId)), contado: qtd(i.contado!, un(i.insumoId)), diferenca: <span className={`selo ${i.diferenca ? 'tom-alerta' : 'tom-sucesso'}`}>{qtd(i.diferenca, un(i.insumoId))}</span>, valor: formatarMoeda(Math.round(valorEmEstoque(d, i.insumoId, i.diferenca))) } }))} /> : <EstadoVazio titulo="Nenhum item contado ainda" texto="Continue a contagem pela aba Contagem." />}</div>;
}
/** Folha A4 para contar no papel: sem saldo do sistema, para não contar de olho no número. */
export function FolhaContagem({ id }: { id: string }) {
  const { estado } = usePrototipo(); if (!estado.pronto) return null; const d = estado.dados, c = d.contagens.find(x => x.id === id);
  if (!c) return <EstadoVazio titulo="Contagem não encontrada" texto="Confira o endereço." acao={<LinkBotao href="/estoque?aba=contagem">Voltar às contagens</LinkBotao>} />;
  return <PaginaImpressao formatoInicial="a4"><div className="nao-imprimir"><LinkBotao href="/estoque?aba=contagem">Voltar às contagens</LinkBotao></div><h1>Folha de contagem</h1><p>{d.estoques.find(e => e.id === c.estoqueId)?.nome} • {formatarData(c.data)} • Responsável: ______________________</p><table className="folha-contagem"><thead><tr><th scope="col">Insumo</th><th scope="col">Unidade</th><th scope="col">Contado</th></tr></thead><tbody>{c.itens.map(i => { const insumo = d.insumos.find(x => x.id === i.insumoId); return <tr key={i.insumoId}><td>{insumo?.nome}</td><td>{insumo?.unidadeUso}</td><td>{i.contado ?? ''}</td></tr>; })}</tbody></table></PaginaImpressao>;
}
