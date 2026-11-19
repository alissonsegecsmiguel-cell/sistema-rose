'use client';
import { useState } from 'react';
import type { ItemEncomenda } from '@/lib/tipos';
import { calcularValorBolo, novoItemBolo } from '@/lib/dados';
import { usePrototipo } from '@/lib/prototipo-store';
import { formatarMoeda } from '@/lib/formatar';
import { Botao } from './botao';
import { PilulasBolo } from './pilulas-bolo';
import { CampoValor } from './campo-valor';
import { CampoTexto } from './campo-texto';
import { CampoTextoLongo } from './campo-texto-longo';
import { Aviso } from './aviso';
type Bolo = Extract<ItemEncomenda, { tipo: 'bolo' }>;
export function MontadorBolo({ item, aoSalvar }: { item?: Bolo; aoSalvar: (i: Bolo) => void }) {
  const { estado } = usePrototipo(), [bolo, setBolo] = useState<Bolo>(() => item ?? novoItemBolo()), [manual, setManual] = useState(!!item?.ajuste), [valor, setValor] = useState(item?.valorCentavos ?? 0), [motivo, setMotivo] = useState(item?.ajuste?.motivo ?? ''), [erro, setErro] = useState('');
  const dados = estado.dados, calculado = calcularValorBolo(dados, bolo);
  return <div className="pilha">{erro && <Aviso tom="erro" titulo="Confira a montagem">{erro}</Aviso>}<PilulasBolo dados={dados} bolo={bolo} aoMudar={setBolo} /><CampoTextoLongo rotulo="Detalhes do bolo" ajuda="Tema, cores, frase da placa, nome, idade" value={bolo.detalhes} onChange={e => setBolo({ ...bolo, detalhes: e.target.value })} /><strong>Preço calculado: {formatarMoeda(calculado)}</strong><Botao variante="secundario" onClick={() => { setManual(!manual); setValor(calculado); }}>Ajustar valor</Botao>{manual && <><CampoValor rotulo="Valor ajustado" valorCentavos={valor} onChange={setValor} /><CampoTexto rotulo="Motivo do ajuste" required value={motivo} onChange={e => setMotivo(e.target.value)} /></>}<Botao onClick={() => { if (!bolo.formato || !bolo.tamanho || !bolo.massa || !bolo.recheios.length) return setErro('Escolha formato, tamanho, massa e pelo menos um recheio.'); if (bolo.recheios.length > dados.configuracao.limiteRecheios) return setErro(`Escolha no máximo ${dados.configuracao.limiteRecheios} recheios.`); if (manual && !motivo.trim()) return setErro('Informe o motivo do ajuste de valor.'); aoSalvar({ ...bolo, valorCentavos: manual ? valor : calculado, ajuste: manual ? { valorOriginalCentavos: calculado, motivo } : undefined }); }}>Adicionar bolo ao pedido</Botao></div>;
}
