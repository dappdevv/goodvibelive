'use client';

import Header from '@/components/layout/Header';
import BottomBar from '@/components/layout/BottomBar';
import FeedSection from '@/components//feed/FeedSection';
import MediaGrid from '@/components/feed/MediaGrid';
import { useState } from 'react';

// Mock data для демонстрации
const mockImages = [
  { id: '1', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
  { id: '2', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
  { id: '3', src: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop' },
];

const mockVideos = [
  { id: '1', src: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop', title: 'Video 1' },
  { id: '2', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', title: 'Video 2' },
  { id: '3', src: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=400&fit=crop', title: 'Creative Writing' },
];

const mockPosts = [
  { id: '1', src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop', label: 'Adventure Travels' },
  { id: '2', src: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', label: 'Creative Writing' },
  { id: '3', src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop', label: 'Tech Innovations' },
];

const mockTracks = [
  { id: '1', title: 'Music #1', genre: 'Deep House' },
  { id: '2', title: 'Deep House', genre: 'Electronic' },
];

export default function Home() {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {/* Generated Images Section */}
        <FeedSection title="Generated Images">
          <MediaGrid items={mockImages} type="image" />
        </FeedSection>

        {/* Generated Videos Section */}
        <FeedSection title="User's generated Video">
          <MediaGrid items={mockVideos} type="video" />
        </FeedSection>

        {/* User Posts Section */}
        <FeedSection title="Users Posts">
          <MediaGrid items={mockPosts} type="post" />
        </FeedSection>

        {/* Music Section */}
        <FeedSection title="Adser's generated music" icon="🎵">
          <div className="px-4 space-y-2">
            {mockTracks.map((track) => (
              <div key={track.id} className="flex items-center gap-3 bg-white p-4 rounded-xl">
                <button
                  onClick={() => setIsPlaying(isPlaying === track.id ? null : track.id)}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition"
                >
                  <span className="text-lg">{isPlaying === track.id ? '⏸' : '▶'}</span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{track.title}</p>
                  <p className="text-sm text-gray-500">{track.genre}</p>
                </div>
                <button className="flex-shrink-0 text-gray-400 hover:text-red-500">❤</button>
                <button className="flex-shrink-0 text-gray-400 hover:text-gray-600">🖤</button>
              </div>
            ))}
          </div>
        </FeedSection>
      </main>

      {/* Bottom Bar */}
      <BottomBar />
    </div>
  );
}
