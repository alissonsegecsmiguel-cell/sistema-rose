'use client';

import { Botao } from './botao';
import { Dica } from './dica';
import { Icone } from './icone';

export function FaixaPrototipo({ aoRestaurar }: { aoRestaurar: () => void }) {
  return (
    <div className="faixa-prototipo">
      <p><Icone nome="info" /><span className="faixa-texto-completo">Protótipo com dados fictícios. Nada aqui é real.</span><span className="faixa-texto-compacto">Protótipo: dados fictícios</span></p>
      <Dica texto="Restaurar dados de teste">
        {id => <Botao variante="fantasma" icone="restaurar" aria-label="Restaurar dados de teste" aria-describedby={id} onClick={aoRestaurar}><span className="faixa-texto-completo">Restaurar dados de teste</span></Botao>}
      </Dica>
    </div>
  );
}
