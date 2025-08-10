"use client";

import { useEffect } from "react";
import useAppStore from "@/store/useAppStore";
import { Button } from "@radix-ui/themes";

type TelegramLoginProps = {
  botUsername: string;
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

export default function TelegramLogin({ botUsername }: TelegramLoginProps) {
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
    // Явно используем указанный редирект URL (Vercel)
    script.dataset.authUrl = "https://goodvibelive.vercel.app/";
    const container = document.getElementById("tg-login-container");
    container?.appendChild(script);

    return () => {
      try {
        if (container && script.parentElement === container) {
          container.removeChild(script);
        }
      } catch {}
    };
  }, [botUsername, setUser]);

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
