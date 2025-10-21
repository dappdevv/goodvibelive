import React, { useState, useEffect } from 'react';
import { MediaCard } from '../shared/MediaCard';
import { feedClient, FeedItem } from '../../lib/api/feed';

interface PostsGridProps {
  columns?: number;
  gap?: string;
  userId?: string; // Optional user ID to fetch user's posts
 limit?: number;
  onClick?: (item: FeedItem) => void;
  enablePagination?: boolean; // Whether to enable pagination
}

const PostsGrid: React.FC<PostsGridProps> = ({
  columns = 2,
 gap = 'gap-6',
 userId,
  limit = 10,
  onClick,
  enablePagination = false
}) => {
 const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchPosts = async (reset: boolean = true) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const currentOffset = reset ? 0 : offset;
        let response;

        if (userId) {
          // Fetch posts for a specific user
          response = await feedClient.getUserFeed(userId, {
            content_type: 'text',
            limit: limit,
            offset: currentOffset
          });
        } else {
          // Fetch posts from all users
          response = await feedClient.getFeed({
            content_type: 'text',
            limit: limit,
            offset: currentOffset
          });
        }

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (reset) {
          setItems(response.data || []);
          setOffset(0);
          setHasMore((response.data?.length || 0) === limit);
        } else {
          setItems(prev => [...prev, ...(response.data || [])]);
          setHasMore((response.data?.length || 0) === limit);
          setOffset(prev => prev + limit);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchPosts();
  }, [userId, limit]);

  const handleLike = async (feedItemId: string) => {
    try {
      const item = items.find(item => item.id === feedItemId);
      if (!item) return;

      const shouldLike = !item.is_liked;
      const response = await feedClient.toggleLike(feedItemId);
      
      if (response.data?.success) {
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === feedItemId
              ? { ...item, is_liked: response.data!.is_liked, likes_count: response.data!.likes_count }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleBookmark = async (feedItemId: string) => {
    try {
      const item = items.find(item => item.id === feedItemId);
      if (!item) return;

      const shouldBookmark = !item.is_bookmarked;
      const response = await feedClient.toggleBookmark(feedItemId);
      
      if (response.data?.success) {
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === feedItemId
              ? { ...item, is_bookmarked: response.data!.is_bookmarked }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    
    const fetchPosts = async () => {
      try {
        setLoadingMore(true);

        let response;

        if (userId) {
          // Fetch more posts for a specific user
          response = await feedClient.getUserFeed(userId, {
            content_type: 'text',
            limit: limit,
            offset: offset + limit
          });
        } else {
          // Fetch more posts from all users
          response = await feedClient.getFeed({
            content_type: 'text',
            limit: limit,
            offset: offset + limit
          });
        }

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (response.data && response.data.length > 0) {
          setItems(prev => [...prev, ...response.data!]);
          setOffset(prev => prev + limit);
          setHasMore(response.data!.length === limit);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load more posts');
      } finally {
        setLoadingMore(false);
      }
    };

    fetchPosts();
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
      <div className={`grid grid-cols-${columns} ${gap} w-full`}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="cursor-pointer"
          >
            <MediaCard
              type={item.content_type === 'text' ? 'post' : item.content_type}
              src={item.content_url}
              alt={item.title || (item.description ? item.description.substring(0, 50) + '...' : 'Post')}
              title={item.title}
              description={item.description}
              date={new Date(item.created_at).toLocaleDateString()}
            />
          </div>
        ))}
      </div>

      {enablePagination && hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PostsGrid;