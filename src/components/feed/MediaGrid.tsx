'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { PlayButton } from '@/components/ui/PlayButton';
import clsx from 'clsx';

export interface MediaItem {
  id: string;
  src: string;
  title?: string;
  subtitle?: string;
  type: 'image' | 'video' | 'post';
  overlay?: React.ReactNode;
  onClick?: () => void;
}

interface MediaGridProps {
  items: MediaItem[];
  columns?: number;
  gap?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function MediaGrid({
  items,
  columns = 3,
  gap = 'md',
  loading = false,
}: MediaGridProps) {
  const gapClass = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }[gap];

  const columnClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={clsx('grid', columnClass, gapClass)}>
      {items.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
      {loading && (
        <>
          <MediaCardSkeleton />
          <MediaCardSkeleton />
          <MediaCardSkeleton />
        </>
      )}
    </div>
  );
}

interface MediaCardProps {
  item: MediaItem;
}

function MediaCard({ item }: MediaCardProps) {
  return (
    <Card
      className="group relative overflow-hidden bg-gray-200 aspect-square cursor-pointer hover:shadow-lg transition-shadow"
      onClick={item.onClick}
    >
      <img
        src={item.src}
        alt={item.title || 'Media'}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />

      {item.type === 'video' && <PlayButton />}

      {item.type === 'post' && item.title && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
          <span className="text-white font-semibold text-sm">{item.title}</span>
        </div>
      )}

      {item.overlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.overlay}
        </div>
      )}
    </Card>
  );
}

function MediaCardSkeleton() {
  return (
    <Card className="aspect-square bg-gray-300 animate-pulse rounded-2xl" />
  );
}
