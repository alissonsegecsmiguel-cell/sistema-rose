'use client';
import { useState } from 'react';
import { CalendarioMensal } from './calendario-mensal';
import { LinhaTempo } from './linha-tempo';
import { ListaEncomendas } from './lista-encomendas';
import { usePrototipo } from '@/lib/prototipo-store';
import { dataRelativa, diasDoMes, listarEncomendas } from '@/lib/dados';
export function ManualEncomendas() {
  const { estado } = usePrototipo(), [mes, setMes] = useState(dataRelativa(0).slice(0, 7)), [dia, setDia] = useState(dataRelativa(0));
  if (!estado.pronto) return null;
  const { dados, lojaId } = estado, lista = listarEncomendas(dados, lojaId).slice(0, 2);
  return <section className="manual-secao pilha" id="encomendas-manual"><h2>Calendário mensal, lista de encomendas e linha do tempo</h2><p className="suave">Abas aceitam ativa e aoMudar para guardar a seleção no endereço. Calendário usa botões nativos, seleção com aria-pressed e alertas em texto. Em 390px exibe os dias ocupados por semana. Lista reutiliza tabela e selos; histórico identifica data, autor e alteração.</p><CalendarioMensal mes={mes} dias={diasDoMes(dados, lojaId, mes)} selecionado={dia} aoSelecionar={setDia} aoMudarMes={setMes} aoHoje={() => { setDia(dataRelativa(0)); setMes(dataRelativa(0).slice(0, 7)); }} /><ListaEncomendas dados={dados} lojaId={lojaId} lista={lista} /><LinhaTempo eventos={lista.flatMap(e => e.historico).slice(0, 2).map(h => ({ ...h, titulo: h.acao, usuario: dados.usuarios.find(u => u.id === h.usuarioId)?.nome || 'Usuário de teste' }))} /></section>;
}
