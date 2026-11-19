'use client';
import { useState } from 'react';
import { usePrototipo } from '@/lib/prototipo-store';
import { novaOpcaoBolo, novoProduto } from '@/lib/dados';
import { Botao } from './botao';
import { Dialogo } from './dialogo';
import { FormularioOpcaoBolo, FormularioProduto, PreviaMontagem } from './tela-produtos';
import { useNotificacao } from './notificacao';
export function ManualProdutos() {
  const { estado } = usePrototipo(), notificar = useNotificacao(), [aberto, setAberto] = useState(''); if (!estado.pronto) return null; const dados = estado.dados;
  return <section className="manual-secao pilha" id="produtos-manual"><h2>Catálogo, categorias e montagem do bolo</h2><p className="suave">Catálogo único com preço igual nas lojas e campo Disponível em. Produtos e opções são inativados, nunca excluídos. Categorias mudam de ordem por botões de subir e descer com rótulo acessível. Opções marcadas a confirmar mostram selo de alerta em texto. A pré-visualização reutiliza as mesmas pílulas da nova encomenda e aparece logo abaixo das regras gerais, antes dos grupos.</p><div className="linha"><Botao variante="secundario" onClick={() => setAberto('produto')}>Abrir formulário de produto</Botao><Botao variante="secundario" onClick={() => setAberto('opcao')}>Abrir formulário de opção do bolo</Botao></div><PreviaMontagem dados={dados} /><Dialogo aberto={aberto === 'produto'} aoFechar={() => setAberto('')} titulo="Exemplo de produto" grande>{aberto === 'produto' && <FormularioProduto dados={dados} inicial={novoProduto(dados)} aoCancelar={() => setAberto('')} aoSalvar={() => { setAberto(''); notificar('Exemplo: produto validado, nada foi salvo.'); }} />}</Dialogo><Dialogo aberto={aberto === 'opcao'} aoFechar={() => setAberto('')} titulo="Exemplo de opção do bolo">{aberto === 'opcao' && <FormularioOpcaoBolo grupo="tamanhos" inicial={novaOpcaoBolo(dados, 'tamanhos')} aoCancelar={() => setAberto('')} aoSalvar={() => { setAberto(''); notificar('Exemplo: opção validada, nada foi salva.'); }} />}</Dialogo></section>;
}
