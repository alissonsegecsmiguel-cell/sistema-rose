'use client';
import { useState } from 'react';
import type { Encomenda, StatusEncomenda } from '@/lib/tipos';
import { usePrototipo } from '@/lib/prototipo-store';
import { COLUNAS_QUADRO, moverEncomendaQuadro, quadroEncomendas, registrarPagamentoEncomenda, saldoEncomenda, sequenciaStatus } from '@/lib/dados';
import { formatarMoeda } from '@/lib/formatar';
import { QuadroKanban } from './quadro-kanban';
import { Dialogo } from './dialogo';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { CampoValor } from './campo-valor';
import { Selecao } from './selecao';
import { Aviso } from './aviso';
import { useNotificacao } from './notificacao';

type Pendente = { e: Encomenda; destino: StatusEncomenda; etapa: 'converter' | 'pular' | 'voltar' | 'saldo' | 'pagamento' };
const titulo = (s: StatusEncomenda) => COLUNAS_QUADRO.find(c => c.status === s)?.titulo ?? s;

/** Aba Quadro: aplica as mesmas regras de status da tarefa 05, com confirmações. */
export function QuadroEncomendas({ periodo, modalidade, busca, retorno }: { periodo: string; modalidade: string; busca: string; retorno: string }) {
  const { estado, usuario, atualizar } = usePrototipo(), { dados, lojaId } = estado, notificar = useNotificacao();
  const [pendente, setPendente] = useState<Pendente>(), [motivo, setMotivo] = useState(''), [erro, setErro] = useState(''), [forma, setForma] = useState(dados.formasPagamento[0]?.id ?? ''), [valor, setValor] = useState(0);
  const colunas = quadroEncomendas(dados, lojaId, { periodo, modalidade, busca });
  const concluir = (p: Pendente, comPagamento = false) => {
    try {
      let novo = dados; if (comPagamento) novo = registrarPagamentoEncomenda(novo, lojaId, p.e.id, forma, valor, usuario!.id);
      atualizar(moverEncomendaQuadro(novo, lojaId, p.e.id, p.destino, usuario!.id, motivo)); setPendente(undefined); setErro('');
      notificar(`Encomenda nº ${p.e.numero} movida para ${titulo(p.destino)}`);
    } catch (x) { setErro((x as Error).message); }
  };
  const precisaSaldo = (p: Pendente) => p.destino === 'entregue' && saldoEncomenda(p.e) > 0;
  const seguir = (p: Pendente) => { if (precisaSaldo(p) && p.etapa !== 'saldo' && p.etapa !== 'pagamento') { setValor(saldoEncomenda(p.e)); setPendente({ ...p, etapa: 'saldo' }); } else concluir(p); };
  const mover = (e: Encomenda, destino: StatusEncomenda) => {
    setErro(''); setMotivo(''); const de = sequenciaStatus.indexOf(e.status), para = sequenciaStatus.indexOf(destino);
    if (para === de) return; const base: Pendente = { e, destino, etapa: 'pular' };
    if (para < de) return setPendente({ ...base, etapa: 'voltar' });
    if (e.status === 'orcamento') return setPendente({ ...base, etapa: 'converter' });
    if (para - de > 1) return setPendente(base);
    if (precisaSaldo(base)) { setValor(saldoEncomenda(e)); return setPendente({ ...base, etapa: 'saldo' }); }
    concluir(base);
  };
  const p = pendente, puladas = p ? sequenciaStatus.slice(sequenciaStatus.indexOf(p.e.status) + 1, sequenciaStatus.indexOf(p.destino)).map(titulo) : [];
  const nomes = { converter: 'Converter em encomenda confirmada?', pular: 'Pular etapas?', voltar: 'Voltar etapa', saldo: 'Há saldo em aberto', pagamento: 'Registrar pagamento' };
  return <><QuadroKanban dados={dados} lojaId={lojaId} colunas={colunas} aoMover={mover} retorno={retorno} />
    <Dialogo aberto={!!p} aoFechar={() => setPendente(undefined)} titulo={p ? nomes[p.etapa] : 'Mover encomenda'}>{p && <>{erro && <Aviso tom="erro">{erro}</Aviso>}
      {p.etapa === 'converter' && <><p>O orçamento nº {p.e.numero} vira encomenda e segue para {titulo(p.destino)}.{puladas.length ? ` Etapas registradas no histórico: ${puladas.join(', ')}.` : ''}</p><div className="linha"><Botao variante="secundario" onClick={() => setPendente(undefined)}>Cancelar</Botao><Botao onClick={() => seguir({ ...p, etapa: 'pular' })}>Converter e mover</Botao></div></>}
      {p.etapa === 'pular' && <><p>A encomenda nº {p.e.numero} vai de {titulo(p.e.status)} para {titulo(p.destino)}. O histórico registra as etapas puladas: {puladas.join(', ')}.</p><div className="linha"><Botao variante="secundario" onClick={() => setPendente(undefined)}>Cancelar</Botao><Botao onClick={() => seguir(p)}>Confirmar mudança</Botao></div></>}
      {p.etapa === 'voltar' && <><p>A encomenda nº {p.e.numero} volta de {titulo(p.e.status)} para {titulo(p.destino)}.</p><CampoTexto rotulo="Motivo da mudança" required value={motivo} onChange={ev => setMotivo(ev.target.value)} /><div className="linha"><Botao variante="secundario" onClick={() => setPendente(undefined)}>Cancelar</Botao><Botao onClick={() => motivo.trim() ? concluir(p) : setErro('Informe o motivo para voltar a etapa.')}>Confirmar mudança</Botao></div></>}
      {p.etapa === 'saldo' && <><p>Há {formatarMoeda(saldoEncomenda(p.e))} pendentes. Deseja receber agora?</p><Botao onClick={() => setPendente({ ...p, etapa: 'pagamento' })}>Registrar pagamento agora</Botao><Botao variante="secundario" onClick={() => concluir(p)}>Seguir com saldo pendente</Botao></>}
      {p.etapa === 'pagamento' && <><p>Saldo: {formatarMoeda(saldoEncomenda(p.e))}</p><Selecao rotulo="Forma de pagamento" value={forma} onChange={ev => setForma(ev.target.value)}>{dados.formasPagamento.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</Selecao><CampoValor rotulo="Valor a receber" valorCentavos={valor} onChange={setValor} /><Botao onClick={() => concluir(p, true)}>Confirmar pagamento</Botao></>}
    </>}</Dialogo></>;
}
