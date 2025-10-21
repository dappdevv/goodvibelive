import React, { useEffect } from 'react';
import { Button } from './Button';

interface TelegramLoginProps {
  botUsername: string;
 onSuccess?: (userData: TelegramUserPayload) => void;
  onError?: (error: string) => void;
  size?: 'small' | 'large';
  requestAccess?: 'read' | 'write';
}

type TelegramUserPayload = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

declare global {
  interface Window {
    Telegram?: unknown;
    onTelegramAuth?: (user: TelegramUserPayload) => void;
  }
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({
  botUsername,
  onSuccess,
  onError,
  size = 'large',
  requestAccess = 'write'
}) => {
  useEffect(() => {
    // Удаляем предыдущий скрипт, если он был
    const existingScript = document.querySelector('script[data-telegram-login]');
    if (existingScript) {
      existingScript.remove();
    }

    // Telegram Login Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.dataset.telegramLogin = botUsername;
    script.dataset.size = size;
    script.dataset.userpic = 'true';
    script.dataset.requestAccess = requestAccess;
    script.dataset.authUrl = `${window.location.origin}/api/telegram/callback`;
    
    // Обработчик успешной авторизации
    window.onTelegramAuth = (user: TelegramUserPayload) => {
      if (onSuccess) {
        onSuccess(user);
      }
    };
    
    const container = document.getElementById('tg-login-container');
    if (container) {
      container.appendChild(script);
    }

    // Очистка при размонтировании
    return () => {
      try {
        if (container && script.parentElement === container) {
          container.removeChild(script);
        }
        delete window.onTelegramAuth;
      } catch (e) {
        if (onError) {
          onError('Ошибка при очистке виджета Telegram Login');
        }
      }
    };
  }, [botUsername, onSuccess, onError, size, requestAccess]);

  return (
    <div className="flex flex-col items-center">
      <div id="tg-login-container" />
      <div className="text-xs text-gray-500 mt-2 text-center">
        Авторизуйтесь через Telegram
      </div>
    </div>
  );
};

export { TelegramLogin, TelegramUserPayload };