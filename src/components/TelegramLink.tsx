"use client";

import { useState } from "react";
import { Button, Text } from "@radix-ui/themes";
import supabase from "@/lib/supabaseClient";
import TelegramLogin from "./TelegramLogin";

type TelegramLinkProps = {
  onLinked?: () => void;
};

export default function TelegramLink({ onLinked }: TelegramLinkProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function linkTelegramAccount(telegramData: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  }) {
    setError(null);
    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("Пользователь не авторизован");
        return;
      }

      // Обновляем метаданные пользователя с данными Telegram
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          telegram_id: telegramData.id,
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          telegram_last_name: telegramData.last_name,
          telegram_photo_url: telegramData.photo_url,
        }
      });

      if (updateError) {
        setError(`Ошибка привязки: ${updateError.message}`);
        return;
      }

      setSuccess(true);
      if (onLinked) onLinked();
    } catch (e) {
      setError((e as Error).message || "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2">
        <Text color="green" size="2">✓ Telegram привязан</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button 
          onClick={() => setLoading(!loading)} 
          variant="soft" 
          color="iris"
          disabled={loading}
        >
          {loading ? "Ожидание..." : "Привязать Telegram"}
        </Button>
        {error && <Text color="red" size="2">{error}</Text>}
      </div>
      
      {loading && (
        <div className="border border-[color:var(--border)] rounded-md p-3">
          <Text size="2" className="mb-2 block">Войдите через Telegram для привязки:</Text>
          <TelegramLogin 
            botUsername={process.env.NEXT_PUBLIC_TG_BOT || "your_bot_username"}
            onSuccess={(userData) => {
              linkTelegramAccount({
                id: userData.id,
                username: userData.username,
                first_name: userData.first_name,
                last_name: userData.last_name,
                photo_url: userData.photo_url,
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
