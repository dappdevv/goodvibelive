import React from 'react';
import { MediaCard } from '../shared/MediaCard';

interface ImageItem {
  id: string;
  src: string;
  alt?: string;
  title?: string;
  onClick?: (item: ImageItem) => void;
}

interface ImageGridProps {
  items: ImageItem[];
  columns?: number;
  gap?: string;
  onClick?: (item: ImageItem) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ 
  items, 
  columns = 3, 
  gap = 'gap-4', 
  onClick 
}) => {
 const handleItemClick = (item: ImageItem) => {
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
            type="image"
            src={item.src}
            alt={item.alt}
            title={item.title}
          />
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;