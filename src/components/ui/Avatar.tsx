'use client';

import React from 'react';

interface AvatarProps {
 src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  size = 'md',
  className = '',
 fallback
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const renderFallback = () => {
    if (fallback) {
      return (
        <div className={`${sizeClasses[size]} flex items-center justify-center bg-gray-20 text-gray-600 font-medium rounded-full`}>
          {fallback.charAt(0).toUpperCase()}
        </div>
      );
    }
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center bg-gray-200 text-gray-600 font-medium rounded-full`}>
        {alt.charAt(0).toUpperCase() || '?'}
      </div>
    );
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.style.display = 'none';
            if (target.parentNode) {
              target.parentNode.replaceChild(renderFallback().props.children, target);
            }
          }}
        />
      ) : (
        renderFallback()
      )}
    </div>
  );
};

export { Avatar };