'use client';

import React from 'react';
import { Button } from './Button';

interface TelegramLoginProps {
  onLogin: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({
  onLogin,
  disabled = false,
 size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };

  const handleClick = () => {
    if (!disabled) {
      onLogin();
    }
  };

 return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center space-x-2 ${sizeClasses[size]}`}
      variant={variant}
      style={{
        background: 'linear-gradient(45deg, #2AABEE, #229ED9)',
        border: 'none'
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
          fill="white"
        />
        <path
          d="M17.9 11.8L8.4 7.5C8.1 7.4 7.8 7.5 7.7 7.8L6 14L9.8 11.5L14.8 14.9C15.1 15.1 15.4 15 15.5 14.7L17.2 12.1C17.3 12 17.9 11.8 17.9 11.8Z"
          fill="#2AABEE"
        />
      </svg>
      <span>Войти через Telegram</span>
    </Button>
  );
};

export { TelegramLogin };