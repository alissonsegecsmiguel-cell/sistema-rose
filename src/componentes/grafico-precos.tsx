import { formatarData, formatarMoeda } from '@/lib/formatar';
/** Mini gráfico de linha em SVG, sem biblioteca. O texto alternativo resume primeiro e último valor. */
export function GraficoPrecos({ pontos, rotulo }: { pontos: { data: string; valor: number }[]; rotulo: string }) {
  if (pontos.length < 2) return <p className="pequeno suave">{pontos.length ? `Um preço registrado: ${formatarMoeda(pontos[0].valor)} em ${formatarData(pontos[0].data)}.` : 'Sem preços registrados.'}</p>;
  const largura = 320, altura = 120, margem = 12, valores = pontos.map(p => p.valor), min = Math.min(...valores), max = Math.max(...valores), faixa = max - min || 1;
  const xy = pontos.map((p, i) => [margem + i * (largura - 2 * margem) / (pontos.length - 1), altura - margem - (p.valor - min) / faixa * (altura - 2 * margem)]);
  const resumo = `${rotulo}: de ${formatarMoeda(pontos[0].valor)} em ${formatarData(pontos[0].data)} para ${formatarMoeda(pontos.at(-1)!.valor)} em ${formatarData(pontos.at(-1)!.data)}.`;
  return <figure className="grafico-precos"><svg viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label={resumo}><line x1={margem} x2={largura - margem} y1={altura - margem} y2={altura - margem} className="grafico-eixo" /><polyline points={xy.map(p => p.join(',')).join(' ')} className="grafico-linha" />{xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} className="grafico-ponto" />)}</svg><figcaption className="pequeno suave">{resumo}</figcaption></figure>;
}
