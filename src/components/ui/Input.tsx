'use client';

import React from 'react';

interface InputProps {
  type?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
 disabled?: boolean;
  required?: boolean;
  className?: string;
  minLength?: number;
  maxLength?: number;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
 className = '',
  minLength,
  maxLength
}) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      minLength={minLength}
      maxLength={maxLength}
      className={`
        ${className}
        w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:bg-gray-100 disabled:cursor-not-allowed
        transition-colors duration-200
      `}
    />
 );
};

export { Input };