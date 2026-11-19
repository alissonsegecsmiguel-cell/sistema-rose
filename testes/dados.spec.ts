import { test, expect } from '@playwright/test';
import { carregarDadosDeTeste, dataRelativa, listarClientes, listarEncomendas, listarProdutos, salvarEncomenda, situacaoPagamento } from '../src/lib/dados';
import { formatarData, formatarHora, formatarMoeda, formatarTelefone } from '../src/lib/formatar';
test('massa de dados cobre cenários, loja e valores inteiros', () => {
  const dados = carregarDadosDeTeste(); expect(dados.clientes).toHaveLength(12); expect(dados.encomendas.length).toBeGreaterThanOrEqual(20);
  expect(new Set(dados.encomendas.map(e => e.status)).size).toBe(6); expect(new Set(dados.encomendas.map(situacaoPagamento)).size).toBe(3);
  expect(new Set(dados.encomendas.map(e => e.modalidade)).size).toBe(2); expect(dados.encomendas.filter(e => e.itens.some(i => i.tipo === 'bolo') && e.itens.some(i => i.tipo === 'produto')).length).toBeGreaterThanOrEqual(3);
  for (const loja of dados.lojas) {
    expect(listarEncomendas(dados,loja.id).every(e=>e.lojaId===loja.id)).toBe(true);
    expect(listarClientes(dados,loja.id)).toHaveLength(12);
    expect(listarProdutos(dados,loja.id).every(p=>p.ativo && p.lojasDisponiveis.includes(loja.id))).toBe(true);
  }
  expect(listarEncomendas(dados,'consolidado')).toHaveLength(dados.encomendas.length);
  function verificar(v: unknown, chave = '') { if (chave.endsWith('Centavos')) expect(Number.isSafeInteger(v)).toBe(true); if (v && typeof v === 'object') for (const [k,valor] of Object.entries(v)) verificar(valor,k); }
  verificar(dados);
  for (const e of dados.encomendas) expect(dados.clientes.some(c=>c.id===e.clienteId)).toBe(true);
});
test('datas usam dia civil de São Paulo inclusive na virada do ano', () => {
  const instante = new Date('2027-01-01T01:30:00Z');
  expect(dataRelativa(0,instante)).toBe('2026-12-31'); expect(dataRelativa(1,instante)).toBe('2027-01-01'); expect(dataRelativa(-1,instante)).toBe('2026-12-30');
  expect(formatarData('2026-11-18')).toBe('18/11/2026'); expect(formatarHora('15:00')).toBe('15:00'); expect(formatarTelefone('00900000001')).toBe('(00) 90000-0001'); expect(formatarMoeda(12345)).toMatch(/123,45/);
});
test('escrita preserva histórico, não altera base e rejeita outra loja ou fração de centavo', () => {
  const dados=carregarDadosDeTeste(), original=structuredClone(dados.encomendas[0]); const evento={id:'teste',data:'2026-11-18T12:00:00-03:00',usuarioId:'admin-teste',acao:'cancelada',detalhe:'Cancelamento fictício.'};
  const alterada={...original,status:'cancelado' as const,historico:[]};
  const resultado=salvarEncomenda(dados,original.lojaId,alterada,evento);
  expect(resultado.encomendas[0].historico).toEqual([...original.historico,evento]); expect(dados.encomendas[0]).toEqual(original);
  expect(()=>salvarEncomenda(dados,'filial',alterada,evento)).toThrow('outra loja');
  expect(()=>salvarEncomenda(dados,original.lojaId,{...alterada,descontoCentavos:1.1},evento)).toThrow('centavos');
});
