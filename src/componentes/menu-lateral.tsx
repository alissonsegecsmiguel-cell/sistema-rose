'use client';
import Link from 'next/link';
import { menuDoPerfil } from '@/lib/permissoes';
import type { Perfil } from '@/lib/tipos';
import { Icone } from './icone';
export function MenuLateral({ perfil, rota, aoNavegar }: { perfil: Perfil; rota: string; aoNavegar?: () => void }) {
  return <><nav className="menu-links" aria-label="Menu principal">{menuDoPerfil(perfil).map(m => <Link key={m.rota} href={m.rota} className="menu-link" aria-current={rota === m.rota || rota.startsWith(`${m.rota}/`) ? 'page' : undefined} onClick={aoNavegar}><Icone nome={m.icone} />{m.titulo}</Link>)}</nav><div className="menu-rodape">{perfil === 'administrativo' && <Link href="/design-system" onClick={aoNavegar} className="menu-link"><Icone nome="manual" />Design system</Link>}<p>Ambiente de demonstração<br />Dados fictícios de teste</p></div></>;
}
