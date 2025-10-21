'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { feedClient, FeedItem } from '../../lib/api/feed';
import { MediaCard } from '../shared/MediaCard';

interface FeedSectionProps {
  title: string;
  icon?: React.ReactNode;
  onViewAll?: () => void;
  className?: string;
  feedType?: 'post' | 'image' | 'video' | 'music';
  limit?: number;
}

export const FeedSection: React.FC<FeedSectionProps> = ({
  title,
  icon,
  onViewAll,
  className = '',
  feedType,
  limit = 10,
}) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const filters = {
          type: feedType,
          limit: limit,
        };
        const response = await feedClient.getFeed(filters);
        setFeedItems(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feed');
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [feedType, limit]);

  const handleLike = async (feedItemId: string) => {
    try {
      const item = feedItems.find(item => item.id === feedItemId);
      if (!item) return;

      const shouldLike = !item.is_liked;
      const response = await feedClient.toggleLike(feedItemId, shouldLike);
      
      setFeedItems(prevItems => 
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

  if (loading) {
    return (
      <section className={`px-4 py-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && <span className="text-lg">{icon}</span>}
            <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
              <ChevronRightIcon />
            </button>
          )}
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`px-4 py-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && <span className="text-lg">{icon}</span>}
            <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
              <ChevronRightIcon />
            </button>
          )}
        </div>
        <div className="text-red-500">Error: {error}</div>
      </section>
    );
  }

  return (
    <section className={`px-4 py-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All
            <ChevronRightIcon />
          </button>
        )}
      </div>
      <div>
        {feedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedItems.map((item) => (
              <div 
                key={item.id} 
                className="cursor-pointer"
              >
                <MediaCard
                  type={item.type as any}
                  src={item.thumbnail_url || item.url}
                  alt={item.title || item.content.substring(0, 50) + '...'}
                  title={item.title}
                  description={item.description}
                  duration={item.type === 'video' ? '0:30' : undefined}
                  onClick={() => console.log('Item clicked:', item.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No items in feed</p>
        )}
      </div>
    </section>
  );
};

export default FeedSection;