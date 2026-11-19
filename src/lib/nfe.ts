// Leitura de NF-e no navegador, sem enviar o arquivo a lugar nenhum.
// No navegador usa DOMParser. Fora dele (testes de unidade) usa um leitor mínimo com a mesma interface.

export interface ItemNfe { codigo: string; descricao: string; unidade: string; quantidade: number; valorUnitarioCentavos: number; totalCentavos: number }
export interface NotaLida { emitenteNome: string; emitenteDocumento: string; numero: string; dataEmissao: string; chave: string; itens: ItemNfe[]; freteCentavos: number; descontoCentavos: number; totalCentavos: number }
interface No { tagName: string; textContent: string | null; getElementsByTagName(nome: string): ArrayLike<No> }
interface NoSimples { tagName: string; filhos: NoSimples[]; texto: string[]; readonly textContent: string; getElementsByTagName(nome: string): NoSimples[] }

/** Leitor mínimo de XML bem formado: tags, atributos ignorados, texto e entidades básicas. */
function lerXmlSimples(texto: string): No {
  const raiz = criar('#documento'), pilha = [raiz];
  const limpo = texto.replace(/<\?[\s\S]*?\?>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const re = /<\/?([A-Za-z_][\w.:-]*)[^>]*?(\/?)>|([^<]+)/g; let m: RegExpExecArray | null;
  while ((m = re.exec(limpo))) {
    const atual = pilha.at(-1)!;
    if (m[3] !== undefined) { if (m[3].trim()) atual.texto.push(m[3].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')); continue; }
    const nome = m[1].includes(':') ? m[1].split(':')[1] : m[1];
    if (m[0].startsWith('</')) { if (atual.tagName !== nome) throw new Error('XML mal formado.'); pilha.pop(); continue; }
    const filho = criar(nome); atual.filhos.push(filho); if (!m[2]) pilha.push(filho);
  }
  if (pilha.length !== 1) throw new Error('XML mal formado.');
  return raiz;
  function criar(tagName: string): NoSimples {
    const no: NoSimples = { tagName, filhos: [], texto: [], get textContent(): string { return [...no.texto, ...no.filhos.map(f => f.textContent)].join(''); }, getElementsByTagName(n: string) { const r: NoSimples[] = []; const visitar = (x: NoSimples) => x.filhos.forEach(f => { if (f.tagName === n) r.push(f); visitar(f); }); visitar(no); return r; } };
    return no;
  }
}
function documento(texto: string): No {
  if (typeof DOMParser !== 'undefined') { const d = new DOMParser().parseFromString(texto, 'application/xml'); if (d.getElementsByTagName('parsererror').length) throw new Error('O arquivo não é um XML válido.'); return d as unknown as No; }
  return lerXmlSimples(texto);
}
const primeiro = (no: No, nome: string) => no.getElementsByTagName(nome)[0];
const texto = (no: No | undefined, nome: string) => (no && primeiro(no, nome)?.textContent?.trim()) || '';
const centavos = (v: string) => Math.round(Number(v || '0') * 100);

/** Lê uma NF-e (nfeProc ou NFe). Erros com mensagem clara para XML inválido ou de outro tipo. */
export function lerNfe(conteudo: string): NotaLida {
  if (!conteudo.trim().startsWith('<')) throw new Error('O arquivo não é um XML. Escolha o XML da nota fiscal eletrônica.');
  let doc: No; try { doc = documento(conteudo); } catch { throw new Error('O arquivo não é um XML válido.'); }
  const inf = primeiro(doc, 'infNFe'); if (!inf) throw new Error('Este XML não é de uma NF-e. Confira se escolheu o arquivo da nota de compra.');
  const emit = primeiro(inf, 'emit'), ide = primeiro(inf, 'ide'), total = primeiro(inf, 'ICMSTot');
  const itens = Array.from(inf.getElementsByTagName('det')).map(det => { const p = primeiro(det, 'prod'); return { codigo: texto(p, 'cProd'), descricao: texto(p, 'xProd'), unidade: texto(p, 'uCom'), quantidade: Number(texto(p, 'qCom') || 0), valorUnitarioCentavos: centavos(texto(p, 'vUnCom')), totalCentavos: centavos(texto(p, 'vProd')) }; });
  if (!itens.length) throw new Error('A nota não tem itens.');
  const idAttr = (inf as unknown as { getAttribute?: (n: string) => string | null }).getAttribute?.('Id') ?? '', chave = (texto(doc, 'chNFe') || idAttr.replace(/^NFe/, '')).replace(/\D/g, '');
  const cnpj = texto(emit, 'CNPJ') || texto(emit, 'CPF');
  return { emitenteNome: texto(emit, 'xNome'), emitenteDocumento: formatarDocumento(cnpj), numero: texto(ide, 'nNF'), dataEmissao: (texto(ide, 'dhEmi') || texto(ide, 'dEmi')).slice(0, 10), chave, itens, freteCentavos: centavos(texto(total, 'vFrete')), descontoCentavos: centavos(texto(total, 'vDesc')), totalCentavos: centavos(texto(total, 'vNF')) };
}
export function formatarDocumento(v: string) { const d = v.replace(/\D/g, ''); return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : d.length === 11 ? d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : v; }
/** Nome normalizado para sugerir vínculo por semelhança. */
export function normalizar(v: string) { return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
