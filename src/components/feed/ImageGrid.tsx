import React, { useState, useEffect } from 'react';
import { MediaCard } from '../shared/MediaCard';
import { feedApi, FeedPost } from '../../lib/api/feed';

interface ImageGridProps {
  columns?: number;
  gap?: string;
  userId?: string; // Optional user ID to fetch user's images
  limit?: number;
  onClick?: (item: FeedPost) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  columns = 3,
  gap = 'gap-4',
  userId,
  limit = 12,
  onClick
}) => {
  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        let response;

        if (userId) {
          // Fetch images for a specific user
          response = await feedApi.getUserPosts(userId, {
            content_type: 'image',
            limit: limit
          });
        } else {
          // Fetch images from all users
          response = await feedApi.getFeed({
            content_type: 'image',
            limit: limit
          });
        }

        if (response.error) {
          throw new Error(response.error.message);
        }

        setItems(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [userId, limit]);

  const handleLike = async (postId: string) => {
    try {
      const item = items.find(item => item.id === postId);
      if (!item) return;

      const response = await feedApi.toggleLike(postId);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === postId
            ? { ...item, is_liked: response.data?.is_liked || false, likes_count: response.data?.likes_count || 0 }
            : item
        )
      );
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const item = items.find(item => item.id === postId);
      if (!item) return;

      const response = await feedApi.toggleBookmark(postId);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === postId
            ? { ...item, is_bookmarked: response.data?.is_bookmarked || false }
            : item
        )
      );
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleItemClick = (item: FeedPost) => {
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
            type="image"
            src={item.content_url}
            alt={item.title || item.description || 'Image'}
            title={item.title}
            description={item.description}
            isLiked={item.is_liked}
            isBookmarked={item.is_bookmarked}
            likesCount={item.likes_count}
            onLike={() => handleLike(item.id)}
            onBookmark={() => handleBookmark(item.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;