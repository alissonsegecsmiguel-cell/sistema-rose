import { useId, type TextareaHTMLAttributes } from 'react';
export function CampoTextoLongo({ rotulo, ajuda, erro, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { rotulo: string; ajuda?: string; erro?: string }) {
  const id = useId(); return <div className="campo"><label htmlFor={id}>{rotulo}</label><textarea {...props} id={id} aria-invalid={!!erro} aria-describedby={erro || ajuda ? `${id}-ajuda` : undefined} rows={props.rows ?? 3} />{(erro || ajuda) && <p className={erro ? 'campo-erro' : 'campo-ajuda'} id={`${id}-ajuda`}>{erro || ajuda}</p>}</div>;
}
