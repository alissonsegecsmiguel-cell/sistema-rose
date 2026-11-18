import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PrototipoProvider } from '@/lib/prototipo-store';
import { NotificacaoProvider } from '@/componentes/notificacao';
import { obterConfiguracao } from '@/lib/dados';
import '@/estilos/tokens.css';
import '@/estilos/base.css';
import '@/estilos/componentes.css';
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--fonte-inter', display: 'swap' });
const config = obterConfiguracao();
export const metadata: Metadata = { title: { default: `${config.nomeSistema} | Protótipo`, template: `%s | ${config.nomeSistema}` }, description: `Protótipo com dados fictícios do ${config.nomeMarca}.`, robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body className={inter.variable}><PrototipoProvider><NotificacaoProvider>{children}</NotificacaoProvider></PrototipoProvider></body></html>; }
