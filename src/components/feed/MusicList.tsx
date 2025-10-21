import React, { useState, useEffect } from 'react';
import { MediaCard } from '../shared/MediaCard';
import { feedClient, FeedItem } from '../../lib/api/feed';

interface MusicListProps {
  userId?: string; // Optional user ID to fetch user's music
  limit?: number;
  onClick?: (item: FeedItem) => void;
}

const MusicList: React.FC<MusicListProps> = ({ 
  userId,
  limit = 10,
  onClick 
}) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
    const fetchMusic = async () => {
      try {
        setLoading(true);
        let response;

        if (userId) {
          // Fetch music for a specific user
          response = await feedClient.getUserFeed(userId, { 
            type: 'music',
            limit: limit 
          });
        } else {
          // Fetch music from all users
          response = await feedClient.getFeed({ 
            type: 'music',
            limit: limit 
          });
        }

        setItems(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load music');
      } finally {
        setLoading(false);
      }
    };

    fetchMusic();
  }, [userId, limit]);

  const handleLike = async (feedItemId: string) => {
    try {
      const item = items.find(item => item.id === feedItemId);
      if (!item) return;

      const shouldLike = !item.is_liked;
      const response = await feedClient.toggleLike(feedItemId, shouldLike);
      
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === feedItemId 
            ? { ...item, is_liked: shouldLike, likes_count: response.likes_count } 
            : item
        )
      );
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
 };

  const handleItemClick = (item: FeedItem) => {
    if (onClick) {
      onClick(item);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full">
      {items.map((item, index) => (
        <div 
          key={item.id} 
          onClick={() => handleItemClick(item)}
          className="cursor-pointer mb-4 last:mb-0"
        >
          <MediaCard
            type="music"
            title={item.title || 'Untitled'}
            artist={item.user?.name}
            duration={item.type === 'music' ? '3:45' : undefined}
            src={item.thumbnail_url || item.url}
            alt={`Cover for ${item.title || 'Untitled'}`}
          />
        </div>
      ))}
    </div>
  );
};

export default MusicList;