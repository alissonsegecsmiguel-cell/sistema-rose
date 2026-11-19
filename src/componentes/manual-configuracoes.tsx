'use client';
import { usePrototipo } from '@/lib/prototipo-store';
import { avisosAgendaEncomenda, dataRelativa, sugestaoTaxas } from '@/lib/dados';
import { Aviso } from './aviso';
import { CampoValor } from './campo-valor';
export function ManualConfiguracoes() {
  const { estado } = usePrototipo(); if (!estado.pronto) return null; const d = estado.dados;
  return <section className="manual-secao pilha" id="configuracoes-manual"><h2>Configurações aplicadas nas telas</h2><p className="suave">As configurações não criam controles novos: aparecem como ajuda nos campos (taxa padrão sugerida, troco padrão, horário de funcionamento) e como avisos de alerta que não bloqueiam (antecedência curta, horário fora do funcionamento).</p><CampoValor rotulo="Exemplo de taxa de cartão" valorCentavos={0} onChange={() => undefined} ajuda={`Taxas padrão: ${sugestaoTaxas(d, 10000)}. Campo editável.`} />{avisosAgendaEncomenda(d, dataRelativa(0), '22:00').map(a => <Aviso key={a} tom="alerta">{a}</Aviso>)}</section>;
}
