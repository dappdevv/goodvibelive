'use client';

import React from 'react';

interface PlayButtonProps {
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  onClick,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <button
      onClick={onClick}
      className={`
        absolute inset-0 m-auto
        ${sizeClasses[size]}
        rounded-full bg-white/90 hover:bg-white
        shadow-lg hover:shadow-xl
        flex items-center justify-center
        transition-all duration-300 hover:scale-110
        ${className}
      `}
      aria-label="Play"
    >
      <svg
        className={`${iconSizeClasses[size]} text-blue-600 fill-current ml-0.5`}
        viewBox="0 0 24 24"
      >
        <path d="M5 3v18l15-9L5 3z" />
      </svg>
    </button>
  );
};

export default PlayButton;
