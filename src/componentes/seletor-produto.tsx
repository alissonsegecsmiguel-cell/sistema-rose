'use client';
import { useState } from 'react';
import type { ItemEncomenda } from '@/lib/tipos';
import { ajudaObservacaoProduto, listarCategoriasProduto, listarProdutos, nomeUnidade, novoId } from '@/lib/dados';
import { usePrototipo } from '@/lib/prototipo-store';
import { formatarMoeda } from '@/lib/formatar';
import { Abas } from './abas';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { CampoTextoLongo } from './campo-texto-longo';
import { SeletorQuantidade } from './seletor-quantidade';
import { Aviso } from './aviso';
export function SeletorProduto({ lojaId, item, aoSalvar }: { lojaId: string; item?: Extract<ItemEncomenda, { tipo: 'produto' }>; aoSalvar: (i: ItemEncomenda) => void }) {
  const { estado } = usePrototipo(), dados = estado.dados, [busca, setBusca] = useState(''), [produtoId, setProduto] = useState(item?.produtoId || ''), [quantidade, setQuantidade] = useState(item?.quantidade || 1), [observacao, setObservacao] = useState(item?.observacao || ''), [erro, setErro] = useState('');
  const produto = dados.produtos.find(p => p.id === produtoId), ajuda = ajudaObservacaoProduto(dados, produto), produtos = listarProdutos(dados, lojaId, 'encomenda');
  return <div className="pilha"><CampoTexto rotulo="Buscar produto" value={busca} onChange={e => setBusca(e.target.value)} /><Abas rotulo="Categorias de produtos" itens={listarCategoriasProduto(dados).filter(c => produtos.some(p => p.categoriaId === c.id)).map(c => ({ id: c.id, titulo: c.nome, conteudo: <div className="linha">{produtos.filter(p => p.categoriaId === c.id && p.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).map(p => <Botao key={p.id} variante={p.id === produtoId ? 'primario' : 'secundario'} aria-pressed={p.id === produtoId} onClick={() => setProduto(p.id)}>{p.nome} • {formatarMoeda(p.valorCentavos)}{p.unidadeVenda !== 'unidade' ? ` por ${nomeUnidade(p.unidadeVenda).toLocaleLowerCase('pt-BR')}` : ''}</Botao>)}</div> }))} /><p>{produto ? `Selecionado: ${produto.nome}` : 'Selecione um produto.'}</p><SeletorQuantidade rotulo={produto && produto.unidadeVenda !== 'unidade' ? `Quantidade (${nomeUnidade(produto.unidadeVenda).toLocaleLowerCase('pt-BR')})` : undefined} valor={quantidade} aoMudar={setQuantidade} />{(produto ? produto.pedeObservacao : !!observacao) && <CampoTextoLongo rotulo="Observação do produto" ajuda={ajuda || undefined} value={observacao} onChange={e => setObservacao(e.target.value)} />}{erro && <Aviso tom="erro">{erro}</Aviso>}<Botao onClick={() => { if (!produto) return setErro('Selecione um produto.'); aoSalvar({ id: item?.id || novoId(), tipo: 'produto', produtoId, quantidade, observacao: produto.pedeObservacao ? observacao : '', valorUnitarioCentavos: produto.valorCentavos, unidadeVenda: produto.unidadeVenda }); }}>Adicionar produto à encomenda</Botao></div>;
}
