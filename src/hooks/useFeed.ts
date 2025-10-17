'use client';

import { useQuery } from '@tanstack/react-query';

export interface FeedItem {
  id: string;
  type: 'image' | 'video' | 'music' | 'post';
  url: string;
  title?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  likes: number;
  favorites: number;
  views?: number;
  duration?: number;
  genre?: string;
  overlay?: string;
}

interface FeedResponse {
  images: FeedItem[];
  videos: FeedItem[];
  posts: FeedItem[];
  music: FeedItem[];
}

export const useFeed = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const response = await fetch('/api/feed');
      if (!response.ok) throw new Error('Failed to fetch feed');
      return response.json() as Promise<FeedResponse>;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data || { images: [], videos: [], posts: [], music: [] },
    isLoading,
    error,
    refetch,
  };
};
