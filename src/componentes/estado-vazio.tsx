import type { ReactNode } from 'react';
import { Icone } from './icone';
export function EstadoVazio({ titulo = 'Este espaço está sendo preparado', texto, icone = 'vazio', acao }: { titulo?: string; texto: string; icone?: string; acao?: ReactNode }) { return <div className="estado-vazio"><span className="estado-vazio-icone"><Icone nome={icone} tamanho={28} /></span><h2>{titulo}</h2><p>{texto}</p>{acao}</div>; }
