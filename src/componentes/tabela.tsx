import type { ReactNode } from 'react';
export function Tabela({ legenda, colunas, linhas }: { legenda: string; colunas: { chave: string; titulo: string }[]; linhas: { id: string; celulas: Record<string, ReactNode> }[] }) {
  return <div className="tabela-container"><table className="tabela" role="table"><caption>{legenda}</caption><thead role="rowgroup"><tr role="row">{colunas.map(c => <th key={c.chave} scope="col" role="columnheader">{c.titulo}</th>)}</tr></thead><tbody role="rowgroup">{linhas.map(l => <tr key={l.id} role="row">{colunas.map(c => <td key={c.chave} data-rotulo={c.titulo} role="cell">{l.celulas[c.chave]}</td>)}</tr>)}</tbody></table></div>;
}
