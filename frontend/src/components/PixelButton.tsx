import React from 'react';

interface PixelButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function PixelButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: PixelButtonProps) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };

  const variantClass = variant === 'secondary' ? 'pixel-btn-secondary' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`pixel-btn ${variantClass} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}
