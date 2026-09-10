import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'amber' | 'emerald' | 'rose' | 'sky' | 'purple' | 'dark';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/40',
    amber: 'bg-secondary-container/30 text-on-secondary-container border-secondary-container/50',
    emerald: 'bg-tertiary-container/30 text-on-tertiary-container border-tertiary-container/50',
    rose: 'bg-primary-container/20 text-on-primary-container border-primary-container/40',
    sky: 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
    purple: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
    dark: 'bg-surface-container-highest text-on-surface border-outline-variant',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
