'use client';

import React from 'react';
import { Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  genre?: string;
  duration?: number;
  liked?: boolean;
  favorited?: boolean;
}

interface MusicListProps {
  tracks: MusicTrack[];
  onPlay?: (trackId: string) => void;
  onLike?: (trackId: string) => void;
  onFavorite?: (trackId: string) => void;
}

export function MusicList({
  tracks,
  onPlay,
  onLike,
  onFavorite,
}: MusicListProps) {
  return (
    <div className="space-y-3">
      {tracks.map((track) => (
        <div
          key={track.id}
          className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
        >
          <button
            onClick={() => onPlay?.(track.id)}
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
          >
            <svg
              className="w-5 h-5 text-white ml-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">
              {track.title}
            </h4>
            {track.genre && (
              <p className="text-sm text-gray-500 truncate">
                {track.genre}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onLike?.(track.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Heart
                size={20}
                className={track.liked ? 'fill-red-500 text-red-500' : ''}
              />
            </button>
            <button
              onClick={() => onFavorite?.(track.id)}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Heart
                size={20}
                className={track.favorited ? 'fill-blue-500 text-blue-500' : ''}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
