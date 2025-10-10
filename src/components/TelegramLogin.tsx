"use client";

import { useEffect } from "react";
import useAppStore from "@/store/useAppStore";
import { Button } from "@radix-ui/themes";

type TelegramLoginProps = {
  botUsername: string;
  onSuccess?: (userData: TelegramUserPayload) => void;
};

declare global {
  interface Window {
    Telegram?: unknown;
    onTelegramAuth?: (user: TelegramUserPayload) => void;
  }
}

type TelegramUserPayload = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export default function TelegramLogin({ botUsername, onSuccess }: TelegramLoginProps) {
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    // Telegram Login Widget
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.dataset.telegramLogin = botUsername;
    script.dataset.size = "large";
    script.dataset.userpic = "true";
    script.dataset.radius = "20";
    script.dataset.requestAccess = "write";
    // Используем текущий домен вместо хардкода
    script.dataset.authUrl = window.location.origin;
    
    // Добавляем обработчик успешной авторизации
    window.onTelegramAuth = (user: TelegramUserPayload) => {
      console.log('Telegram auth success:', user);
      if (onSuccess) {
        onSuccess(user);
      } else {
        // Стандартное поведение - обновляем стор
        setUser(user);
      }
    };
    
    const container = document.getElementById("tg-login-container");
    if (container) {
      // Очищаем предыдущий виджет
      container.innerHTML = '';
      container.appendChild(script);
    }

    return () => {
      try {
        if (container && script.parentElement === container) {
          container.removeChild(script);
        }
        delete window.onTelegramAuth;
      } catch {}
    };
  }, [botUsername, setUser, onSuccess]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div id="tg-login-container" />
      <div className="text-xs text-gray-400">Вход через Telegram Web App</div>
      <Button
        color="iris"
        variant="soft"
        onClick={() => window.open(`https://t.me/${botUsername}`, "_blank")}
      >
        Открыть бота
      </Button>
    </div>
  );
}
