'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DadosPrototipo, FormaPagamento, Loja, Usuario } from '@/lib/tipos';
import { usePrototipo } from '@/lib/prototipo-store';
import { novoUsuario, salvarConfiguracaoCaixa, salvarConfiguracaoEncomendas, salvarFormaPagamento, salvarLoja, salvarUsuario } from '@/lib/dados';
import { CabecalhoPagina } from './cabecalho-pagina';
import { Abas } from './abas';
import { Botao } from './botao';
import { Cartao } from './cartao';
import { CampoTexto } from './campo-texto';
import { CampoValor } from './campo-valor';
import { Selecao } from './selecao';
import { Opcao } from './opcao';
import { Tabela } from './tabela';
import { Dialogo } from './dialogo';
import { Aviso } from './aviso';
import { useNotificacao } from './notificacao';

const ABAS = ['lojas', 'usuarios', 'formas', 'caixa', 'encomendas', 'marca', 'dados'];
const situacao = (ativo: boolean) => <span className={`selo ${ativo ? 'tom-sucesso' : 'tom-neutro'}`}>{ativo ? 'Ativo' : 'Inativo'}</span>;
const pct = (v?: number) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v ?? 0)}%`;

export function TelaConfiguracoes() {
  const { estado } = usePrototipo(), busca = useSearchParams(), router = useRouter(); if (!estado.pronto) return null;
  const aba = ABAS.includes(busca.get('aba') || '') ? busca.get('aba')! : 'lojas';
  return <div className="pilha"><CabecalhoPagina titulo="Configurações" subtitulo="Ajustes do protótipo. Valores de teste, a confirmar com o cliente." /><Abas rotulo="Seções das configurações" ativa={aba} aoMudar={id => router.replace(`/configuracoes?aba=${id}`, { scroll: false })} itens={[{ id: 'lojas', titulo: 'Lojas', conteudo: <AbaLojas /> }, { id: 'usuarios', titulo: 'Usuários', conteudo: <AbaUsuarios /> }, { id: 'formas', titulo: 'Formas de pagamento', conteudo: <AbaFormas /> }, { id: 'caixa', titulo: 'Caixa', conteudo: <AbaCaixa /> }, { id: 'encomendas', titulo: 'Encomendas', conteudo: <AbaEncomendas /> }, { id: 'marca', titulo: 'Marca', conteudo: <AbaMarca /> }, { id: 'dados', titulo: 'Dados de teste', conteudo: <AbaDados /> }]} /></div>;
}

function AbaLojas() {
  const { estado, atualizar } = usePrototipo(), d = estado.dados, notificar = useNotificacao(), [editando, setEditando] = useState<Loja>(), [erro, setErro] = useState('');
  return <div className="pilha"><Tabela legenda="Lojas" colunas={[{ chave: 'nome', titulo: 'Nome' }, { chave: 'endereco', titulo: 'Endereço' }, { chave: 'telefone', titulo: 'Telefone' }, { chave: 'cnpj', titulo: 'CNPJ' }, { chave: 'acoes', titulo: 'Ações' }]} linhas={d.lojas.map(l => ({ id: l.id, celulas: { nome: l.nome, endereco: l.endereco, telefone: l.telefone || '[a confirmar com o cliente]', cnpj: l.cnpj || '[a confirmar com o cliente]', acoes: <Botao variante="secundario" aria-label={`Editar ${l.nome}`} onClick={() => { setErro(''); setEditando({ ...l }); }}>Editar</Botao> } }))} /><p className="pequeno suave">Lojas não podem ser excluídas: encomendas, caixas e estoques dependem delas.</p>
    <Dialogo aberto={!!editando} aoFechar={() => setEditando(undefined)} titulo="Editar loja">{editando && <form className="pilha" onSubmit={e => { e.preventDefault(); try { atualizar(salvarLoja(d, editando)); setEditando(undefined); notificar('Loja salva.'); } catch (x) { setErro((x as Error).message); } }}>{erro && <Aviso tom="erro">{erro}</Aviso>}<CampoTexto rotulo="Nome da loja" required value={editando.nome} onChange={e => setEditando({ ...editando, nome: e.target.value })} /><CampoTexto rotulo="Endereço" value={editando.endereco} onChange={e => setEditando({ ...editando, endereco: e.target.value })} /><CampoTexto rotulo="Telefone da loja" value={editando.telefone ?? ''} onChange={e => setEditando({ ...editando, telefone: e.target.value })} /><CampoTexto rotulo="CNPJ (opcional)" value={editando.cnpj ?? ''} onChange={e => setEditando({ ...editando, cnpj: e.target.value })} ajuda="Use dados fictícios no protótipo." /><div className="linha"><Botao variante="secundario" onClick={() => setEditando(undefined)}>Cancelar</Botao><Botao type="submit">Salvar loja</Botao></div></form>}</Dialogo></div>;
}

function AbaUsuarios() {
  const { estado, atualizar } = usePrototipo(), d = estado.dados, notificar = useNotificacao(), [editando, setEditando] = useState<Usuario>();
  return <div className="pilha"><Aviso titulo="Sem senha no protótipo">No protótipo não há senha. No sistema real, cada pessoa recebe um convite por e-mail e cria a própria senha.</Aviso><div className="linha"><Botao icone="mais" onClick={() => setEditando(novoUsuario())}>Novo usuário</Botao></div>
    <Tabela legenda="Usuários" colunas={[{ chave: 'nome', titulo: 'Nome' }, { chave: 'perfil', titulo: 'Perfil' }, { chave: 'loja', titulo: 'Loja' }, { chave: 'email', titulo: 'E-mail' }, { chave: 'situacao', titulo: 'Situação' }, { chave: 'acoes', titulo: 'Ações' }]} linhas={d.usuarios.map(u => ({ id: u.id, celulas: { nome: u.nome, perfil: u.perfil === 'administrativo' ? 'Administrativo' : 'Atendimento', loja: d.lojas.find(l => l.id === u.lojaId)?.nome, email: u.email || <span className="suave">Não informado</span>, situacao: situacao(u.ativo !== false), acoes: <Botao variante="secundario" aria-label={`Editar ${u.nome}`} onClick={() => setEditando({ ...u })}>Editar</Botao> } }))} />
    <Dialogo aberto={!!editando} aoFechar={() => setEditando(undefined)} titulo={editando && d.usuarios.some(u => u.id === editando.id) ? 'Editar usuário' : 'Novo usuário'}>{editando && <FormularioUsuario key={editando.id} dados={d} inicial={editando} aoCancelar={() => setEditando(undefined)} aoSalvar={u => { atualizar(salvarUsuario(d, u)); setEditando(undefined); notificar(u.ativo === false ? `${u.nome} inativado: sai da tela de entrada e continua no histórico.` : `${u.nome} salvo. Já aparece na tela de entrada.`); }} />}</Dialogo></div>;
}
function FormularioUsuario({ dados, inicial, aoSalvar, aoCancelar }: { dados: DadosPrototipo; inicial: Usuario; aoSalvar: (u: Usuario) => void; aoCancelar: () => void }) {
  const { usuario } = usePrototipo(), [u, setU] = useState(inicial), [erro, setErro] = useState(''), mudar = (p: Partial<Usuario>) => setU({ ...u, ...p });
  return <form className="pilha" onSubmit={e => { e.preventDefault(); try { salvarUsuario(dados, u, usuario?.id); aoSalvar(u); } catch (x) { setErro((x as Error).message); } }}>{erro && <Aviso tom="erro">{erro}</Aviso>}<CampoTexto rotulo="Nome do usuário" required value={u.nome} onChange={e => mudar({ nome: e.target.value })} ajuda="Use nomes fictícios no protótipo." /><CampoTexto rotulo="E-mail (opcional)" type="email" value={u.email ?? ''} onChange={e => mudar({ email: e.target.value })} /><Selecao rotulo="Perfil" value={u.perfil} onChange={e => mudar({ perfil: e.target.value as Usuario['perfil'] })}><option value="atendimento">Atendimento</option><option value="administrativo">Administrativo</option></Selecao><Selecao rotulo="Loja do usuário" value={u.lojaId} onChange={e => mudar({ lojaId: e.target.value })}>{dados.lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}</Selecao><Opcao checked={u.ativo !== false} onChange={e => mudar({ ativo: e.target.checked })}>Usuário ativo</Opcao><div className="linha"><Botao variante="secundario" onClick={aoCancelar}>Cancelar</Botao><Botao type="submit">Salvar usuário</Botao></div></form>;
}

function AbaFormas() {
  const { estado, atualizar } = usePrototipo(), d = estado.dados, notificar = useNotificacao(), [editando, setEditando] = useState<FormaPagamento>(), [erro, setErro] = useState('');
  return <div className="pilha"><p className="suave">A taxa padrão aparece como sugestão na taxa de cartão da encomenda e do PDV, que continua editável. A conciliação usa o prazo e a taxa daqui.</p><Tabela legenda="Formas de pagamento" colunas={[{ chave: 'nome', titulo: 'Forma' }, { chave: 'taxa', titulo: 'Taxa padrão' }, { chave: 'prazo', titulo: 'Prazo de recebimento' }, { chave: 'gaveta', titulo: 'Entra na gaveta' }, { chave: 'situacao', titulo: 'Situação' }, { chave: 'acoes', titulo: 'Ações' }]} linhas={d.formasPagamento.map(f => ({ id: f.id, celulas: { nome: f.nome, taxa: pct(f.taxaPercentual), prazo: f.prazoRecebimentoDias ? `D+${f.prazoRecebimentoDias}` : 'No dia', gaveta: f.id === 'dinheiro' ? 'Sim' : 'Não', situacao: situacao(f.ativa !== false), acoes: <Botao variante="secundario" aria-label={`Editar ${f.nome}`} onClick={() => { setErro(''); setEditando({ ...f }); }}>Editar</Botao> } }))} />
    <Dialogo aberto={!!editando} aoFechar={() => setEditando(undefined)} titulo={`Editar ${editando?.nome ?? 'forma'}`}>{editando && <form className="pilha" onSubmit={e => { e.preventDefault(); try { atualizar(salvarFormaPagamento(d, editando)); setEditando(undefined); notificar(`${editando.nome}: ${pct(editando.taxaPercentual)} e ${editando.prazoRecebimentoDias ? `D+${editando.prazoRecebimentoDias}` : 'recebimento no dia'}.`); } catch (x) { setErro((x as Error).message); } }}>{erro && <Aviso tom="erro">{erro}</Aviso>}<CampoTexto rotulo="Nome da forma" required value={editando.nome} onChange={e => setEditando({ ...editando, nome: e.target.value })} /><CampoTexto rotulo="Taxa padrão (%)" type="number" min={0} max={100} step="0.01" inputMode="decimal" value={editando.taxaPercentual ?? 0} onChange={e => setEditando({ ...editando, taxaPercentual: Number(e.target.value.replace(',', '.')) || 0 })} /><CampoTexto rotulo="Prazo de recebimento (dias)" type="number" min={0} step={1} value={editando.prazoRecebimentoDias ?? 0} onChange={e => setEditando({ ...editando, prazoRecebimentoDias: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} /><Opcao checked={editando.ativa !== false} disabled={editando.id === 'dinheiro'} onChange={e => setEditando({ ...editando, ativa: e.target.checked })}>Forma ativa{editando.id === 'dinheiro' ? ' (dinheiro sempre ativo, entra na gaveta)' : ''}</Opcao><div className="linha"><Botao variante="secundario" onClick={() => setEditando(undefined)}>Cancelar</Botao><Botao type="submit">Salvar forma</Botao></div></form>}</Dialogo></div>;
}

function AbaCaixa() {
  const { estado, atualizar } = usePrototipo(), d = estado.dados, notificar = useNotificacao(), c = d.configuracao;
  const [trocos, setTrocos] = useState<Record<string, number>>(() => Object.fromEntries(d.lojas.map(l => [l.id, c.trocoPadraoPorLoja?.[l.id] ?? c.trocoPadraoCentavos]))), [exigir, setExigir] = useState(c.exigirObservacaoDiferenca !== false);
  return <form className="pilha" onSubmit={e => { e.preventDefault(); atualizar(salvarConfiguracaoCaixa(d, trocos, exigir)); notificar('Configurações do caixa salvas.'); }}><Cartao className="pilha"><h2>Troco inicial padrão</h2><div className="grade">{d.lojas.map(l => <CampoValor key={l.id} rotulo={`Troco padrão da ${l.nome}`} valorCentavos={trocos[l.id] ?? 0} onChange={v => setTrocos({ ...trocos, [l.id]: v })} ajuda="Sugerido ao abrir o caixa; pode ser alterado na abertura." />)}</div></Cartao><Cartao className="pilha"><h2>Fechamento</h2><Opcao checked={exigir} onChange={e => setExigir(e.target.checked)}>Exigir observação quando houver diferença no fechamento</Opcao><Aviso>Reabrir um caixa fechado é permitido somente ao Administrativo, com motivo. Regra informativa, sempre ativa.</Aviso></Cartao><div className="linha"><Botao type="submit">Salvar caixa</Botao></div></form>;
}

function AbaEncomendas() {
  const { estado, atualizar } = usePrototipo(), d = estado.dados, notificar = useNotificacao(), c = d.configuracao;
  const [antecedencia, setAntecedencia] = useState(String(c.antecedenciaMinimaDias ?? 2)), [abertura, setAbertura] = useState(c.horarioAbertura ?? '08:00'), [fechamento, setFechamento] = useState(c.horarioFechamento ?? '18:00'), [margem, setMargem] = useState(String(d.montagemBolo.limiteMargemPercentual)), [erro, setErro] = useState('');
  return <form className="pilha" onSubmit={e => { e.preventDefault(); try { atualizar(salvarConfiguracaoEncomendas(d, { antecedenciaMinimaDias: Number(antecedencia), horarioAbertura: abertura, horarioFechamento: fechamento, limiteMargemPercentual: Number(margem) })); setErro(''); notificar('Configurações de encomendas salvas.'); } catch (x) { setErro((x as Error).message); } }}>{erro && <Aviso tom="erro">{erro}</Aviso>}<div className="grade"><CampoTexto rotulo="Antecedência mínima sugerida (dias)" type="number" min={0} step={1} value={antecedencia} onChange={e => setAntecedencia(e.target.value)} ajuda="Aviso, não bloqueio, ao criar encomenda muito em cima." /><CampoTexto rotulo="Abre às" type="time" value={abertura} onChange={e => setAbertura(e.target.value)} /><CampoTexto rotulo="Fecha às" type="time" value={fechamento} onChange={e => setFechamento(e.target.value)} ajuda="Usado para sugerir horários de retirada." /><CampoTexto rotulo="Limite de margem baixa (%)" type="number" min={0} max={100} value={margem} onChange={e => setMargem(e.target.value)} ajuda="Destaca margens abaixo deste valor na ficha técnica e no custo da encomenda." /></div><div className="linha"><Botao type="submit">Salvar encomendas</Botao></div></form>;
}

function AbaMarca() {
  const { estado } = usePrototipo(), c = estado.dados.configuracao;
  return <Cartao className="pilha"><Image src={c.logo} alt="Ateliê Delícias da Rose" width={120} height={120} /><p><strong>Nome do sistema:</strong> {c.nomeSistema}</p><p><strong>Marca:</strong> {c.nomeMarca}</p><p><strong>Slogan:</strong> {c.slogan}</p><p className="pequeno suave">{c.observacaoMarca}</p><Aviso>Para trocar o logo, envie o arquivo original ao responsável pelo sistema.</Aviso></Cartao>;
}

function AbaDados() {
  const { restaurar } = usePrototipo(), notificar = useNotificacao(), [confirmar, setConfirmar] = useState(false);
  return <div className="pilha"><Aviso titulo="Tudo aqui é fictício">Clientes, telefones, endereços, fornecedores, documentos, preços, custos e o histórico de 90 dias são dados de teste, gerados para a demonstração. Nada é enviado a servidor: as alterações ficam só neste navegador.</Aviso><div className="linha"><Botao variante="perigo" icone="restaurar" onClick={() => setConfirmar(true)}>Restaurar dados de teste</Botao></div><p className="pequeno suave">Volta tudo ao estado inicial, mantendo o perfil e a loja selecionados. Mesmo efeito do botão da faixa superior.</p>
    <Dialogo aberto={confirmar} aoFechar={() => setConfirmar(false)} titulo="Restaurar dados de teste?"><p>As alterações feitas neste navegador serão substituídas pelos dados fictícios iniciais.</p><div className="linha"><Botao variante="secundario" onClick={() => setConfirmar(false)}>Cancelar</Botao><Botao onClick={() => { restaurar(); setConfirmar(false); notificar('Dados de teste restaurados.'); }}>Restaurar dados</Botao></div></Dialogo></div>;
}
