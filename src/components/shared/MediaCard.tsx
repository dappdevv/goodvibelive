import React from 'react';
import { PlayButton } from '../ui/PlayButton';
import { Badge } from '../ui/Badge';

interface MediaCardProps {
  type: 'image' | 'video' | 'post' | 'music';
  src?: string;
  alt?: string;
  title?: string;
  description?: string;
  artist?: string;
  album?: string;
 duration?: string;
 tags?: string[];
  date?: string;
  showPlayButton?: boolean;
  onClick?: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({
  type,
  src,
  alt = 'Media thumbnail',
  title,
  description,
  artist,
  album,
  duration,
  tags,
  date,
  showPlayButton = false,
  onClick
}) => {
  const renderCardContent = () => {
    switch (type) {
      case 'image':
        return (
          <div className="relative group">
            <img 
              src={src} 
              alt={alt} 
              className="w-full h-auto rounded-lg object-cover transition-transform duration-30 group-hover:scale-105"
              onClick={onClick}
            />
            {showPlayButton && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <PlayButton size="large" />
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="relative group">
            <img 
              src={src} 
              alt={alt} 
              className="w-full h-auto rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
              onClick={onClick}
            />
            {duration && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {duration}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <PlayButton size="large" />
            </div>
          </div>
        );
      case 'post':
        return (
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={onClick}>
            {src && (
              <img 
                src={src} 
                alt={alt} 
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1">{title}</h3>
              {description && <p className="text-gray-600 text-sm mb-2">{description}</p>}
              {date && <p className="text-gray-400 text-xs mb-2">{date}</p>}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'music':
        return (
          <div className="flex items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300 cursor-pointer" onClick={onClick}>
            {src ? (
              <img 
                src={src} 
                alt={alt} 
                className="w-16 h-16 rounded object-cover mr-4"
              />
            ) : (
              <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center mr-4">
                <span className="text-gray-500">🎵</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{title}</h4>
              {artist && <p className="text-gray-600 text-sm truncate">{artist}</p>}
              {album && <p className="text-gray-500 text-xs truncate">{album}</p>}
            </div>
            {duration && <span className="text-gray-500 text-sm ml-2">{duration}</span>}
            {showPlayButton && <PlayButton size="small" className="ml-2" />}
          </div>
        );
      default:
        return null;
    }
  };

  return renderCardContent();
};

export default MediaCard;