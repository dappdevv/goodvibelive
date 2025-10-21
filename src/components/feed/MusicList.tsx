import React from 'react';
import { MediaCard } from '../shared/MediaCard';

interface MusicItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
 coverImage?: string;
  onClick?: (item: MusicItem) => void;
}

interface MusicListProps {
  items: MusicItem[];
  onClick?: (item: MusicItem) => void;
}

const MusicList: React.FC<MusicListProps> = ({ items, onClick }) => {
  const handleItemClick = (item: MusicItem) => {
    if (onClick) {
      onClick(item);
    }
 };

  return (
    <div className="w-full">
      {items.map((item, index) => (
        <div 
          key={item.id} 
          onClick={() => handleItemClick(item)}
          className="cursor-pointer mb-4 last:mb-0"
        >
          <MediaCard
            type="music"
            title={item.title}
            artist={item.artist}
            album={item.album}
            duration={item.duration}
            src={item.coverImage}
            alt={`Cover for ${item.title}`}
          />
        </div>
      ))}
    </div>
  );
};

export default MusicList;