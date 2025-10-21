import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface GenerationPreviewProps {
  imageUrl?: string;
  title?: string;
 description?: string;
 status?: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  onRetry?: () => void;
  onCancel?: () => void;
 onDownload?: () => void;
}

const GenerationPreview: React.FC<GenerationPreviewProps> = ({
  imageUrl,
  title,
  description,
  status = 'pending',
  progress = 0,
  onRetry,
  onCancel,
  onDownload
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return 'Обработка...';
      case 'completed':
        return 'Готово';
      case 'error':
        return 'Ошибка';
      default:
        return 'В ожидании';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title || 'Превью генерации'}</h3>
          <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        
        <div className="relative mb-4">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={title || 'Preview'} 
              className="w-full h-64 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Предварительный просмотр</span>
            </div>
          )}
          
          {status === 'processing' && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="w-4/5 bg-white rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        {status === 'error' && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            Произошла ошибка при генерации контента
          </div>
        )}
        
        <div className="flex space-x-2">
          {status === 'error' && onRetry && (
            <Button onClick={onRetry} variant="outline">Повторить</Button>
          )}
          {status === 'processing' && onCancel && (
            <Button onClick={onCancel} variant="outline">Отменить</Button>
          )}
          {status === 'completed' && onDownload && (
            <Button onClick={onDownload}>Скачать</Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default GenerationPreview;