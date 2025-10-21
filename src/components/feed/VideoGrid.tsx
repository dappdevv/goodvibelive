import React from 'react';
import { MediaCard } from '../shared/MediaCard';

interface VideoItem {
  id: string;
  src: string;
  thumbnail: string;
  title?: string;
  duration?: string;
 onClick?: (item: VideoItem) => void;
}

interface VideoGridProps {
  items: VideoItem[];
  columns?: number;
  gap?: string;
  onClick?: (item: VideoItem) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  items, 
  columns = 3, 
  gap = 'gap-4', 
  onClick 
}) => {
  const handleItemClick = (item: VideoItem) => {
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
            type="video"
            src={item.thumbnail}
            alt={item.title}
            title={item.title}
            duration={item.duration}
          />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;