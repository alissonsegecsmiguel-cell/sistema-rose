'use client';
import { CampoTexto } from './campo-texto';
import { formatarMoeda } from '@/lib/formatar';
export function CampoValor({ rotulo, valorCentavos, onChange, ajuda, erro, disabled }: { rotulo: string; valorCentavos: number; onChange: (valor: number) => void; ajuda?: string; erro?: string; disabled?: boolean }) {
  return <CampoTexto rotulo={rotulo} inputMode="numeric" value={formatarMoeda(valorCentavos)} onChange={e => { const valor = Number(e.target.value.replace(/\D/g, '')); if (Number.isSafeInteger(valor)) onChange(valor); }} ajuda={ajuda} erro={erro} disabled={disabled} />;
}
