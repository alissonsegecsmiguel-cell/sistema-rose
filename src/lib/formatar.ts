import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { obterConfiguracao } from './dados';

export function formatarMoeda(centavos: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100); }
export function formatarData(valor: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) { const data = parseISO(valor); return isValid(data) ? format(data, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida'; }
  const data = new Date(valor);
  return isValid(data) ? new Intl.DateTimeFormat('pt-BR', { timeZone: obterConfiguracao().fuso }).format(data) : 'Data inválida';
}
export function formatarHora(valor: string) {
  if (/^\d{2}:\d{2}$/.test(valor)) return valor;
  const data = new Date(valor);
  return isValid(data) ? new Intl.DateTimeFormat('pt-BR', { timeZone: obterConfiguracao().fuso, hour: '2-digit', minute: '2-digit' }).format(data) : 'Hora inválida';
}
export function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, '');
  return numeros.length === 11 ? numeros.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') : valor;
}
