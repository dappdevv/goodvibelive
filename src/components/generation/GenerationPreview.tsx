'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PlayButton } from '../ui/PlayButton';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface GenerationPreviewProps {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'music' | 'video' | 'text';
  thumbnail: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  onPlay?: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
}

const GenerationPreview: React.FC<GenerationPreviewProps> = ({
  id,
  title,
  description,
  type,
  thumbnail,
  creator,
  status,
  progress = 0,
  onPlay,
  onRetry,
  onCancel
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTypeColor = () => {
    switch (type) {
      case 'image': return 'bg-purple-500';
      case 'music': return 'bg-blue-500';
      case 'video': return 'bg-red-500';
      case 'text': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending': return 'В ожидании';
      case 'processing': return 'Обработка';
      case 'completed': return 'Завершено';
      case 'failed': return 'Ошибка';
      default: return '';
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">Обработка...</p>
            <p className="text-white text-sm mt-2">{progress}%</p>
            <div className="w-48 h-2 bg-gray-700 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {onCancel && (
              <Button 
                onClick={onCancel} 
                variant="outline" 
                className="mt-4 text-white border-white hover:bg-white hover:text-black"
              >
                Отменить
              </Button>
            )}
          </div>
        );
      case 'failed':
        return (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
            <div className="text-red-50 text-4xl mb-2">❌</div>
            <p className="text-white text-lg">Ошибка генерации</p>
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                className="mt-4 text-white border-white hover:bg-white hover:text-black"
              >
                Повторить
              </Button>
            )}
          </div>
        );
      case 'completed':
        return (
          <div 
            className={`absolute inset-0 flex items-center justify-center z-10 opacity-0 transition-opacity duration-300 ${
              isHovered ? 'opacity-10' : ''
            }`}
          >
            <PlayButton onClick={onPlay} size="large" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      className="relative overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {renderContent()}
        <div className="absolute top-2 left-2">
          <Badge className={getTypeColor()}>
            {type === 'image' ? 'Изображение' : 
             type === 'music' ? 'Музыка' : 
             type === 'video' ? 'Видео' : 'Текст'}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <Badge className={`${getStatusColor()} text-white`}>
            {getStatusText()}
          </Badge>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 truncate">{title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar src={creator.avatar} alt={creator.name} size="sm" />
            <span className="text-sm font-medium">{creator.name}</span>
          </div>
          
          {status === 'completed' && onPlay && (
            <Button onClick={onPlay} variant="outline" size="sm">
              Воспроизвести
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export { GenerationPreview };