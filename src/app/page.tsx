'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import BottomBar from '@/components/layout/BottomBar';
import FeedSection from '@/components/feed/FeedSection';
import MediaGrid from '@/components/feed/MediaGrid';
import MusicList from '@/components/feed/MusicList';

// Mock data типы
interface MediaItem {
  id: string;
  src: string;
  title?: string;
  type: 'image' | 'video' | 'post';
}

interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  genre: string;
  duration: number;
  url?: string;
  liked?: boolean;
  favorited?: boolean;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [generatedImages, setGeneratedImages] = useState<MediaItem[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<MediaItem[]>([]);
  const [userPosts, setUserPosts] = useState<MediaItem[]>([]);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);

  // Инициализация mock данных
  useEffect(() => {
    // Имитируем загрузку данных
    const timer = setTimeout(() => {
      setGeneratedImages([
        {
          id: '1',
          src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
          type: 'image',
        },
        {
          id: '2',
          src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          type: 'image',
        },
        {
          id: '3',
          src: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=400&h=400&fit=crop',
          type: 'image',
        },
      ]);

      setGeneratedVideos([
        {
          id: 'v1',
          src: 'https://images.unsplash.com/photo-1495566969349-c978a2b80cf5?w=400&h=400&fit=crop',
          type: 'video',
        },
        {
          id: 'v2',
          src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
          type: 'video',
        },
        {
          id: 'v3',
          src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=400&fit=crop',
          title: 'Creative Writing',
          type: 'video',
        },
      ]);

      setUserPosts([
        {
          id: 'p1',
          src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
          title: 'Adventure Travels',
          type: 'post',
        },
        {
          id: 'p2',
          src: 'https://images.unsplash.com/photo-1507842721343-583f20270319?w=400&h=400&fit=crop',
          title: 'Creative Writing',
          type: 'post',
        },
        {
          id: 'p3',
          src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop',
          title: 'Tech Innovations',
          type: 'post',
        },
      ]);

      setMusicTracks([
        {
          id: 'm1',
          title: 'Music #1',
          genre: 'Deep House',
          duration: 240,
          liked: false,
          favorited: false,
        },
        {
          id: 'm2',
          title: 'Deep House',
          genre: 'Electronic',
          duration: 180,
          liked: true,
          favorited: false,
        },
      ]);

      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
            {/* Generated Images Section */}
            <FeedSection title="Generated Images">
              <MediaGrid items={generatedImages} />
            </FeedSection>

            {/* Generated Videos Section */}
            <FeedSection title="User's generated Video">
              <MediaGrid items={generatedVideos} showPlayButton={true} />
            </FeedSection>

            {/* User Posts Section */}
            <FeedSection title="Users Posts">
              <MediaGrid items={userPosts} showOverlay={true} />
            </FeedSection>

            {/* Generated Music Section */}
            <FeedSection title="Adser's generated music">
              <MusicList tracks={musicTracks} />
            </FeedSection>
          </div>
        )}
      </div>

      {/* Bottom AI Search Bar */}
      <BottomBar />
    </div>
  );
}
