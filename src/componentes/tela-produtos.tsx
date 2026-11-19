'use client';
import { useState } from 'react';
import type { CategoriaProduto, DadosPrototipo, GrupoBolo, ItemEncomenda, OpcaoBolo, Produto } from '@/lib/tipos';
import { usePrototipo } from '@/lib/prototipo-store';
import { GRUPOS_BOLO, UNIDADES_VENDA, calcularValorBolo, contarProdutosCategoria, excluirCategoriaProduto, filtrarCatalogo, listarCategoriasProduto, moverCategoriaProduto, novaCategoriaProduto, novaOpcaoBolo, novoItemBolo, novoProduto, nomeUnidade, salvarCategoriaProduto, salvarLimiteRecheios, salvarOpcaoBolo, salvarProduto } from '@/lib/dados';
import { formatarMoeda } from '@/lib/formatar';
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
import { EstadoVazio } from './estado-vazio';
import { PilulasBolo } from './pilulas-bolo';
import { useNotificacao } from './notificacao';

const simNao = (v: boolean) => v ? 'Sim' : 'Não';
const situacao = (ativo: boolean) => <span className={`selo ${ativo ? 'tom-sucesso' : 'tom-neutro'}`}>{ativo ? 'Ativo' : 'Inativo'}</span>;

export function TelaProdutos() {
  const { estado } = usePrototipo(), [aba, setAba] = useState('produtos'); if (!estado.pronto) return null;
  return <div className="pilha"><CabecalhoPagina titulo="Produtos" subtitulo="Catálogo único para Matriz e Filial, com preços de teste." /><Abas rotulo="Seções de produtos" ativa={aba} aoMudar={setAba} itens={[{ id: 'produtos', titulo: 'Produtos', conteudo: <AbaProdutos /> }, { id: 'categorias', titulo: 'Categorias', conteudo: <AbaCategorias /> }, { id: 'montagem', titulo: 'Montagem do bolo', conteudo: <AbaMontagem /> }]} /></div>;
}

function AbaProdutos() {
  const { estado, atualizar } = usePrototipo(), notificar = useNotificacao(), dados = estado.dados;
  const [busca, setBusca] = useState(''), [categoria, setCategoria] = useState(''), [situacaoFiltro, setSituacao] = useState('ativo'), [editando, setEditando] = useState<Produto>();
  const lista = filtrarCatalogo(dados, busca, categoria, situacaoFiltro), categorias = listarCategoriasProduto(dados);
  const nomeCategoria = (id: string) => categorias.find(c => c.id === id)?.nome ?? 'Sem categoria', lojas = (p: Produto) => p.lojasDisponiveis.length === dados.lojas.length ? 'Matriz e Filial' : p.lojasDisponiveis.map(id => dados.lojas.find(l => l.id === id)?.nome).join(', ');
  const alternar = (p: Produto) => { atualizar(salvarProduto(dados, { ...p, ativo: !p.ativo })); notificar(p.ativo ? `${p.nome} inativado. Encomendas antigas continuam com o nome.` : `${p.nome} ativado.`); };
  return <div className="pilha"><div className="linha"><Botao icone="mais" onClick={() => setEditando(novoProduto(dados))}>Novo produto</Botao></div>
    <div className="grade"><CampoTexto rotulo="Buscar produto" value={busca} onChange={e => setBusca(e.target.value)} /><Selecao rotulo="Categoria" value={categoria} onChange={e => setCategoria(e.target.value)}><option value="">Todas</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Selecao><Selecao rotulo="Situação" value={situacaoFiltro} onChange={e => setSituacao(e.target.value)}><option value="ativo">Ativos</option><option value="inativo">Inativos</option><option value="todos">Todos</option></Selecao></div>
    {lista.length ? <Tabela legenda="Produtos do catálogo" colunas={[{ chave: 'nome', titulo: 'Nome' }, { chave: 'categoria', titulo: 'Categoria' }, { chave: 'preco', titulo: 'Preço de teste' }, { chave: 'unidade', titulo: 'Unidade de venda' }, { chave: 'balcao', titulo: 'Vende no balcão' }, { chave: 'encomenda', titulo: 'Aceita em encomenda' }, { chave: 'lojas', titulo: 'Disponível em' }, { chave: 'situacao', titulo: 'Situação' }, { chave: 'acoes', titulo: 'Ações' }]} linhas={lista.map(p => ({ id: p.id, celulas: { nome: p.nome, categoria: nomeCategoria(p.categoriaId), preco: <span className="numerico">{formatarMoeda(p.valorCentavos)}</span>, unidade: nomeUnidade(p.unidadeVenda), balcao: simNao(p.vendeBalcao), encomenda: simNao(p.aceitaEncomenda), lojas: lojas(p), situacao: situacao(p.ativo), acoes: <div className="linha"><Botao variante="secundario" aria-label={`Editar ${p.nome}`} onClick={() => setEditando(structuredClone(p))}>Editar</Botao><Botao variante="fantasma" aria-label={`${p.ativo ? 'Inativar' : 'Ativar'} ${p.nome}`} onClick={() => alternar(p)}>{p.ativo ? 'Inativar' : 'Ativar'}</Botao></div> } }))} /> : <EstadoVazio titulo="Nenhum produto encontrado" texto="Tente outra busca, categoria ou situação." />}
    <Dialogo aberto={!!editando} aoFechar={() => setEditando(undefined)} titulo={editando && dados.produtos.some(p => p.id === editando.id) ? 'Editar produto' : 'Novo produto'} grande>{editando && <FormularioProduto key={editando.id} dados={dados} inicial={editando} aoCancelar={() => setEditando(undefined)} aoSalvar={p => { atualizar(salvarProduto(dados, p)); setEditando(undefined); notificar(`${p.nome} salvo no catálogo.`); }} />}</Dialogo></div>;
}

/** Formulário do produto. Valida pela camada de dados antes de salvar. */
export function FormularioProduto({ dados, inicial, aoSalvar, aoCancelar }: { dados: DadosPrototipo; inicial: Produto; aoSalvar: (p: Produto) => void; aoCancelar: () => void }) {
  const [p, setP] = useState(inicial), [erro, setErro] = useState(''), mudar = (parcial: Partial<Produto>) => setP({ ...p, ...parcial });
  const ajudaCategoria = dados.categoriasProduto.find(c => c.id === p.categoriaId)?.ajuda;
  return <form className="pilha" onSubmit={e => { e.preventDefault(); try { salvarProduto(dados, p); aoSalvar({ ...p, nome: p.nome.trim(), ajudaObservacao: p.pedeObservacao ? p.ajudaObservacao?.trim() : '' }); } catch (x) { setErro((x as Error).message); } }}>
    {erro && <Aviso tom="erro" titulo="Confira o produto">{erro}</Aviso>}
    <div className="grade"><CampoTexto rotulo="Nome do produto" required value={p.nome} onChange={e => mudar({ nome: e.target.value })} /><Selecao rotulo="Categoria" value={p.categoriaId} onChange={e => mudar({ categoriaId: e.target.value })}>{listarCategoriasProduto(dados).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Selecao><CampoValor rotulo="Preço de teste" valorCentavos={p.valorCentavos} onChange={v => mudar({ valorCentavos: v })} ajuda="Igual nas duas lojas." /><Selecao rotulo="Unidade de venda" value={p.unidadeVenda} onChange={e => mudar({ unidadeVenda: e.target.value as Produto['unidadeVenda'] })}>{UNIDADES_VENDA.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</Selecao></div>
    <fieldset><legend>Onde é vendido</legend><div className="linha"><Opcao checked={p.vendeBalcao} onChange={e => mudar({ vendeBalcao: e.target.checked })}>Vende no balcão (pronta-entrega)</Opcao><Opcao checked={p.aceitaEncomenda} onChange={e => mudar({ aceitaEncomenda: e.target.checked })}>Aceita em encomenda</Opcao></div></fieldset>
    <fieldset><legend>Disponível em</legend><div className="linha">{dados.lojas.map(l => <Opcao key={l.id} checked={p.lojasDisponiveis.includes(l.id)} onChange={e => mudar({ lojasDisponiveis: e.target.checked ? [...p.lojasDisponiveis, l.id] : p.lojasDisponiveis.filter(id => id !== l.id) })}>{l.nome}</Opcao>)}</div></fieldset>
    <Opcao checked={p.pedeObservacao} onChange={e => mudar({ pedeObservacao: e.target.checked })}>Pede observação na encomenda</Opcao>
    {p.pedeObservacao && <CampoTexto rotulo="Texto de ajuda da observação" value={p.ajudaObservacao ?? ''} onChange={e => mudar({ ajudaObservacao: e.target.value })} ajuda={ajudaCategoria ? `Em branco, usa o texto da categoria: ${ajudaCategoria}` : 'Exemplo: Sabores e cor das forminhas'} />}
    <Opcao checked={p.ativo} onChange={e => mudar({ ativo: e.target.checked })}>Produto ativo</Opcao>
    <div className="linha"><Botao variante="secundario" onClick={aoCancelar}>Cancelar</Botao><Botao type="submit">Salvar produto</Botao></div></form>;
}

function AbaCategorias() {
  const { estado, atualizar } = usePrototipo(), notificar = useNotificacao(), dados = estado.dados, categorias = listarCategoriasProduto(dados);
  const [editando, setEditando] = useState<CategoriaProduto>(), [excluir, setExcluir] = useState<CategoriaProduto>(), [erro, setErro] = useState('');
  const mover = (c: CategoriaProduto, direcao: number) => { atualizar(moverCategoriaProduto(dados, c.id, direcao)); notificar(`${c.nome} ${direcao < 0 ? 'subiu' : 'desceu'} na ordem.`); };
  return <div className="pilha"><div className="linha"><Botao icone="mais" onClick={() => { setErro(''); setEditando(novaCategoriaProduto(dados)); }}>Nova categoria</Botao></div>{erro && <Aviso tom="erro" titulo="Não foi possível excluir">{erro}</Aviso>}
    <Tabela legenda="Categorias de produto em ordem de exibição" colunas={[{ chave: 'ordem', titulo: 'Ordem' }, { chave: 'nome', titulo: 'Nome' }, { chave: 'ajuda', titulo: 'Ajuda padrão da observação' }, { chave: 'quantidade', titulo: 'Produtos' }, { chave: 'acoes', titulo: 'Ações' }]} linhas={categorias.map((c, i) => ({ id: c.id, celulas: { ordem: <div className="linha"><span className="numerico">{i + 1}</span><Botao variante="fantasma" icone="subir" aria-label={`Subir ${c.nome}`} disabled={i === 0} onClick={() => mover(c, -1)}><span className="sr-only">Subir</span></Botao><Botao variante="fantasma" icone="descer" aria-label={`Descer ${c.nome}`} disabled={i === categorias.length - 1} onClick={() => mover(c, 1)}><span className="sr-only">Descer</span></Botao></div>, nome: c.nome, ajuda: c.ajuda || <span className="suave">Sem texto de ajuda</span>, quantidade: contarProdutosCategoria(dados, c.id), acoes: <div className="linha"><Botao variante="secundario" aria-label={`Renomear ${c.nome}`} onClick={() => { setErro(''); setEditando({ ...c }); }}>Renomear</Botao><Botao variante="fantasma" aria-label={`Excluir ${c.nome}`} onClick={() => { if (contarProdutosCategoria(dados, c.id)) return setErro(`${c.nome} tem produtos. Mova ou inative os produtos antes de excluir; produtos inativos também contam.`); setErro(''); setExcluir(c); }}>Excluir</Botao></div> } }))} />
    <Dialogo aberto={!!editando} aoFechar={() => setEditando(undefined)} titulo={editando && dados.categoriasProduto.some(c => c.id === editando.id) ? 'Renomear categoria' : 'Nova categoria'}>{editando && <FormularioCategoria key={editando.id} inicial={editando} aoCancelar={() => setEditando(undefined)} aoSalvar={c => { const novo = salvarCategoriaProduto(dados, c); atualizar(novo); setEditando(undefined); notificar(`Categoria ${c.nome} salva.`); }} />}</Dialogo>
    <Dialogo aberto={!!excluir} aoFechar={() => setExcluir(undefined)} titulo="Excluir categoria?"><p>A categoria {excluir?.nome} não tem produtos e será removida.</p><div className="linha"><Botao variante="secundario" onClick={() => setExcluir(undefined)}>Cancelar</Botao><Botao variante="perigo" onClick={() => { atualizar(excluirCategoriaProduto(dados, excluir!.id)); notificar(`Categoria ${excluir!.nome} excluída.`); setExcluir(undefined); }}>Excluir categoria</Botao></div></Dialogo></div>;
}

function FormularioCategoria({ inicial, aoSalvar, aoCancelar }: { inicial: CategoriaProduto; aoSalvar: (c: CategoriaProduto) => void; aoCancelar: () => void }) {
  const [c, setC] = useState(inicial), [erro, setErro] = useState('');
  return <form className="pilha" onSubmit={e => { e.preventDefault(); try { aoSalvar({ ...c, nome: c.nome.trim(), ajuda: c.ajuda?.trim() }); } catch (x) { setErro((x as Error).message); } }}>{erro && <Aviso tom="erro">{erro}</Aviso>}<CampoTexto rotulo="Nome da categoria" required value={c.nome} onChange={e => setC({ ...c, nome: e.target.value })} /><CampoTexto rotulo="Texto de ajuda padrão da observação" value={c.ajuda ?? ''} onChange={e => setC({ ...c, ajuda: e.target.value })} ajuda="Aparece na nova encomenda quando o produto não tem texto próprio." /><div className="linha"><Botao variante="secundario" onClick={aoCancelar}>Cancelar</Botao><Botao type="submit">Salvar categoria</Botao></div></form>;
}

function AbaMontagem() {
  const { estado, atualizar } = usePrototipo(), notificar = useNotificacao(), dados = estado.dados;
  const [editando, setEditando] = useState<{ grupo: GrupoBolo; opcao: OpcaoBolo }>(), [limite, setLimite] = useState(String(dados.configuracao.limiteRecheios)), [erroLimite, setErroLimite] = useState('');
  const alternar = (grupo: GrupoBolo, o: OpcaoBolo) => { atualizar(salvarOpcaoBolo(dados, grupo, { ...o, ativo: !o.ativo })); notificar(o.ativo ? `${o.nome} inativado. Pedidos antigos continuam com o nome.` : `${o.nome} ativado.`); };
  return <div className="pilha">
    <Cartao className="pilha"><h2>Regras gerais</h2><form className="linha" onSubmit={e => { e.preventDefault(); try { atualizar(salvarLimiteRecheios(dados, Number(limite))); setErroLimite(''); notificar('Limite de recheios atualizado.'); } catch (x) { setErroLimite((x as Error).message); } }}><CampoTexto rotulo="Máximo de recheios por bolo" type="number" min={1} step={1} value={limite} onChange={e => setLimite(e.target.value)} erro={erroLimite} ajuda="Hoje 2, a confirmar com o cliente." /><Botao type="submit" variante="secundario">Salvar limite</Botao></form></Cartao>
    <PreviaMontagem dados={dados} />
    {GRUPOS_BOLO.map(g => { const lista = [...dados.opcoesBolo[g.id]].sort((a, b) => a.ordem - b.ordem); return <Cartao key={g.id} className="pilha"><div className="linha"><h2>{g.titulo}</h2><Botao variante="secundario" icone="mais" onClick={() => setEditando({ grupo: g.id, opcao: novaOpcaoBolo(dados, g.id) })}>Nova opção em {g.titulo}</Botao></div>
      <Tabela legenda={`Opções de ${g.titulo.toLocaleLowerCase('pt-BR')}`} colunas={[{ chave: 'ordem', titulo: 'Ordem' }, { chave: 'nome', titulo: 'Nome' }, { chave: 'valor', titulo: g.id === 'tamanhos' ? 'Preço base de teste' : 'Preço adicional de teste' }, ...(g.id === 'tamanhos' ? [{ chave: 'porcao', titulo: 'Rendimento' }] : []), { chave: 'situacao', titulo: 'Situação' }, { chave: 'acoes', titulo: 'Ações' }]} linhas={lista.map(o => ({ id: o.id, celulas: { ordem: <span className="numerico">{o.ordem}</span>, nome: <div className="pilha-curta"><span>{o.nome}</span>{o.aConfirmar && <span className="selo tom-alerta">A confirmar com o cliente</span>}</div>, valor: <span className="numerico">{formatarMoeda(o.valorCentavos)}</span>, porcao: [o.servePessoas && `Serve ${o.servePessoas}`, o.pesoAproximado].filter(Boolean).join(', ') || <span className="suave">Não informado</span>, situacao: situacao(o.ativo), acoes: <div className="linha"><Botao variante="secundario" aria-label={`Editar ${o.nome}`} onClick={() => setEditando({ grupo: g.id, opcao: { ...o } })}>Editar</Botao><Botao variante="fantasma" aria-label={`${o.ativo ? 'Inativar' : 'Ativar'} ${o.nome}`} onClick={() => alternar(g.id, o)}>{o.ativo ? 'Inativar' : 'Ativar'}</Botao></div> } }))} /></Cartao>; })}
    <Dialogo aberto={!!editando} aoFechar={() => setEditando(undefined)} titulo={editando && dados.opcoesBolo[editando.grupo].some(o => o.id === editando.opcao.id) ? 'Editar opção do bolo' : `Nova opção em ${GRUPOS_BOLO.find(g => g.id === editando?.grupo)?.titulo ?? ''}`}>{editando && <FormularioOpcaoBolo key={editando.opcao.id} grupo={editando.grupo} inicial={editando.opcao} aoCancelar={() => setEditando(undefined)} aoSalvar={o => { atualizar(salvarOpcaoBolo(dados, editando.grupo, o)); setEditando(undefined); notificar(`${o.nome} salvo na montagem do bolo.`); }} />}</Dialogo></div>;
}

/** Formulário de uma opção da montagem do bolo. */
export function FormularioOpcaoBolo({ grupo, inicial, aoSalvar, aoCancelar }: { grupo: GrupoBolo; inicial: OpcaoBolo; aoSalvar: (o: OpcaoBolo) => void; aoCancelar: () => void }) {
  const [o, setO] = useState(inicial), [erro, setErro] = useState(''), tamanho = grupo === 'tamanhos', mudar = (p: Partial<OpcaoBolo>) => setO({ ...o, ...p });
  return <form className="pilha" onSubmit={e => { e.preventDefault(); if (!o.nome.trim()) return setErro('Informe o nome da opção.'); if (!Number.isSafeInteger(o.ordem) || o.ordem < 1) return setErro('A ordem deve ser um número inteiro a partir de 1.'); aoSalvar({ ...o, nome: o.nome.trim(), pesoAproximado: o.pesoAproximado?.trim() || undefined }); }}>{erro && <Aviso tom="erro">{erro}</Aviso>}
    <CampoTexto rotulo="Nome da opção" required value={o.nome} onChange={e => mudar({ nome: e.target.value })} /><CampoValor rotulo={tamanho ? 'Preço base do bolo' : 'Preço adicional'} valorCentavos={o.valorCentavos} onChange={v => mudar({ valorCentavos: v })} ajuda="Valor de teste. Pedidos já salvos mantêm o valor antigo." /><CampoTexto rotulo="Ordem de exibição" type="number" min={1} step={1} value={o.ordem} onChange={e => mudar({ ordem: Math.floor(Number(e.target.value) || 0) })} />
    {tamanho && <div className="grade"><CampoTexto rotulo="Serve aproximadamente (pessoas)" type="number" min={1} step={1} value={o.servePessoas ?? ''} onChange={e => mudar({ servePessoas: Number(e.target.value) > 0 ? Math.floor(Number(e.target.value)) : undefined })} ajuda="Opcional, a confirmar com o cliente." /><CampoTexto rotulo="Peso aproximado" value={o.pesoAproximado ?? ''} onChange={e => mudar({ pesoAproximado: e.target.value })} ajuda="Opcional. Exemplo: 1,5 kg" /></div>}
    <Opcao checked={o.ativo} onChange={e => mudar({ ativo: e.target.checked })}>Opção ativa</Opcao><Opcao checked={!!o.aConfirmar} onChange={e => mudar({ aConfirmar: e.target.checked })}>A confirmar com o cliente</Opcao>
    <div className="linha"><Botao variante="secundario" onClick={aoCancelar}>Cancelar</Botao><Botao type="submit">Salvar opção</Botao></div></form>;
}

/** Mostra a montagem como a atendente verá na nova encomenda. */
export function PreviaMontagem({ dados }: { dados: DadosPrototipo }) {
  const [bolo, setBolo] = useState<Extract<ItemEncomenda, { tipo: 'bolo' }>>(() => novoItemBolo());
  return <Cartao className="pilha previa-bolo"><h2>Pré-visualização na nova encomenda</h2><p className="pequeno suave">Escolhas de exemplo; nada é salvo.</p><PilulasBolo dados={dados} bolo={bolo} aoMudar={setBolo} prefixo="previa" /><strong>Preço calculado: {formatarMoeda(calcularValorBolo(dados, bolo))}</strong><Botao variante="fantasma" onClick={() => setBolo(novoItemBolo())}>Limpar exemplo</Botao></Cartao>;
}
