import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  shimmer?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  children,
  icon,
  shimmer,
  className = '',
  ...props
}) => {
  const isShimmerEnabled = shimmer ?? (variant === 'primary' || variant === 'gold');
  const baseStyles = 'relative overflow-hidden inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5 shadow-md',
  };

  const variantStyles = {
    primary: 'bg-primary-container hover:brightness-105 text-on-primary-container shadow-md shadow-primary-container/20',
    secondary: 'bg-tertiary-container hover:brightness-105 text-on-tertiary-container shadow-md shadow-tertiary-container/20',
    outline: 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/60 dark:bg-surface-container-low dark:border-outline-variant',
    gold: 'bg-secondary-container hover:brightness-105 text-on-secondary-container shadow-md shadow-secondary-container/20',
    ghost: 'bg-transparent hover:bg-surface-container text-on-surface-variant shadow-none border-0',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Light Beam Shimmer Effect */}
      {isShimmerEnabled && (
        <span
          className="absolute inset-0 pointer-events-none w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-btn-shimmer"
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0 relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
};
