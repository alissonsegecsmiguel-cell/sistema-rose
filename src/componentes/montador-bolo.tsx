'use client';
import { useState } from 'react';
import type { ItemEncomenda } from '@/lib/tipos';
import { calcularValorBolo, novoItemBolo } from '@/lib/dados';
import { usePrototipo } from '@/lib/prototipo-store';
import { formatarMoeda } from '@/lib/formatar';
import { Botao } from './botao';
import { Opcao } from './opcao';
import { CampoValor } from './campo-valor';
import { CampoTexto } from './campo-texto';
import { CampoTextoLongo } from './campo-texto-longo';
import { Aviso } from './aviso';
type Bolo = Extract<ItemEncomenda, { tipo: 'bolo' }>;
export function MontadorBolo({ item, aoSalvar }: { item?: Bolo; aoSalvar: (i: Bolo) => void }) {
  const { estado } = usePrototipo(), [bolo, setBolo] = useState<Bolo>(() => item ?? novoItemBolo()), [manual, setManual] = useState(!!item?.ajuste), [valor, setValor] = useState(item?.valorCentavos ?? 0), [motivo, setMotivo] = useState(item?.ajuste?.motivo ?? ''), [erro, setErro] = useState('');
  const dados = estado.dados, calculado = calcularValorBolo(dados, bolo), limite = dados.configuracao.limiteRecheios;
  const grupos = [['formatos', 'Formato', 'formato'], ['tamanhos', 'Tamanho', 'tamanho'], ['massas', 'Massa', 'massa'], ['recheios', `Recheios (até ${limite}, a confirmar com o cliente)`, 'recheios'], ['adicionais', 'Adicionais de recheio', 'adicionais'], ['decoracoes', 'Decoração', 'decoracoes']] as const;
  return <div className="pilha">{erro && <Aviso tom="erro" titulo="Confira a montagem">{erro}</Aviso>}{grupos.map(([grupo, titulo, campo]) => { const multiplo = campo === 'recheios' || campo === 'adicionais' || campo === 'decoracoes'; return <fieldset key={grupo}><legend>{titulo}</legend><div className="linha">{dados.opcoesBolo[grupo].map(o => { const marcado = multiplo ? (bolo[campo] as string[]).includes(o.id) : bolo[campo] === o.id; return <div className="pilha-curta" key={o.id}><Opcao pilula type={multiplo ? 'checkbox' : 'radio'} name={`bolo-${campo}`} checked={marcado} disabled={campo === 'recheios' && !marcado && bolo.recheios.length >= limite} onChange={() => setBolo({ ...bolo, [campo]: multiplo ? marcado ? (bolo[campo] as string[]).filter(id => id !== o.id) : [...(bolo[campo] as string[]), o.id] : o.id })}>{o.nome}{o.valorCentavos > 0 ? ` • ${formatarMoeda(o.valorCentavos)}` : ''}</Opcao>{o.observacao && <span className="pequeno suave">{o.observacao}</span>}</div>; })}</div></fieldset>; })}<CampoTextoLongo rotulo="Detalhes do bolo" ajuda="Tema, cores, frase da placa, nome, idade" value={bolo.detalhes} onChange={e => setBolo({ ...bolo, detalhes: e.target.value })} /><strong>Preço calculado: {formatarMoeda(calculado)}</strong><Botao variante="secundario" onClick={() => { setManual(!manual); setValor(calculado); }}>Ajustar valor</Botao>{manual && <><CampoValor rotulo="Valor ajustado" valorCentavos={valor} onChange={setValor} /><CampoTexto rotulo="Motivo do ajuste" required value={motivo} onChange={e => setMotivo(e.target.value)} /></>}<Botao onClick={() => { if (!bolo.formato || !bolo.tamanho || !bolo.massa || !bolo.recheios.length) return setErro('Escolha formato, tamanho, massa e pelo menos um recheio.'); if (manual && !motivo.trim()) return setErro('Informe o motivo do ajuste de valor.'); aoSalvar({ ...bolo, valorCentavos: manual ? valor : calculado, ajuste: manual ? { valorOriginalCentavos: calculado, motivo } : undefined }); }}>Adicionar bolo ao pedido</Botao></div>;
}
