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
  isLiked?: boolean;
  isBookmarked?: boolean;
  likesCount?: number;
  onLike?: () => void;
  onBookmark?: () => void;
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
  isLiked = false,
  isBookmarked = false,
  likesCount = 0,
  onLike,
  onBookmark,
  onClick
}) => {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.();
 };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmark?.();
  };

  const renderCardContent = () => {
    switch (type) {
      case 'image':
        return (
          <div className="relative group">
            <img 
              src={src} 
              alt={alt} 
              className="w-full h-auto rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
              onClick={onClick}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <button 
                onClick={handleLikeClick}
                className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
              >
                {isLiked ? '❤️' : '🤍'}
              </button>
              <button 
                onClick={handleBookmarkClick}
                className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
              >
                {isBookmarked ? '🔖' : '📝'}
              </button>
            </div>
            {showPlayButton && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-30">
                <PlayButton size="large" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 text-white text-sm font-medium">
              {likesCount} 👍
            </div>
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
            <div className="absolute top-2 right-2 flex gap-2">
              <button 
                onClick={handleLikeClick}
                className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
              >
                {isLiked ? '❤️' : '🤍'}
              </button>
              <button 
                onClick={handleBookmarkClick}
                className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
              >
                {isBookmarked ? '🔖' : '📝'}
              </button>
            </div>
            {duration && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {duration}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <PlayButton size="large" />
            </div>
            <div className="absolute bottom-2 left-2 text-white text-sm font-medium">
              {likesCount} 👍
            </div>
          </div>
        );
      case 'post':
        return (
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={onClick}>
            {src && (
              <div className="relative">
                <img 
                  src={src} 
                  alt={alt} 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button 
                    onClick={handleLikeClick}
                    className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                  >
                    {isLiked ? '❤️' : '🤍'}
                  </button>
                  <button 
                    onClick={handleBookmarkClick}
                    className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                  >
                    {isBookmarked ? '🔖' : '📝'}
                  </button>
                </div>
              </div>
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
              <div className="mt-2 flex items-center gap-2">
                <button 
                  onClick={handleLikeClick}
                  className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors"
                >
                  {isLiked ? '❤️' : '🤍'} {likesCount}
                </button>
              </div>
            </div>
          </div>
        );
      case 'music':
        return (
          <div className="flex items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300 cursor-pointer" onClick={onClick}>
            {src ? (
              <div className="relative">
                <img 
                  src={src} 
                  alt={alt} 
                  className="w-16 h-16 rounded object-cover mr-4"
                />
                <div className="absolute top-1 right-1">
                  <button 
                    onClick={handleLikeClick}
                    className="p-1 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                  >
                    {isLiked ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center mr-4 relative">
                <span className="text-gray-500">🎵</span>
                <div className="absolute top-1 right-1">
                  <button 
                    onClick={handleLikeClick}
                    className="p-1 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                  >
                    {isLiked ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{title}</h4>
              {artist && <p className="text-gray-600 text-sm truncate">{artist}</p>}
              {album && <p className="text-gray-500 text-xs truncate">{album}</p>}
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-gray-50 text-sm">{duration}</span>
              <button 
                onClick={handleBookmarkClick}
                className="p-1 rounded-full text-gray-600 hover:text-blue-500 transition-colors"
              >
                {isBookmarked ? '🔖' : '📝'}
              </button>
              <button 
                onClick={handleLikeClick}
                className="flex items-center gap-1 text-gray-600 hover:text-red-50 transition-colors"
              >
                {isLiked ? '❤️' : '🤍'} {likesCount}
              </button>
            </div>
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