'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePrototipo } from '@/lib/prototipo-store';
import { alertasDoDia, aniversariantes, dataRelativa, encomendasDoDia, obterCliente, proximosDias, resumirItens, resumoDoDia, saldoEncomenda, situacaoPagamento, obterCaixa, resumoCaixa, resumoCaixasDoDia, resumoProducao } from '@/lib/dados';
import { formatarData, formatarMoeda } from '@/lib/formatar';
import { CabecalhoPagina } from '@/componentes/cabecalho-pagina';
import { LinkBotao } from '@/componentes/link-botao';
import { Indicador } from '@/componentes/indicador';
import { Cartao } from '@/componentes/cartao';
import { Tabela } from '@/componentes/tabela';
import { SeloStatus } from '@/componentes/selo-status';
import { Opcao } from '@/componentes/opcao';
import { EstadoVazio } from '@/componentes/estado-vazio';
import { FaixaDias } from '@/componentes/faixa-dias';
export default function Pagina() {
  const { estado } = usePrototipo(); const [modalidade, setModalidade] = useState('todas');
  if (!estado.pronto) return null;
  const { dados, lojaId } = estado, resumo = resumoDoDia(dados, lojaId), alertas = alertasDoDia(dados, lojaId), aniversarios = aniversariantes(dados, lojaId);
  const lista = encomendasDoDia(dados, lojaId).filter(e => modalidade === 'todas' || e.modalidade === modalidade);
  const hoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: dados.configuracao.fuso }).format(new Date(`${dataRelativa(0)}T12:00:00-03:00`));
  const consolidadoCaixa = resumoCaixasDoDia(dados);
  const producao = resumoProducao(dados, lojaId);
  const caixa = lojaId === "consolidado" ? undefined : obterCaixa(dados, lojaId);
  const colunas = [{ chave: 'hora', titulo: 'Hora' }, { chave: 'numero', titulo: 'Número' }, { chave: 'cliente', titulo: 'Cliente' }, { chave: 'itens', titulo: 'Itens' }, ...(lojaId === 'consolidado' ? [{ chave: 'loja', titulo: 'Loja' }] : []), { chave: 'modalidade', titulo: 'Modalidade' }, { chave: 'status', titulo: 'Status' }, { chave: 'pagamento', titulo: 'Pagamento' }, { chave: 'saldo', titulo: 'Saldo' }, { chave: 'acoes', titulo: 'Ações' }];
  return <div className="pilha"><CabecalhoPagina titulo="Visão geral" subtitulo={`${hoje} • ${lojaId === 'consolidado' ? 'Consolidado' : dados.lojas.find(l => l.id === lojaId)?.nome}`} acoes={<><LinkBotao href="/encomendas/nova" variante="primario" icone="mais">Nova encomenda</LinkBotao><LinkBotao href="/encomendas/nova?tipo=orcamento">Novo orçamento</LinkBotao></>} />
    <div className="grade"><Indicador rotulo="Encomendas hoje" valor={String(resumo.quantidade)} /><Indicador rotulo="A receber hoje" valor={formatarMoeda(resumo.saldoCentavos)} /><Indicador rotulo="Orçamentos em aberto" valor={String(resumo.orcamentos)} /><div className="pilha-curta"><Indicador rotulo="Caixa" valor={caixa ? caixa.status === "aberto" ? "Aberto" : "Fechado" : lojaId === "consolidado" ? `${consolidadoCaixa.abertos} abertos, ${consolidadoCaixa.fechados} fechados` : "Caixa ainda não aberto"} ajuda={caixa ? `Total: ${formatarMoeda(resumoCaixa(dados, caixa).total)}. Dinheiro esperado: ${formatarMoeda(resumoCaixa(dados, caixa).dinheiro)}` : lojaId === "consolidado" ? `Total: ${formatarMoeda(consolidadoCaixa.total)}. Dinheiro esperado: ${formatarMoeda(consolidadoCaixa.dinheiro)}` : undefined} /><LinkBotao href="/caixa">Ver caixa</LinkBotao></div></div>
    <Cartao className="pilha"><h2>Produção de hoje</h2><p>{producao.quantidadeBolos} bolos ({producao.bolosProntos} prontos) • {producao.doces} doces ({producao.docesProntos} prontos)</p><LinkBotao href="/producao">Ver produção</LinkBotao></Cartao><section className="pilha" aria-labelledby="hoje-titulo"><h2 id="hoje-titulo">Encomendas de hoje</h2><fieldset><legend>Modalidade</legend><div className="linha">{[['todas', 'Todas'], ['retirada', 'Retirada'], ['entrega', 'Entrega']].map(([id, nome]) => <Opcao key={id} pilula type="radio" name="modalidade" checked={modalidade === id} onChange={() => setModalidade(id)}>{nome}</Opcao>)}</div></fieldset>{lista.length ? <Tabela legenda="Encomendas de hoje" colunas={colunas} linhas={lista.map(e => ({ id: e.id, celulas: { hora: e.horaEntrega, numero: `#${e.numero}`, cliente: obterCliente(dados, lojaId, e.clienteId)?.nome, itens: resumirItens(dados, e), loja: dados.lojas.find(l => l.id === e.lojaId)?.nome, modalidade: e.modalidade === 'entrega' ? 'Entrega' : 'Retirada', status: <SeloStatus status={e.status} modalidade={e.modalidade} />, pagamento: <SeloStatus status={situacaoPagamento(e)} />, saldo: formatarMoeda(saldoEncomenda(e)), acoes: <LinkBotao href={`/encomendas/${e.id}`}>Ver</LinkBotao> } }))} /> : <EstadoVazio titulo="Nenhuma encomenda para hoje." texto="Confira outra modalidade ou os próximos dias." />}</section>
    <section className="pilha"><h2>Próximos 7 dias</h2><FaixaDias dias={proximosDias(dados, lojaId)} /></section>
    <Cartao className="pilha"><h2>Atenção</h2>{alertas.length ? alertas.map(a => <Link href={`/encomendas/${a.id}`} key={a.id}>{a.texto}</Link>) : <p className="suave">Nenhum alerta para os próximos dias.</p>}</Cartao>
    {!!aniversarios.length && <Cartao className="pilha"><h2>Aniversariantes da semana</h2>{aniversarios.map(c => <p key={c.id}><Link href={`/clientes/${c.id}`}>{c.nome}</Link> • {formatarData(c.proximoAniversario)} • {c.telefone}</p>)}</Cartao>}
  </div>;
}
