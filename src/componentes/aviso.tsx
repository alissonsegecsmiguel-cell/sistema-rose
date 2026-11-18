import type { ReactNode } from 'react';
import { Icone } from './icone';
export function Aviso({ tom = 'info', titulo, children }: { tom?: 'info' | 'sucesso' | 'alerta' | 'erro'; titulo?: string; children: ReactNode }) { return <div className={`aviso tom-${tom}`} role={tom === 'erro' ? 'alert' : 'note'}><Icone nome={tom} /><div>{titulo && <p><strong>{titulo}</strong></p>}<div>{children}</div></div></div>; }
