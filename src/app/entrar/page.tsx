'use client';
import { useRouter } from 'next/navigation';
import { usePrototipo } from '@/lib/prototipo-store';
import { listarPerfisDeTeste } from '@/lib/dados';
import { Marca } from '@/componentes/marca';
import { Aviso } from '@/componentes/aviso';
import { Icone } from '@/componentes/icone';
export default function Entrar() {
  const { estado, escolherPerfil } = usePrototipo(); const router = useRouter();
  return <main className="entrada"><Marca entrada /><div className="entrada-conteudo"><h2>Como você quer conhecer o sistema?</h2><p className="suave">Escolha um perfil de teste para explorar as telas.</p></div><div className="entrada-perfis">{(estado.pronto ? estado.dados.usuarios.filter(u => u.ativo !== false) : listarPerfisDeTeste()).map(usuario => <button key={usuario.id} type="button" className="perfil-cartao" disabled={!estado.pronto} onClick={() => { escolherPerfil(usuario.id); router.push('/visao-geral'); }}><span className="perfil-icone"><Icone nome={usuario.perfil === 'administrativo' ? 'perfil' : 'loja'} tamanho={24} /></span><span className="perfil-titulo">{usuario.tituloAcesso}</span><span className="pequeno suave">{usuario.nome}</span><span className="perfil-descricao">{usuario.descricaoAcesso}</span><span className="perfil-entrar">Entrar com este perfil <Icone nome="seta" tamanho={18} /></span></button>)}</div><Aviso>Protótipo: não há senha. No sistema real, cada pessoa terá o próprio login.</Aviso><section className="entrada-explorar pilha-curta" aria-labelledby="explorar-titulo"><h2 id="explorar-titulo">Como explorar este protótipo</h2><ul className="pilha-curta">{['Monte uma encomenda com bolo e docinhos: entre como Atendimento e vá em Encomendas, Nova encomenda.', 'Abra e feche o caixa: Caixa, Abrir caixa, venda no balcão e Fechar caixa.', 'Veja o custo de um bolo: entre como Administrativo e vá em Ficha técnica, Custo do bolo.', 'Veja o DRE do mês passado: Administrativo, Financeiro, aba DRE.'].map(t => <li key={t}>{t}</li>)}</ul></section><p className="entrada-rodape">Ambiente de demonstração • Dados fictícios • Sem validade comercial</p></main>;
}
