import { ReactNode } from 'react';

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'emerald' | 'blue' | 'purple';
  className?: string;
  disabled?: boolean;
}

const variantStyles = {
  default: 'bg-white/10 hover:bg-white/20 border-white/20',
  emerald: 'bg-emerald-500/20 hover:bg-emerald-500/40 border-emerald-400/30 hover:scale-105 transform',
  blue: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/30',
  purple: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/30',
};

export function GlassButton({ 
  children, 
  onClick, 
  variant = 'default',
  className = '',
  disabled = false
}: GlassButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`backdrop-blur-md transition-all duration-300 rounded-xl px-5 py-3 border shadow-lg ${variantStyles[variant]} ${className}`}
    >
      <span className="text-white font-medium">{children}</span>
    </button>
  );
}

