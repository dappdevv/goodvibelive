'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { authApi } from '@/src/lib/api/auth';

interface TelegramLoginProps {
  onLogin?: (user: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
 size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({
  onLogin,
  onError,
  disabled = false,
  size = 'md',
  variant = 'default'
}) => {
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };

  const handleClick = async () => {
    if (disabled || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Инициируем процесс аутентификации через Telegram
      // Для этого создаем временное окно/всплывающее окно для аутентификации
      const telegramAuthWindow = window.open(
        `https://oauth.telegram.org/auth?bot_id=${process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID}&origin=${window.location.origin}&request_access=write`,
        'telegram_auth',
        'width=500,height=500'
      );

      if (!telegramAuthWindow) {
        throw new Error('Не удалось открыть окно аутентификации Telegram. Пожалуйста, разрешите всплывающие окна для этого сайта.');
      }

      // Ожидаем сообщение от окна аутентификации
      const authResult = await new Promise<any>((resolve, reject) => {
        const handleAuthMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'telegram_auth_success') {
            window.removeEventListener('message', handleAuthMessage);
            resolve(event.data.authData);
          } else if (event.data.type === 'telegram_auth_error') {
            window.removeEventListener('message', handleAuthMessage);
            reject(new Error(event.data.error || 'Ошибка аутентификации через Telegram'));
          }
        };

        window.addEventListener('message', handleAuthMessage);

        // Таймаут ожидания аутентификации
        setTimeout(() => {
          window.removeEventListener('message', handleAuthMessage);
          reject(new Error('Таймаут аутентификации через Telegram'));
        }, 120000); // 2 минуты таймаут
      });

      // Используем API для аутентификации с полученными данными
      const result = await authApi.loginWithTelegram(authResult);

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data) {
        // Вызываем callback с данными пользователя
        if (onLogin) {
          onLogin(result.data.user);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка при входе через Telegram';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      console.error('Telegram login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`w-full flex items-center justify-center space-x-2 ${sizeClasses[size]}`}
        variant={variant}
        style={{
          background: isLoading ? '#cccccc' : 'linear-gradient(45deg, #2AABEE, #229ED9)',
          border: 'none'
        }}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Вход...</span>
          </>
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 12 2Z"
                fill="white"
              />
              <path
                d="M17.9 11.8L8.4 7.5C8.1 7.4 7.8 7.5 7.7 7.8L6 14L9.8 1.5L14.8 14.9C15.1 15.1 15.4 15 15.5 14.7L17.2 12.1C17.3 12 17.9 11.8 17.9 11.8Z"
                fill="#2AABEE"
              />
            </svg>
            <span>Войти через Telegram</span>
          </>
        )}
      </Button>
      {error && (
        <div className="mt-2 text-sm text-red-500 text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export { TelegramLogin };