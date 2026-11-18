'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Botao } from './botao';
import { Icone } from './icone';
const Contexto = createContext<(texto: string) => void>(() => {});
export function NotificacaoProvider({ children }: { children: ReactNode }) {
  const [mensagem, setMensagem] = useState(''); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function notificar(texto: string) { if (timer.current) clearTimeout(timer.current); setMensagem(texto); timer.current = setTimeout(() => setMensagem(''), 6000); }
  return <Contexto.Provider value={notificar}>{children}<div className="notificacao-area" role="status" aria-live="polite" aria-atomic="true">{mensagem && <div className="notificacao"><Icone nome="sucesso" /><p>{mensagem}</p><Botao variante="fantasma" icone="fechar" aria-label="Fechar notificação" onClick={() => setMensagem('')}><span className="sr-only">Fechar</span></Botao></div>}</div></Contexto.Provider>;
}
export function useNotificacao() { return useContext(Contexto); }
