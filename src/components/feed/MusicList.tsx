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
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

 // Загружаем музыкальные треки (content_type: 'audio')
  useEffect(() => {
    const fetchMusic = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        const offset = currentPage * limit;

        if (userId) {
          // Fetch music for a specific user
          response = await feedClient.getUserPosts(userId, {
            content_type: 'audio',
            limit: limit,
            offset: offset
          });
        } else {
          // Fetch music from all users
          response = await feedClient.getFeed({
            content_type: 'audio',
            limit: limit,
            offset: offset
          });
        }

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (response.data) {
          if (currentPage === 0) {
            setItems(response.data);
          } else {
            setItems(prevItems => [...prevItems, ...response.data!]);
          }
          
          // Проверяем, есть ли еще данные для пагинации
          setHasMore(response.data.length === limit);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load music');
      } finally {
        setLoading(false);
      }
    };

    fetchMusic();
  }, [userId, limit, currentPage]);

  const handleLike = async (feedItemId: string) => {
    try {
      const item = items.find(item => item.id === feedItemId);
      if (!item) return;

      const response = await feedClient.toggleLike(feedItemId);
      
      if (response.error) {
        console.error('Failed to toggle like:', response.error);
        return;
      }
      
      if (response.data) {
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

      const response = await feedClient.toggleBookmark(feedItemId);
      
      if (response.error) {
        console.error('Failed to toggle bookmark:', response.error);
        return;
      }
      
      if (response.data) {
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

 const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const handleItemClick = (item: FeedItem) => {
    if (onClick) {
      onClick(item);
    }
  };

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
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => handleItemClick(item)}
          className="cursor-pointer mb-4 last:mb-0"
        >
          <MediaCard
            type="music"
            title={item.title || 'Untitled'}
            artist={item.user?.username}
            duration={item.content_type === 'audio' ? '3:45' : undefined}
            src={item.content_url}
            alt={`Cover for ${item.title || 'Untitled'}`}
            isLiked={item.is_liked}
            isBookmarked={item.is_bookmarked}
            onLike={() => handleLike(item.id)}
            onBookmark={() => handleBookmark(item.id)}
          />
        </div>
      ))}
      
      {hasMore && (
        <div className="flex justify-center mt-4">
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

export default MusicList;