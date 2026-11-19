'use client';
import type { DadosPrototipo, ItemEncomenda } from '@/lib/tipos';
import { GRUPOS_BOLO, opcoesMontagem } from '@/lib/dados';
import { formatarMoeda } from '@/lib/formatar';
import { Opcao } from './opcao';
type Bolo = Extract<ItemEncomenda, { tipo: 'bolo' }>;
/** Pílulas da montagem do bolo. Usadas na nova encomenda e na pré-visualização de Produtos. */
export function PilulasBolo({ dados, bolo, aoMudar, prefixo = 'bolo' }: { dados: DadosPrototipo; bolo: Bolo; aoMudar: (b: Bolo) => void; prefixo?: string }) {
  const limite = dados.configuracao.limiteRecheios;
  return <>{GRUPOS_BOLO.map(({ id: grupo, titulo, campo, multiplo }) => {
    const atuais = multiplo ? bolo[campo] as string[] : [bolo[campo] as string].filter(Boolean), opcoes = opcoesMontagem(dados, grupo, atuais);
    return <fieldset key={grupo}><legend>{campo === 'recheios' ? `${titulo} (até ${limite})` : titulo}</legend>{opcoes.length ? <div className="linha">{opcoes.map(o => { const marcado = atuais.includes(o.id); return <div className="pilha-curta" key={o.id}><Opcao pilula type={multiplo ? 'checkbox' : 'radio'} name={`${prefixo}-${campo}`} checked={marcado} disabled={campo === 'recheios' && !marcado && bolo.recheios.length >= limite} onChange={() => aoMudar({ ...bolo, [campo]: multiplo ? marcado ? atuais.filter(x => x !== o.id) : [...atuais, o.id] : o.id })}>{o.nome}{o.valorCentavos > 0 ? ` • ${formatarMoeda(o.valorCentavos)}` : ''}</Opcao>{grupo === 'tamanhos' && (o.servePessoas || o.pesoAproximado) && <span className="pequeno suave">{[o.servePessoas && `Serve cerca de ${o.servePessoas} pessoas`, o.pesoAproximado && `cerca de ${o.pesoAproximado}`].filter(Boolean).join(', ')}</span>}{o.aConfirmar && <span className="selo tom-alerta">A confirmar com o cliente</span>}{!o.ativo && <span className="selo tom-neutro">Inativa, mantida nesta encomenda</span>}</div>; })}</div> : <p className="suave">Nenhuma opção ativa neste grupo.</p>}</fieldset>;
  })}</>;
}
