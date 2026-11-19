import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
export function SeletorQuantidade({ valor, aoMudar, rotulo = 'Quantidade' }: { valor: number; aoMudar: (v: number) => void; rotulo?: string }) {
  return <div className="linha"><Botao variante="secundario" aria-label={`Diminuir ${rotulo.toLowerCase()}`} disabled={valor <= 1} onClick={() => aoMudar(valor - 1)}>−</Botao><CampoTexto rotulo={rotulo} type="number" min={1} step={1} value={valor} onChange={e => aoMudar(Math.max(1, Math.floor(Number(e.target.value) || 1)))} /><Botao variante="secundario" aria-label={`Aumentar ${rotulo.toLowerCase()}`} onClick={() => aoMudar(valor + 1)}>+</Botao></div>;
}
