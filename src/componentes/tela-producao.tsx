'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { alterarStatusEncomenda, dataRelativa, resumoProducao, somarDiasData } from '@/lib/dados';
import { usePrototipo } from '@/lib/prototipo-store';
import { formatarData } from '@/lib/formatar';
import { CabecalhoPagina } from './cabecalho-pagina';
import { CampoTexto } from './campo-texto';
import { Botao } from './botao';
import { LinkBotao } from './link-botao';
import { Abas } from './abas';
import { Tabela } from './tabela';
import { Cartao } from './cartao';
import { EstadoVazio } from './estado-vazio';
import { Aviso } from './aviso';
import { CartaoProducao } from './cartao-producao';
import { ResumoProducaoDia } from './resumo-producao-dia';
export function TelaProducao() {
  const { estado, usuario, atualizar } = usePrototipo(), params = useSearchParams(), [erro, setErro] = useState('');
  if (!estado.pronto || !usuario) return null;
  const data = /^\d{4}-\d{2}-\d{2}$/.test(params.get('data') || '') ? params.get('data')! : dataRelativa(0), fim = params.get('fim') || data, resumo = resumoProducao(estado.dados, estado.lojaId, data, fim), { dados } = estado;
  const mudar = (data: string, fim = '') => { const p = new URLSearchParams({ data }); if (fim) p.set('fim', fim); window.history.replaceState(null, '', `/producao?${p}`); };
  const avancar = (id: string, status: 'em_producao' | 'pronto') => { try { atualizar(alterarStatusEncomenda(dados, estado.lojaId, id, status, usuario.id)); setErro(''); } catch (e) { setErro((e as Error).message); } };
  const tabela = (separar: boolean) => { const lista = resumo.produtos.filter(p => p.separar === separar); return lista.length ? <Tabela legenda={separar ? 'Separar para entrega' : 'Totais de doces por observação'} colunas={[{ chave: 'produto', titulo: 'Produto' }, { chave: 'quantidade', titulo: 'Quantidade' }, { chave: 'observacao', titulo: 'Observação exata' }]} linhas={lista.map(p => ({ id: p.id, celulas: { produto: p.nome, quantidade: `${p.quantidade} un`, observacao: p.observacao || 'Sem observação' } }))} /> : <p className="suave">Nenhum item para {separar ? 'separar' : 'produzir'} neste período.</p>; };
  return <div className="pilha"><CabecalhoPagina titulo="Produção" subtitulo={`${formatarData(data)}${fim !== data ? ` a ${formatarData(fim)}` : ''}`} /><div className="linha"><Botao variante="secundario" onClick={() => mudar(somarDiasData(data, -1))} icone="anterior" aria-label="Dia anterior">Anterior</Botao><CampoTexto rotulo="Data de produção" type="date" value={data} onChange={e => mudar(e.target.value || dataRelativa(0))} /><Botao variante="secundario" onClick={() => mudar(somarDiasData(data, 1))} icone="seta" aria-label="Dia seguinte">Seguinte</Botao><Botao variante="fantasma" onClick={() => mudar(dataRelativa(0))}>Hoje</Botao><Botao variante="fantasma" onClick={() => mudar(dataRelativa(1))}>Amanhã</Botao><Botao variante="fantasma" onClick={() => mudar(dataRelativa(0), dataRelativa(2))}>Próximos 3 dias</Botao></div>{erro && <Aviso tom="erro">{erro}</Aviso>}<ResumoProducaoDia resumo={resumo} /><Abas rotulo="Produção por tipo" itens={[{ id: 'bolos', titulo: 'Bolos', conteudo: <div className="pilha"><LinkBotao href={`/producao/imprimir?data=${data}&fim=${fim}&tipo=bolos`}>Imprimir comanda do dia de bolos</LinkBotao>{resumo.bolos.length ? <div className="grade">{resumo.bolos.map(b => <CartaoProducao key={b.item.id} dados={dados} encomenda={b.encomenda} item={b.item} aoIniciar={() => avancar(b.encomenda.id, 'em_producao')} aoPronto={() => avancar(b.encomenda.id, 'pronto')} />)}</div> : <EstadoVazio titulo="Nenhum bolo para produzir" texto="Escolha outra data ou confirme uma encomenda." />}</div> }, { id: 'doces', titulo: 'Doces e outros', conteudo: <div className="pilha"><LinkBotao href={`/producao/imprimir?data=${data}&fim=${fim}&tipo=doces`}>Imprimir comanda do dia de doces</LinkBotao><h2>Totais por produto e observação</h2>{tabela(false)}<h2>Separar para entrega</h2>{tabela(true)}<h2>Por encomenda</h2>{resumo.lista.map(e => <Cartao key={e.id} className="pilha-curta"><h3>#{e.numero} • {e.horaEntrega} • {dados.clientes.find(c => c.id === e.clienteId)?.nome.split(' ')[0]}</h3>{e.itens.filter(i => i.tipo === 'produto').map(i => <p key={i.id}>{i.quantidade} {dados.produtos.find(p => p.id === i.produtoId)?.nome} • {i.observacao || 'Sem observação'}</p>)}<LinkBotao href={`/encomendas/${e.id}`}>Ver encomenda</LinkBotao></Cartao>)}</div> }]} /></div>;
}
