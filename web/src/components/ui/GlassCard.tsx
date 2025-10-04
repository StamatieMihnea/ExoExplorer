import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl pointer-events-auto ${className}`}
    >
      {children}
    </div>
  );
}

