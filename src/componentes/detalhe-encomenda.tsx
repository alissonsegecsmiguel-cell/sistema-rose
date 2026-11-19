'use client';
import Link from 'next/link';
import { usePrototipo } from '@/lib/prototipo-store';
import { descricaoBolo, obterCliente, obterEncomenda, saldoEncomenda, situacaoPagamento, totalEncomenda } from '@/lib/dados';
import { formatarMoeda } from '@/lib/formatar';
import { CabecalhoPagina } from './cabecalho-pagina';
import { Cartao } from './cartao';
import { LinkBotao } from './link-botao';
import { SeloStatus } from './selo-status';
import { EstadoVazio } from './estado-vazio';
import { LinhaTempo } from './linha-tempo';
import { AcoesEncomenda, LinhaPagamento } from './acoes-encomenda';
import { CustoEncomenda } from './custo-encomenda';
export function DetalheEncomenda({ id, voltar }: { id: string; voltar?: string }) {
  const { estado, usuario } = usePrototipo(); if (!estado.pronto) return null;
  const { dados, lojaId } = estado, e = obterEncomenda(dados, lojaId, id), retorno = voltar && (voltar === '/encomendas' || voltar.startsWith('/encomendas?') || /^\/clientes\/[a-zA-Z0-9-]+$/.test(voltar)) ? voltar : '/encomendas';
  if (!e) return <EstadoVazio titulo="Encomenda não encontrada" texto="Confira a loja selecionada e o endereço." acao={<LinkBotao href={retorno}>{retorno.startsWith("/clientes/") ? "Voltar ao cliente" : "Voltar para encomendas"}</LinkBotao>} />;
  const c = obterCliente(dados, lojaId, e.clienteId), total = totalEncomenda(e);
  return <div className="pilha"><CabecalhoPagina titulo={`Encomenda nº ${e.numero}`} subtitulo={dados.lojas.find(l => l.id === e.lojaId)?.nome} acoes={<LinkBotao href={retorno}>{retorno.startsWith("/clientes/") ? "Voltar ao cliente" : "Voltar para encomendas"}</LinkBotao>} /><div className="linha"><SeloStatus status={e.status} modalidade={e.modalidade} /><SeloStatus status={situacaoPagamento(e)} /></div><AcoesEncomenda encomenda={e} /><div className="grade"><Cartao className="pilha-curta"><h2>Cliente</h2><Link href={`/clientes/${c?.id}`}>{c?.nome}</Link><p>{c?.telefone}</p>{c?.observacoes && <p>{c.observacoes}</p>}</Cartao><Cartao className="pilha-curta"><h2>Entrega</h2><p>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${e.dataEntrega}T12:00:00Z`))} às {e.horaEntrega}</p><p>{e.modalidade === 'retirada' ? 'Retirada' : 'Entrega'}</p>{e.enderecoEntrega && <p>{e.enderecoEntrega}</p>}</Cartao></div><Cartao className="pilha"><h2>Itens</h2>{e.itens.map(i => <div className="pilha-curta" key={i.id}><p>{i.tipo === 'bolo' ? descricaoBolo(dados, i) : `${i.quantidade} ${dados.produtos.find(p => p.id === i.produtoId)?.nome}`}</p>{i.tipo === 'produto' && <p>{i.observacao}</p>}<strong className="numerico">{formatarMoeda(i.tipo === 'bolo' ? i.valorCentavos : i.quantidade * i.valorUnitarioCentavos)}</strong></div>)}</Cartao><Cartao className="pilha-curta"><h2>Valores</h2><p>Subtotal: {formatarMoeda(total + e.descontoCentavos - e.taxaCartaoCentavos)}</p><p>Desconto: {formatarMoeda(e.descontoCentavos)}</p><p>Taxa de cartão: {formatarMoeda(e.taxaCartaoCentavos)}</p><strong>Total: {formatarMoeda(total)}</strong><p>Pago: {formatarMoeda(e.pagamentos.reduce((s, p) => s + p.valorCentavos, 0))}</p><strong>Saldo: {formatarMoeda(saldoEncomenda(e))}</strong></Cartao>{usuario?.perfil === 'administrativo' && <CustoEncomenda dados={dados} encomenda={e} />}<Cartao className="pilha"><h2>Pagamentos</h2>{e.pagamentos.length ? e.pagamentos.map(p => <LinhaPagamento key={p.id} encomendaId={e.id} pagamento={p} />) : <p className="suave">Nenhum pagamento registrado.</p>}</Cartao><Cartao className="pilha"><h2>Histórico</h2><LinhaTempo eventos={e.historico.map(h => ({ ...h, titulo: h.acao, usuario: dados.usuarios.find(u => u.id === h.usuarioId)?.nome || 'Usuário indisponível' }))} /></Cartao>{e.observacoes && <Cartao className="pilha"><h2>Observações</h2><p>{e.observacoes}</p></Cartao>}</div>;
}
