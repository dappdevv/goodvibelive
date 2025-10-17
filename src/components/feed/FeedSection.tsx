'use client';

import React from 'react';
import { ChevronRightIcon } from '@radix-ui/react-icons';

interface FeedSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onViewAll?: () => void;
  className?: string;
}

export const FeedSection: React.FC<FeedSectionProps> = ({
  title,
  icon,
  children,
  onViewAll,
  className = '',
}) => {
  return (
    <section className={`px-4 py-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All
            <ChevronRightIcon />
          </button>
        )}
      </div>
      <div>
        {children}
      </div>
    </section>
  );
};

export default FeedSection;
