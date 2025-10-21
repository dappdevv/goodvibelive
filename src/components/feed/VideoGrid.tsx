import React, { useState, useEffect } from 'react';
import { MediaCard } from '../shared/MediaCard';
import { feedClient, FeedItem } from '../../lib/api/feed';

interface VideoGridProps {
  columns?: number;
  gap?: string;
  userId?: string; // Optional user ID to fetch user's videos
  limit?: number;
  onClick?: (item: FeedItem) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  columns = 3, 
 gap = 'gap-4', 
 userId,
  limit = 12,
  onClick 
}) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        let response;

        if (userId) {
          // Fetch videos for a specific user
          response = await feedClient.getUserFeed(userId, { 
            type: 'video',
            limit: limit 
          });
        } else {
          // Fetch videos from all users
          response = await feedClient.getFeed({ 
            type: 'video',
            limit: limit 
          });
        }

        setItems(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
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
    <div className={`grid grid-cols-${columns} ${gap} w-full`}>
      {items.map((item) => (
        <div 
          key={item.id} 
          onClick={() => handleItemClick(item)}
          className="cursor-pointer"
        >
          <MediaCard
            type="video"
            src={item.thumbnail_url || item.url}
            alt={item.title || item.content.substring(0, 50) + '...'}
            title={item.title}
            duration={item.type === 'video' ? '0:30' : undefined}
          />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;