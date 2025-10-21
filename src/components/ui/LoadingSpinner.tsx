import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = '',
  label
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-blue-500',
    secondary: 'text-gray-500',
    accent: 'text-purple-500'
  };

  const spinnerClass = `animate-spin rounded-full border-4 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={spinnerClass} role="status" aria-label={label || "Загрузка"}>
        <span className="sr-only">{label || "Загрузка"}</span>
      </div>
      {label && <span className="mt-2 text-sm text-gray-600">{label}</span>}
    </div>
  );
};

export default LoadingSpinner;