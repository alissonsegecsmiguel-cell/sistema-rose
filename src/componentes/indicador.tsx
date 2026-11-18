import { Cartao } from './cartao';
import { Icone } from './icone';
export function Indicador({ rotulo, valor, ajuda, icone = 'relatorios' }: { rotulo: string; valor: string; ajuda?: string; icone?: string }) { return <Cartao className="indicador"><div className="indicador-topo"><span>{rotulo}</span><Icone nome={icone} /></div><p className="indicador-valor numerico">{valor}</p>{ajuda && <p className="suave pequeno">{ajuda}</p>}</Cartao>; }
