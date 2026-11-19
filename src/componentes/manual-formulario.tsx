'use client';
import { useState } from 'react';
import { usePrototipo } from '@/lib/prototipo-store';
import { useNotificacao } from './notificacao';
import { Botao } from './botao';
import { Dialogo } from './dialogo';
import { FormularioCliente } from './formulario-cliente';
import { MontadorBolo } from './montador-bolo';
import { SeletorProduto } from './seletor-produto';
import { SeletorQuantidade } from './seletor-quantidade';
import { CampoTextoLongo } from './campo-texto-longo';
import { ResumoEncomenda } from './resumo-encomenda';
import { LinkExterno } from './link-externo';
import { enderecoWhatsapp } from '@/lib/dados';
export function ManualFormulario() {
  const { estado } = usePrototipo(), [dialogo, setDialogo] = useState(''), [quantidade, setQuantidade] = useState(1), notificar = useNotificacao();
  if (!estado.pronto) return null;
  const e = estado.dados.encomendas[0], fechar = () => { setDialogo(''); notificar('Exemplo concluído. Nenhum dado foi gravado.'); };
  const contato = <LinkExterno href={enderecoWhatsapp(estado.dados.clientes[0])}>WhatsApp de teste</LinkExterno>;
  return <section className="manual-secao pilha" id="formulario-manual"><h2>Formulários de encomenda e cliente</h2><p className="suave">CampoTexto com type date e time usa o controle nativo. CampoTextoLongo mantém rótulo e erro associados. Quantidade aceita inteiros positivos. Diálogo grande tem largura de 800px e ocupa a tela no celular, com foco preso e Esc. Montador e seleção de produto usam o catálogo, sem preços no componente.</p>{contato}<div className="grade"><CampoTextoLongo rotulo="Observação de exemplo" ajuda="Ajuda associada ao campo." /><CampoTextoLongo rotulo="Observação com erro" erro="Preencha a observação." /><SeletorQuantidade valor={quantidade} aoMudar={setQuantidade} /></div><div className="linha">{[['cliente', 'Cadastro rápido de cliente'], ['bolo', 'Montagem de bolo'], ['produto', 'Seleção de produto'], ['resumo', 'Resumo da encomenda']].map(([id, n]) => <Botao key={id} variante="secundario" onClick={() => setDialogo(id)}>{n}</Botao>)}</div><p className="suave">Resumo em coluna fixa no computador e em diálogo pelo botão Revisar e salvar no celular. Percentuais são guardados em centésimos de ponto percentual; resultados monetários arredondados em centavos.</p><Dialogo aberto={!!dialogo} aoFechar={() => setDialogo('')} titulo="Exemplo de formulário" grande>{dialogo === 'cliente' && <FormularioCliente lojaId={e.lojaId} aoSalvar={fechar} aoUsarExistente={fechar} />}{dialogo === 'bolo' && <MontadorBolo aoSalvar={fechar} />}{dialogo === 'produto' && <SeletorProduto lojaId={e.lojaId} aoSalvar={fechar} />}{dialogo === 'resumo' && <ResumoEncomenda dados={estado.dados} rascunho={{ id: 'manual', usuarioId: e.criadoPor, encomenda: e, desconto: { tipo: 'valor', valor: e.descontoCentavos }, taxa: { tipo: 'valor', valor: e.taxaCartaoCentavos } }} aoSalvar={fechar} />}</Dialogo></section>;
}
