import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icone } from './icone';
import type { VarianteBotao } from './botao';
export function LinkBotao({ href, children, variante = 'secundario', icone }: { href: string; children: ReactNode; variante?: VarianteBotao; icone?: string }) { return <Link href={href} className={`botao botao-${variante}`}>{icone && <Icone nome={icone} />}{children}</Link>; }
