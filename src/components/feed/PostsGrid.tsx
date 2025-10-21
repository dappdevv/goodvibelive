import React from 'react';
import { MediaCard } from '../shared/MediaCard';

interface PostItem {
  id: string;
  src: string;
  title: string;
  description?: string;
  tags?: string[];
  date?: string;
  onClick?: (item: PostItem) => void;
}

interface PostsGridProps {
  items: PostItem[];
  columns?: number;
  gap?: string;
  onClick?: (item: PostItem) => void;
}

const PostsGrid: React.FC<PostsGridProps> = ({ 
  items, 
  columns = 2, 
  gap = 'gap-6', 
  onClick 
}) => {
  const handleItemClick = (item: PostItem) => {
    if (onClick) {
      onClick(item);
    }
  };

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
            src={item.src}
            alt={item.title}
            title={item.title}
            description={item.description}
            tags={item.tags}
            date={item.date}
          />
        </div>
      ))}
    </div>
  );
};

export default PostsGrid;