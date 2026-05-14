import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <div
      className={`bg-card rounded-card border border-border p-6 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
