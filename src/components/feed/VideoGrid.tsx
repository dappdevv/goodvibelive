import React, { useState, useEffect } from 'react';
import { MediaCard } from '../shared/MediaCard';
import { feedApi, FeedPost } from '../../lib/api/feed';

interface VideoGridProps {
  columns?: number;
  gap?: string;
  userId?: string; // Optional user ID to fetch user's videos
  limit?: number;
  onClick?: (item: FeedPost) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({
  columns = 3,
 gap = 'gap-4',
 userId,
  limit = 12,
  onClick
}) => {
  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          content_type: 'video' as const,
          limit: limit,
          offset: offset
        };

        let response;
        if (userId) {
          // Fetch videos for a specific user
          response = await feedApi.getUserPosts(userId, params);
        } else {
          // Fetch videos from all users
          response = await feedApi.getFeed(params);
        }

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (response.data) {
          if (offset === 0) {
            setItems(response.data);
          } else {
            setItems(prevItems => [...prevItems, ...response.data!]);
          }
          // Check if we got less items than requested, meaning no more data
          setHasMore(response.data.length === limit);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [userId, limit, offset]);

  const handleLike = async (postId: string) => {
    try {
      const item = items.find(item => item.id === postId);
      if (!item) return;

      const response = await feedApi.toggleLike(postId);
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data) {
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === postId
              ? { ...item, is_liked: response.data!.is_liked, likes_count: response.data!.likes_count }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      setError(err instanceof Error ? err.message : 'Failed to update like');
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

      if (response.data) {
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === postId
              ? { ...item, is_bookmarked: response.data!.is_bookmarked }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bookmark');
    }
  };

  const handleItemClick = (item: FeedPost) => {
    if (onClick) {
      onClick(item);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setOffset(prevOffset => prevOffset + limit);
    }
  };

  // Reset pagination when userId changes
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
  }, [userId]);

  if (loading && items.length === 0) {
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
      <div className={`grid grid-cols-${columns} ${gap} w-full`}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="cursor-pointer"
          >
            <MediaCard
              type="video"
              src={item.content_url}
              alt={item.title || item.description || 'Video thumbnail'}
              title={item.title}
              duration={item.content_type === 'video' ? '0:30' : undefined}
              isLiked={item.is_liked}
              isBookmarked={item.is_bookmarked}
              likesCount={item.likes_count}
              onLike={() => handleLike(item.id)}
              onBookmark={() => handleBookmark(item.id)}
            />
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;