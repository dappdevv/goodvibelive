'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRightIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { feedApi, FeedPost, GetFeedParams } from '../../lib/api/feed';
import { MediaCard } from '../shared/MediaCard';

interface FeedSectionProps {
 title: string;
 icon?: React.ReactNode;
 onViewAll?: () => void;
 className?: string;
 feedType?: 'image' | 'video' | 'audio' | 'text';
 initialLimit?: number;
}

export const FeedSection: React.FC<FeedSectionProps> = ({
 title,
 icon,
 onViewAll,
 className = '',
 feedType,
 initialLimit = 10,
}) => {
 const [feedItems, setFeedItems] = useState<FeedPost[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [hasMore, setHasMore] = useState(true);
 const [offset, setOffset] = useState(0);
 const [isFetchingMore, setIsFetchingMore] = useState(false);
 const [expanded, setExpanded] = useState(false);

 const fetchFeed = async (reset = false) => {
   try {
     if (reset) {
       setLoading(true);
     } else if (!reset && offset > 0) {
       setIsFetchingMore(true);
     }

     const params: GetFeedParams = {
       content_type: feedType,
       limit: initialLimit,
       offset: reset ? 0 : offset,
     };

     const response = await feedApi.getFeed(params);
     if (response.error) {
       throw new Error(response.error.message);
     }

     if (response.data) {
       setFeedItems(prev => reset ? response.data! : [...prev, ...response.data!]);
       setHasMore(response.data!.length === initialLimit);
     }
   } catch (err) {
     setError(err instanceof Error ? err.message : 'Failed to load feed');
   } finally {
     setLoading(false);
     setIsFetchingMore(false);
   }
 };

 useEffect(() => {
   setOffset(0);
   fetchFeed(true);
 }, [feedType, initialLimit]);

 const loadMore = () => {
   setOffset(prev => prev + initialLimit);
 };

 useEffect(() => {
   if (offset > 0) {
     fetchFeed();
   }
 }, [offset]);

 const handleLike = async (postId: string) => {
   try {
     const response = await feedApi.toggleLike(postId);
     if (response.error) {
       throw new Error(response.error.message);
     }
     
     if (response.data) {
       setFeedItems(prevItems =>
         prevItems.map(item =>
           item.id === postId
             ? { ...item, is_liked: response.data!.is_liked, likes_count: response.data!.likes_count }
             : item
         )
       );
     }
   } catch (err) {
     console.error('Failed to toggle like:', err);
   }
 };

 const handleBookmark = async (postId: string) => {
   try {
     const response = await feedApi.toggleBookmark(postId);
     if (response.error) {
       throw new Error(response.error.message);
     }
     
     if (response.data) {
       setFeedItems(prevItems =>
         prevItems.map(item =>
           item.id === postId
             ? { ...item, is_bookmarked: response.data!.is_bookmarked }
             : item
         )
       );
     }
   } catch (err) {
     console.error('Failed to toggle bookmark:', err);
   }
 };

 if (loading && feedItems.length === 0) {
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
       <div className="text-red-50">Error: {error}</div>
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
         <>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {feedItems.map((item) => (
               <div
                 key={item.id}
                 className="cursor-pointer"
               >
                 <MediaCard
                   type={item.content_type === 'text' ? 'post' : item.content_type}
                   src={item.content_url}
                   alt={item.title || item.description?.substring(0, 50) + '...'}
                   title={item.title}
                   description={item.description}
                   duration={item.content_type === 'video' ? '0:30' : undefined}
                   tags={item.tags}
                   date={item.created_at}
                   isLiked={item.is_liked}
                   isBookmarked={item.is_bookmarked}
                   likesCount={item.likes_count}
                   onLike={() => handleLike(item.id)}
                   onBookmark={() => handleBookmark(item.id)}
                   onClick={() => console.log('Item clicked:', item.id)}
                 />
               </div>
             ))}
           </div>
           
           {hasMore && (
             <div className="mt-6 text-center">
               {isFetchingMore ? (
                 <div className="flex justify-center">
                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                 </div>
               ) : (
                 <button
                   onClick={loadMore}
                   className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                   Load More
                 </button>
               )}
             </div>
           )}
         </>
       ) : (
         <p className="text-gray-500">No items in feed</p>
       )}
     </div>
   </section>
 );
};

export default FeedSection;