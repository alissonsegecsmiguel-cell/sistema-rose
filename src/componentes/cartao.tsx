import type { HTMLAttributes } from 'react';
export function Cartao({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) { return <div {...props} className={`cartao ${className}`} />; }
