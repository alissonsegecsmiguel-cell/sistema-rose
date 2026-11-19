'use client';

import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { carregarDadosDeTeste, gravarSessaoLocal, lerSessaoLocal, obterUsuario, restaurarDadosDeTeste, salvarEncomenda } from './dados';
import type { DadosPrototipo, Encomenda, EventoHistorico, SessaoPrototipo } from './tipos';

type Estado = SessaoPrototipo & { pronto: boolean };
type Acao = { tipo: 'dados'; dados: DadosPrototipo } | { tipo: 'carregar'; sessao: SessaoPrototipo } | { tipo: 'perfil'; id: string | null } | { tipo: 'loja'; id: string } | { tipo: 'restaurar' } | { tipo: 'encomenda'; encomenda: Encomenda; evento: EventoHistorico };
function reduzir(estado: Estado, acao: Acao): Estado {
  if (acao.tipo === 'dados') return { ...estado, dados: acao.dados };
  if (acao.tipo === 'carregar') return { ...acao.sessao, pronto: true };
  if (acao.tipo === 'perfil') { const usuario = obterUsuario(estado.dados, acao.id); if (usuario && usuario.ativo === false) return estado; return { ...estado, usuarioId: usuario?.id ?? null, lojaId: usuario?.lojaId ?? 'matriz' }; }
  if (acao.tipo === 'loja') {
    if (obterUsuario(estado.dados, estado.usuarioId)?.perfil !== 'administrativo') return estado;
    return acao.id === 'consolidado' || estado.dados.lojas.some(l => l.id === acao.id) ? { ...estado, lojaId: acao.id } : estado;
  }
  if (acao.tipo === 'restaurar') return { ...estado, dados: carregarDadosDeTeste() };
  if (acao.tipo === 'encomenda') return { ...estado, dados: salvarEncomenda(estado.dados, estado.lojaId, acao.encomenda, acao.evento) };
  return estado;
}
const Contexto = createContext<{ estado: Estado; atualizar: (dados: DadosPrototipo) => void; escolherPerfil: (id: string | null) => void; escolherLoja: (id: string) => void; restaurar: () => void; salvar: (encomenda: Encomenda, evento: EventoHistorico) => void } | null>(null);
export function PrototipoProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reduzir, undefined, () => ({ dados: carregarDadosDeTeste(), usuarioId: null, lojaId: 'matriz', pronto: false }));
  useEffect(() => { dispatch({ tipo: 'carregar', sessao: lerSessaoLocal() }); }, []);
  useEffect(() => { if (estado.pronto) gravarSessaoLocal(estado); }, [estado]);
  return <Contexto.Provider value={{ estado, atualizar: dados => dispatch({ tipo: 'dados', dados }), escolherPerfil: id => dispatch({ tipo: 'perfil', id }), escolherLoja: id => dispatch({ tipo: 'loja', id }), restaurar: () => { restaurarDadosDeTeste(); dispatch({ tipo: 'restaurar' }); }, salvar: (encomenda, evento) => dispatch({ tipo: 'encomenda', encomenda, evento }) }}>{children}</Contexto.Provider>;
}
export function usePrototipo() { const contexto = useContext(Contexto); if (!contexto) throw new Error('Contexto do protótipo indisponível.'); return { ...contexto, usuario: obterUsuario(contexto.estado.dados, contexto.estado.usuarioId) }; }
