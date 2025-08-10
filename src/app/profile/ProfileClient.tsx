"use client";

import useAppStore from "@/store/useAppStore";
import Image from "next/image";
import {
  Button,
  Card,
  Container,
  Flex,
  Heading,
  ScrollArea,
  Separator,
  Text,
} from "@radix-ui/themes";
import { useEffect, useState } from "react";

export default function ProfileClient() {
  const user = useAppStore((s) => s.user);
  const reset = useAppStore((s) => s.reset);
  const [persistedAppState, setPersistedAppState] = useState<unknown>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("radixui.app.v1");
      setPersistedAppState(raw ? JSON.parse(raw) : null);
    } catch {
      setPersistedAppState(null);
    }
  }, [user]);

  return (
    <Container size="3" className="py-10">
      <Card className="glass-card p-6">
        <Flex align="center" justify="between">
          <Heading className="neon-text" size="6">
            Профиль
          </Heading>
          {user && (
            <div className="flex items-center gap-2">
              <RequestPhoneButton />
              <Button variant="soft" color="red" onClick={() => reset()}>
                Выйти
              </Button>
            </div>
          )}
        </Flex>
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card p-5 md:col-span-1">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border border-[color:var(--border)]">
              {user?.photo_url ? (
                <Image
                  src={user.photo_url}
                  alt="avatar"
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-3xl bg-black/40">
                  {(
                    user?.username?.[0] ||
                    user?.first_name?.[0] ||
                    "?"
                  ).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="text-lg font-medium">
                {user?.username ||
                  `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
                  "Гость"}
              </div>
              <div className="text-xs text-gray-400">ID: {user?.id ?? "—"}</div>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-5 md:col-span-2">
          <Heading size="3" className="mb-3">
            Данные пользователя
          </Heading>
          {!user ? (
            <Text className="text-gray-400">Пользователь не авторизован.</Text>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Field label="ID" value={String(user.id)} />
              <Field label="Username" value={user.username ?? "—"} />
              <Field label="Имя" value={user.first_name ?? "—"} />
              <Field label="Фамилия" value={user.last_name ?? "—"} />
              <Field label="Телефон" value={user.phone_number ?? "—"} />
              <Field
                label="Фото"
                value={user.photo_url ?? "—"}
                isLink={Boolean(user.photo_url)}
              />
            </div>
          )}
          <Separator my="4" size="4" />
          <Heading size="3" className="mb-2">
            JSON пользователя
          </Heading>
          <ScrollArea type="always" style={{ height: 220 }}>
            <pre className="text-xs whitespace-pre-wrap break-words p-3 rounded border border-[color:var(--border)] bg-[color:var(--panel)]/40">
              {JSON.stringify(user ?? {}, null, 2)}
            </pre>
          </ScrollArea>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="glass-card p-5">
          <Heading size="3" className="mb-2">
            Состояние приложения (persist)
          </Heading>
          <Text className="text-xs text-gray-400 mb-2 block">
            Ключ: <code>radixui.app.v1</code>
          </Text>
          <ScrollArea type="always" style={{ height: 240 }}>
            <pre className="text-xs whitespace-pre-wrap break-words p-3 rounded border border-[color:var(--border)] bg-[color:var(--panel)]/40">
              {JSON.stringify(persistedAppState ?? {}, null, 2)}
            </pre>
          </ScrollArea>
        </Card>
      </div>
    </Container>
  );
}

type FieldProps = { label: string; value: string; isLink?: boolean };
function Field({ label, value, isLink }: FieldProps) {
  return (
    <div>
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      {isLink && value && value !== "—" ? (
        <a
          className="underline break-all"
          href={value}
          target="_blank"
          rel="noreferrer"
        >
          {value}
        </a>
      ) : (
        <div className="break-all">{value || "—"}</div>
      )}
    </div>
  );
}

function RequestPhoneButton() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    try {
      // Проверяем окружение Telegram Web App
      type TGWebApp = {
        requestPhoneNumber?: () => Promise<Record<string, unknown>>;
      };
      type TGWindow = Window & { Telegram?: { WebApp?: TGWebApp } };
      const wa = (window as TGWindow).Telegram?.WebApp;
      if (!wa || typeof wa.requestPhoneNumber !== "function") {
        setError(
          "Откройте приложение внутри Telegram (WebApp), чтобы поделиться телефоном."
        );
        return;
      }
      setLoading(true);
      const result = await wa.requestPhoneNumber();
      // result: объект с полями, включая phone_number, hash и др., требующими верификации
      const form = new URLSearchParams();
      for (const [k, v] of Object.entries(result || {})) {
        if (v != null) form.append(k, String(v));
      }
      // Отправляем на сервер для верификации подписи
      const res = await fetch("/api/telegram/phone", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error || `Ошибка ${res.status}`);
        return;
      }
      const phone: string | undefined = data.phone_number;
      if (phone) {
        setUser({ ...(user || { id: 0 }), phone_number: phone });
      }
    } catch (e) {
      setError((e as Error).message || "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleClick} variant="soft" disabled={loading}>
        {loading ? "Запрос..." : "Поделиться телефоном"}
      </Button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
