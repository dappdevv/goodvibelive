'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  trigger, 
  children, 
  className = '' 
}) => {
 const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрываем меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div 
          className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 ${className}`}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface DropdownMenuItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  onClick, 
  children, 
  className = '',
  disabled = false 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      role="menuitem"
    >
      {children}
    </button>
  );
};

interface DropdownMenuSeparatorProps {
  className?: string;
}

const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ 
  className = '' 
}) => {
  return <div className={`border-t border-gray-200 my-1 ${className}`} />;
};

export { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator };