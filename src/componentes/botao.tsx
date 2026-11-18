import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icone } from './icone';
export type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'fantasma';
export function Botao({ children, variante = 'primario', grande = false, carregando = false, icone, className = '', disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variante?: VarianteBotao; grande?: boolean; carregando?: boolean; icone?: string }) {
  return <button type="button" {...props} className={`botao botao-${variante} ${grande ? 'botao-grande' : ''} ${className}`} disabled={disabled || carregando} aria-busy={carregando || undefined}>{(carregando || icone) && <Icone nome={carregando ? 'carregando' : icone!} />}{children}{carregando && <span className="sr-only">, carregando</span>}</button>;
}
