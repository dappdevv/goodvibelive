import React, { useState, useEffect } from 'react';
import { MediaCard } from '../shared/MediaCard';
import { feedClient, FeedItem } from '../../lib/api/feed';

interface PostsGridProps {
  columns?: number;
  gap?: string;
  userId?: string; // Optional user ID to fetch user's posts
  limit?: number;
  onClick?: (item: FeedItem) => void;
}

const PostsGrid: React.FC<PostsGridProps> = ({ 
  columns = 2, 
 gap = 'gap-6', 
  userId,
  limit = 10,
  onClick 
}) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        let response;

        if (userId) {
          // Fetch posts for a specific user
          response = await feedClient.getUserFeed(userId, { 
            type: 'post',
            limit: limit 
          });
        } else {
          // Fetch posts from all users
          response = await feedClient.getFeed({ 
            type: 'post',
            limit: limit 
          });
        }

        setItems(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
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
            type="post"
            src={item.thumbnail_url || item.url}
            alt={item.title || item.content.substring(0, 50) + '...'}
            title={item.title}
            description={item.description}
            date={new Date(item.created_at).toLocaleDateString()}
          />
        </div>
      ))}
    </div>
  );
};

export default PostsGrid;