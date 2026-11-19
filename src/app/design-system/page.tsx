'use client';
import { useState, type ReactNode } from 'react';
import { Botao, type VarianteBotao } from '@/componentes/botao';
import { LinkBotao } from '@/componentes/link-botao';
import { CampoTexto } from '@/componentes/campo-texto';
import { CampoValor } from '@/componentes/campo-valor';
import { Selecao } from '@/componentes/selecao';
import { Opcao } from '@/componentes/opcao';
import { Cartao } from '@/componentes/cartao';
import { SeloStatus } from '@/componentes/selo-status';
import { Tabela } from '@/componentes/tabela';
import { Abas } from '@/componentes/abas';
import { Dialogo } from '@/componentes/dialogo';
import { Aviso } from '@/componentes/aviso';
import { useNotificacao } from '@/componentes/notificacao';
import { EstadoVazio } from '@/componentes/estado-vazio';
import { CabecalhoPagina } from '@/componentes/cabecalho-pagina';
import { Indicador } from '@/componentes/indicador';
import { MenuLateral } from '@/componentes/menu-lateral';
import { BarraSuperior } from '@/componentes/barra-superior';
import { FaixaPrototipo } from '@/componentes/faixa-prototipo';
import { MenuUsuario } from '@/componentes/menu-usuario';
import { Dica } from '@/componentes/dica';
import { Marca } from '@/componentes/marca';
import { Icone } from '@/componentes/icone';
import { FaixaDias } from '@/componentes/faixa-dias';
import { proximosDias } from '@/lib/dados';
import { ManualEncomendas } from '@/componentes/manual-encomendas';
import { ManualFormulario } from '@/componentes/manual-formulario';
import { ManualAcoes } from '@/componentes/manual-acoes';
import { ManualCaixa } from '@/componentes/manual-caixa';
import { ManualProducao } from '@/componentes/manual-producao';
import { ManualProdutos } from '@/componentes/manual-produtos';
import { ManualQuadro } from '@/componentes/manual-quadro';
import { ManualFicha } from '@/componentes/manual-ficha';
import { ManualEstoque } from '@/componentes/manual-estoque';
import { ManualCompras } from '@/componentes/manual-compras';
import { ManualFinanceiro } from '@/componentes/manual-financeiro';
import { ManualRelatorios } from '@/componentes/manual-relatorios';
import { usePrototipo } from '@/lib/prototipo-store';
import { listarEncomendas, obterCliente, listarPerfisDeTeste, situacaoPagamento, totalEncomenda } from '@/lib/dados';
import { formatarMoeda, formatarData } from '@/lib/formatar';
import type { StatusEncomenda, SituacaoPagamento } from '@/lib/tipos';

const cores = ['fundo', 'superficie', 'superficie-alt', 'borda', 'borda-forte', 'texto', 'texto-suave', 'primaria', 'primaria-hover', 'primaria-texto', 'primaria-suave', 'sobre-primaria', 'rosa-decorativo', 'sucesso', 'sucesso-suave', 'alerta', 'alerta-suave', 'erro', 'erro-suave', 'info', 'info-suave', 'fundo-modal'];
const secoes = [['fundamentos','Fundamentos'],['botoes','Botões'],['campos','Campos'],['escolhas','Escolhas'],['cartoes','Cartões e indicadores'],['status','Status'],['tabela','Tabela'],['abas','Abas'],['dialogos','Diálogos'],['mensagens','Mensagens'],['vazio','Estado vazio'],['cabecalho','Cabeçalho'],['navegacao','Navegação']];
function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) { return <section className="manual-secao" id={id} aria-labelledby={`${id}-titulo`}><h2 id={`${id}-titulo`}>{titulo}</h2>{children}</section>; }
export default function DesignSystem() {
  const [valor, setValor] = useState(0); const [dialogo, setDialogo] = useState(false); const [gaveta, setGaveta] = useState(false); const notificar = useNotificacao();
  const { estado, usuario } = usePrototipo(); const perfis = listarPerfisDeTeste();
  // A página é pré-renderizada. Datas relativas só entram após a hidratação,
  // para um deploy antigo não divergir do dia atual no navegador.
  const registros = estado.pronto ? listarEncomendas(estado.dados, estado.lojaId).slice(0, 3) : [];
  return <main className="pagina-publica"><CabecalhoPagina titulo="Design system" subtitulo="Sistema Rose • Manual de componentes" acoes={<LinkBotao href={usuario ? '/visao-geral' : '/entrar'}>Voltar ao sistema</LinkBotao>} /><Aviso titulo="Base do protótipo">Componentes reutilizáveis com foco em leitura, contraste e uso no balcão. Os exemplos usam dados fictícios e valores de teste.</Aviso><nav className="manual-indice" aria-label="Índice do manual">{secoes.map(([id, nome]) => <a href={`#${id}`} key={id}>{nome}</a>)}</nav>
    <Secao id="fundamentos" titulo="Cores, tipografia e medidas"><p className="texto-leitura suave">Cores extraídas do logo; ajustar se a marca enviar o manual oficial. Rosa decorativo é exclusivo de detalhes. Textos usam combinações com contraste mínimo de 4,5:1.</p><div className="paleta">{cores.map(c => <div className="amostra-token" key={c}><div className="amostra-cor" style={{ background: `var(--cor-${c})` }} /><code>--cor-{c}</code></div>)}</div><h3>Inter • pesos 400, 500 e 600</h3><div className="pilha-curta">{[13,14,16,18,22,28].map((t,i) => <p key={t} style={{ fontSize: `var(--fonte-${i+1})` }}>Fonte {t}px • Cuidado em cada detalhe</p>)}<p><span style={{ fontWeight: 'var(--peso-normal)' }}>Normal 400</span> • <span style={{ fontWeight: 'var(--peso-medio)' }}>Médio 500</span> • <strong>Forte 600</strong></p><p className="numerico">Números tabulares: 0123456789 • {formatarMoeda(valor)}</p></div><h3>Espaçamentos</h3><div className="paleta">{[4,8,12,16,24,32,48].map((t,i) => <div className="amostra-token" key={t}><code>--espaco-{i+1}: {t}px</code><div className="amostra-espaco" style={{ width: `var(--espaco-${i+1})` }} /></div>)}</div><h3>Raio, sombras e interação</h3><div className="grade">{[6,10,16].map((r,i) => <Cartao key={r} style={{ borderRadius: `var(--raio-${i+1})` }}><code>--raio-{i+1}: {r}px</code></Cartao>)}{[1,2].map(i => <Cartao key={i} style={{ boxShadow: `var(--sombra-${i})` }}><code>--sombra-{i}</code></Cartao>)}</div><p className="suave">Campos de 16px, toque mínimo de 44px e foco de 2px com afastamento de 2px. Movimento apenas em transform e opacity, por 160ms, com --easing-padrao. Sem animação quando o dispositivo pede movimento reduzido.</p></Secao>
    <Secao id="botoes" titulo="01. Botão e link de ação">{(['primario','secundario','perigo','fantasma'] as VarianteBotao[]).map(v => <div className="pilha-curta" key={v}><h3>{{primario:'Primário',secundario:'Secundário',perigo:'Perigo',fantasma:'Fantasma'}[v]}</h3><div className="linha"><Botao variante={v}>Normal</Botao><Botao variante={v} grande>Grande</Botao><Botao variante={v} icone="mais">Com ícone</Botao><Botao variante={v} disabled>Desabilitado</Botao><Botao variante={v} carregando>Carregando</Botao></div></div>)}<div className="linha"><LinkBotao href="/entrar" icone="seta">Link de ação</LinkBotao><Icone nome="produto" /><span className="pequeno suave">Ícones decorativos acompanham o texto.</span></div></Secao>
    <Secao id="campos" titulo="02 a 04. Campos de texto, valor e seleção"><div className="grade"><CampoTexto rotulo="Texto de exemplo" placeholder="Digite aqui" /><CampoTexto rotulo="Com ajuda" ajuda="Informação para preencher o campo." defaultValue="Exemplo preenchido" /><CampoTexto rotulo="Com erro" erro="Preencha este campo para continuar." required /><CampoTexto rotulo="Desabilitado" value="Indisponível neste exemplo" disabled /><CampoValor rotulo="Valor de teste" valorCentavos={valor} onChange={setValor} ajuda={`Valor guardado: ${valor} centavos. Digite apenas números.`} /><CampoValor rotulo="Valor com erro" valorCentavos={0} onChange={() => {}} erro="Informe um valor maior que zero." /><CampoValor rotulo="Valor desabilitado" valorCentavos={0} onChange={() => {}} disabled /><Selecao rotulo="Seleção" ajuda="Seleção nativa com suporte a teclado."><option>Primeira opção</option><option>Segunda opção</option></Selecao><Selecao rotulo="Seleção com erro" erro="Escolha uma opção válida." defaultValue=""><option value="">Selecione</option><option>Exemplo</option></Selecao><Selecao rotulo="Seleção desabilitada" disabled><option>Indisponível</option></Selecao></div></Secao>
    <Secao id="escolhas" titulo="05. Opção única e caixa de marcar"><fieldset><legend>Opção única</legend><div className="linha"><Opcao type="radio" name="radio-exemplo" defaultChecked>Selecionada</Opcao><Opcao type="radio" name="radio-exemplo">Disponível</Opcao><Opcao type="radio" name="radio-exemplo" disabled>Desabilitada</Opcao><Opcao type="radio" name="radio-desabilitado" defaultChecked disabled>Selecionada desabilitada</Opcao></div></fieldset><fieldset><legend>Caixas de marcar</legend><div className="linha"><Opcao defaultChecked>Marcada</Opcao><Opcao>Desmarcada</Opcao><Opcao disabled>Desabilitada</Opcao><Opcao defaultChecked disabled>Marcada desabilitada</Opcao></div></fieldset><fieldset><legend>Opções em pílulas</legend><div className="linha"><Opcao pilula type="radio" name="pilula" defaultChecked>Primeira opção</Opcao><Opcao pilula type="radio" name="pilula">Segunda opção</Opcao><Opcao pilula type="radio" name="pilula" disabled>Indisponível</Opcao><Opcao pilula defaultChecked>Marcada</Opcao><Opcao pilula>Desmarcada</Opcao><Opcao pilula defaultChecked disabled>Marcada desabilitada</Opcao></div></fieldset></Secao>
    <Secao id="cartoes" titulo="06 e 15. Cartão e indicador"><div className="grade"><Cartao className="pilha"><h3>Cartão de conteúdo</h3><p className="suave">Agrupa informações relacionadas com borda discreta e sombra leve.</p><Botao variante="secundario" onClick={() => notificar('Ação de exemplo concluída.')}>Ação de exemplo</Botao></Cartao><Indicador rotulo="Valor de demonstração" valor={formatarMoeda(valor)} ajuda="Valor de teste, sem validade comercial." icone="caixa" /></div></Secao>
    <Secao id="status" titulo="07. Selos de status"><h3>Encomenda</h3><div className="linha">{(['orcamento','confirmado','em_producao','pronto','entregue','cancelado'] as StatusEncomenda[]).map(s => <SeloStatus key={s} status={s} modalidade="entrega" />)}<SeloStatus status="entregue" modalidade="retirada" /></div><h3>Pagamento</h3><div className="linha">{(['pago','parcial','em_aberto'] as SituacaoPagamento[]).map(s => <SeloStatus key={s} status={s} />)}</div></Secao>
    <Secao id="tabela" titulo="08. Tabela responsiva"><p className="suave">A tabela vira cartões em telas de até 760px. Valores abaixo são de teste.</p><Tabela legenda="Encomendas fictícias de exemplo" colunas={[{chave:'cliente',titulo:'Cliente'},{chave:'data',titulo:'Entrega'},{chave:'total',titulo:'Total de teste'},{chave:'status',titulo:'Pagamento'}]} linhas={registros.map(e => ({ id:e.id,celulas:{cliente:obterCliente(estado.dados,estado.lojaId,e.clienteId)?.nome,data:formatarData(e.dataEntrega),total:<span className="numerico">{formatarMoeda(totalEncomenda(e))}</span>,status:<SeloStatus status={situacaoPagamento(e)} />}}))} /></Secao>
    <Secao id="abas" titulo="09. Abas"><p className="suave">Use Tab para entrar nas abas; setas, Home e End para alternar.</p><Abas rotulo="Exemplo de abas" itens={[{id:'primeira',titulo:'Primeira aba',conteudo:<p>Conteúdo da primeira aba.</p>},{id:'segunda',titulo:'Segunda aba',conteudo:<p>Conteúdo da segunda aba.</p>},{id:'terceira',titulo:'Indisponível',conteudo:null,desabilitada:true}]} /></Secao>
    <Secao id="dialogos" titulo="10. Diálogo"><p className="suave">O foco permanece no diálogo. Esc fecha e o foco retorna ao botão de abertura.</p><div className="linha"><Botao onClick={() => setDialogo(true)}>Abrir diálogo de exemplo</Botao><Botao variante="secundario" onClick={() => setGaveta(true)}>Abrir gaveta de exemplo</Botao></div></Secao>
    <Secao id="mensagens" titulo="11 e 12. Avisos e notificações"><div className="pilha">{(['info','sucesso','alerta','erro'] as const).map(t => <Aviso key={t} tom={t} titulo={{info:'Informação',sucesso:'Sucesso',alerta:'Atenção',erro:'Erro'}[t]}>Mensagem de exemplo para orientar a próxima ação.</Aviso>)}</div><Botao variante="secundario" onClick={() => notificar('Salvo. Esta é uma notificação de exemplo.')}>Mostrar notificação</Botao><p className="suave pequeno">A notificação é anunciada ao leitor de tela, pode ser fechada e desaparece após 6 segundos.</p></Secao>
    <Secao id="vazio" titulo="13. Estado vazio"><EstadoVazio titulo="Nenhum item de exemplo" texto="Quando houver informações, elas aparecerão aqui." /><EstadoVazio titulo="Comece por aqui" texto="O estado vazio também pode orientar uma ação." icone="produto" acao={<Botao icone="mais" onClick={() => notificar('Ação de exemplo concluída.')}>Ação opcional</Botao>} /></Secao>
    <Secao id="cabecalho" titulo="14. Cabeçalho de página"><Cartao><CabecalhoPagina titulo="Título de exemplo" subtitulo="Subtítulo com contexto para esta página." acoes={<Botao variante="secundario" onClick={() => notificar('Ação do cabeçalho concluída.')}>Ação da página</Botao>} /></Cartao><Cartao><CabecalhoPagina titulo="Título sem subtítulo ou ações" /></Cartao></Secao>
    <Secao id="dias" titulo="Faixa de dias"><p className="suave">Links com dia, data e quantidade. Sete colunas no computador e duas no celular; foco visível e alvo mínimo de 44px. Tabelas largas permitem rolagem interna no computador, preservando palavras e valores; no celular, viram cartões.</p>{estado.pronto && <FaixaDias dias={proximosDias(estado.dados, estado.lojaId)} />}</Secao>
    <ManualEncomendas />
    <ManualFormulario />
    <ManualAcoes />
    <ManualCaixa />
    <ManualProducao />
    <ManualQuadro />
    <ManualProdutos />
    <ManualFicha />
    <ManualEstoque />
    <ManualCompras />
    <ManualFinanceiro />
    <ManualRelatorios />
    <Secao id="navegacao" titulo="16. Menu lateral e barra superior">
      <p className="suave">Administrativo acessa todos os módulos; Atendimento acessa cinco. Em até 760px, a faixa usa texto curto e restauração por ícone; a barra fica em uma linha, com menu, logo de 32px, loja e iniciais. O rótulo da seleção permanece acessível. A loja do Atendimento aparece como texto curto.</p>
      <h3>Faixa de protótipo responsiva</h3>
      <FaixaPrototipo aoRestaurar={() => notificar('Exemplo de restauração. Na casca, a ação pede confirmação.')} />
      <div className="grade"><div className="manual-menu-exemplo"><Marca /><MenuLateral perfil="administrativo" rota="/visao-geral" /></div><div className="manual-menu-exemplo"><Marca /><MenuLateral perfil="atendimento" rota="/encomendas" /></div></div>
      <h3>Administrativo: loja selecionável</h3>
      <BarraSuperior usuarioExemplo={perfis[0]} aoAbrirMenu={() => setGaveta(true)} aoTrocarPerfil={() => notificar('Exemplo de troca de perfil. Use a casca para trocar de verdade.')} />
      <h3>Atendimento Matriz: loja fixa</h3>
      <BarraSuperior usuarioExemplo={perfis[1]} aoAbrirMenu={() => setGaveta(true)} aoTrocarPerfil={() => notificar('Exemplo de troca de perfil.')} />
      <h3>Atendimento Filial: loja fixa</h3>
      <BarraSuperior usuarioExemplo={perfis[2]} aoAbrirMenu={() => setGaveta(true)} aoTrocarPerfil={() => notificar('Exemplo de troca de perfil.')} />
      <h3>Menu de usuário: fechado e aberto</h3>
      <p className="suave">Toque nas iniciais ou use Enter, Espaço ou as setas. O menu mostra nome, perfil e Trocar perfil. Esc fecha e devolve o foco às iniciais; Tab ou um toque fora também fecha. No computador, a casca mantém nome, perfil e ação visíveis.</p>
      <div className="manual-menu-usuario-exemplo"><MenuUsuario usuario={perfis[0]} aoTrocarPerfil={() => notificar('Exemplo de troca de perfil.')} /></div>
      <h3>Seleção com rótulo compacto</h3>
      <Selecao rotulo="Seleção compacta de exemplo" rotuloCompacto><option>Primeira opção</option><option>Segunda opção</option></Selecao>
      <p className="suave pequeno">O rótulo acima fica visualmente oculto em até 760px e continua disponível ao leitor de tela.</p>
      <h3>Dica: ponteiro, toque e foco</h3>
      <div className="linha"><Dica texto="Dica de exemplo para uma ação">{id => <Botao variante="secundario" aria-describedby={id}>Ver dica</Botao>}</Dica></div>
      <p className="suave pequeno">A dica aparece ao passar o ponteiro, tocar ou focar. Esc a fecha. Marca e ícones são componentes auxiliares demonstrados nas barras e botões.</p>
    </Secao>
    <Dialogo aberto={dialogo} aoFechar={() => setDialogo(false)} titulo="Diálogo de exemplo"><p>Este diálogo demonstra a navegação por teclado.</p><CampoTexto rotulo="Campo no diálogo" placeholder="Teste o foco aqui" /><div className="linha"><Botao variante="secundario" onClick={() => setDialogo(false)}>Cancelar</Botao><Botao onClick={() => { setDialogo(false); notificar('Salvo. Exemplo concluído.'); }}>Salvar exemplo</Botao></div></Dialogo><Dialogo aberto={gaveta} aoFechar={() => setGaveta(false)} titulo="Menu de exemplo" gaveta><Marca /><MenuLateral perfil="administrativo" rota="/visao-geral" aoNavegar={() => setGaveta(false)} /></Dialogo>
  </main>;
}
