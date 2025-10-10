"use client";

import TelegramLogin from "@/components/TelegramLogin";
import AuthPanel from "@/components/AuthPanel";
import supabase from "@/lib/supabaseClient";
import TodoList from "@/components/TodoList";
import Chat from "@/components/Chat";
import SettingsIcon from "@/components/SettingsIcon";
import useAppStore from "@/store/useAppStore";
import {
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Separator,
  Text,
  Dialog,
  ScrollArea,
} from "@radix-ui/themes";
import { useEffect, useState } from "react";
import type { TelegramUser } from "@/lib/storage";

const TG_BOT = process.env.NEXT_PUBLIC_TG_BOT ?? "your_bot_username";

export default function Home() {
  const user = useAppStore((s) => s.user);
  const reset = useAppStore((s) => s.reset);
  const setUser = useAppStore((s) => s.setUser);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [waUserRaw, setWaUserRaw] = useState<unknown | null>(null);

  type TGWebAppUser = TelegramUser & {
    language_code?: string;
    allows_write_to_pm?: boolean;
  };
  type TGWebApp = {
    initDataUnsafe?: { user?: TGWebAppUser };
    ready?: () => void;
    expand?: () => void;
  };

  // Обработка редиректа от Telegram Login Widget (?id=...&hash=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("id") || !params.has("hash")) return;

    const rawUser = Object.fromEntries(params.entries());

    async function verifyAndSet() {
      try {
        const res = await fetch(
          `/api/telegram/callback${window.location.search}`,
          {
            cache: "no-store",
          }
        );
        const data = (await res.json()) as {
          ok: boolean;
          user: {
            id: string | number;
            first_name?: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          } | null;
        };

        if (data.ok && data.user?.id) {
          const telegramId = typeof data.user.id === "string" 
            ? Number(data.user.id) 
            : data.user.id;

          // Проверяем, есть ли пользователь Supabase с таким Telegram ID
          try {
            const { data: { user: sbUser } } = await supabase.auth.getUser();
            if (sbUser?.user_metadata?.telegram_id === telegramId) {
              // Пользователь уже привязан к Telegram - входим через Supabase
              setUser({
                id: Date.now(),
                username: sbUser.email || sbUser.user_metadata?.name,
                first_name: sbUser.user_metadata?.name,
                photo_url: sbUser.user_metadata?.avatar_url,
              });
              setWelcomeOpen(true);
            } else {
              // Обычный вход через Telegram (для непривязанных аккаунтов)
              setUser({
                id: telegramId,
                first_name: data.user.first_name,
                last_name: data.user.last_name,
                username: data.user.username,
                photo_url: data.user.photo_url,
              });
              setWaUserRaw(data.user);
              setWelcomeOpen(true);
            }
          } catch {
            // Fallback к обычному Telegram входу
            setUser({
              id: telegramId,
              first_name: data.user.first_name,
              last_name: data.user.last_name,
              username: data.user.username,
              photo_url: data.user.photo_url,
            });
            setWaUserRaw(data.user);
            setWelcomeOpen(true);
          }
        }
      } catch {
        // игнорируем и не логиним без верификации
      } finally {
        // очищаем query, чтобы не повторять обработку
        const { pathname, hash } = window.location;
        window.history.replaceState(null, "", pathname + (hash || ""));
      }
    }

    verifyAndSet();
  }, [setUser]);

  // Синхронизация сессии Supabase Auth -> локальный стор
  useEffect(() => {
    let cancelled = false;
    async function syncInitial() {
      try {
        const { data } = await supabase.auth.getSession();
        const sUser = data.session?.user;
        if (!cancelled && sUser && !user) {
          setUser({
            id: Date.now(),
            username: sUser.email || sUser.user_metadata?.name,
            first_name: sUser.user_metadata?.name,
            photo_url: sUser.user_metadata?.avatar_url,
          });
        }
      } catch (error) {
        console.warn('Supabase session sync failed:', error);
      }
    }
    syncInitial();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const sUser = session?.user;
      if (sUser) {
        setUser({
          id: Date.now(),
          username: sUser.email || sUser.user_metadata?.name,
          first_name: sUser.user_metadata?.name,
          photo_url: sUser.user_metadata?.avatar_url,
        });
      } else {
        reset();
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [reset, setUser, user]);

  function loginViaTelegramWA() {
    const tg = (window as unknown as { Telegram?: { WebApp?: TGWebApp } })
      .Telegram?.WebApp;
    const waUser = tg?.initDataUnsafe?.user;
    if (tg?.ready) tg.ready();
    if (tg?.expand) tg.expand();
    if (waUser && waUser.id) {
      setUser({
        id: waUser.id,
        first_name: waUser.first_name,
        last_name: waUser.last_name,
        username: waUser.username,
        photo_url: (waUser as Partial<TelegramUser>).photo_url,
      });
      setWaUserRaw(waUser);
      setWelcomeOpen(true);
    } else {
      // Если не внутри Телеграм — предлагаем открыть бота для запуска Mini App
      const bot = TG_BOT || "goodvibelivebot";
      window.open(`https://t.me/${bot}?startapp=webapp`, "_blank");
    }
  }

  return (
    <>
      <SettingsIcon />
      <Container size="3" className="py-10">
        <Card className="glass-card p-6">
          <Flex align="center" justify="between">
            <Heading className="neon-text" size="6">
              Neon Tasks
            </Heading>
            {user && (
              <Flex align="center" gap="3">
                <Text className="text-gray-300">
                  {user.username ?? user.first_name ?? "Пользователь"}
                </Text>
                <Button
                  variant="soft"
                  color="red"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    reset();
                  }}
                >
                  Выйти
                </Button>
              </Flex>
            )}
          </Flex>
        </Card>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {!user ? (
            <Card className="glass-card p-6">
              <Heading size="5" className="mb-4">Вход</Heading>
              <AuthPanel onSignedIn={() => setWelcomeOpen(false)} />
              <Separator my="4" size="4" />
              <Heading size="5" className="mb-3">Альтернативно: Telegram</Heading>
              <div className="mb-3">
                <Button variant="solid" color="iris" onClick={loginViaTelegramWA}>
                  Войти через Telegram Web Apps
                </Button>
              </div>
              <TelegramLogin botUsername={TG_BOT} />
            </Card>
          ) : (
            <>
              <TodoList />
              <Chat />
            </>
          )}
        </div>

        <Separator my="6" size="4" />
        <Text className="text-center block text-sm text-gray-400">
          UI: Tailwind + Radix UI • Тема: Неоновая тёмная • Хранение:
          LocalStorage
        </Text>
      </Container>

      {/* Модалка с приветствием и данными Telegram пользователя */}
      <Dialog.Root open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <Dialog.Content className="max-w-lg">
          <Dialog.Title>
            <Heading size="5" className="mb-2">
              Привет{user?.first_name ? `, ${user.first_name}` : ""}!
            </Heading>
          </Dialog.Title>
          <Text className="text-gray-400 mb-3 block">
            Вы вошли через Telegram Web Apps. Данные, полученные от Telegram:
          </Text>
          <ScrollArea type="always" style={{ height: 260 }}>
            <pre className="text-xs whitespace-pre-wrap break-words p-3 rounded border border-[color:var(--border)] bg-[color:var(--panel)]/40">
              {JSON.stringify(waUserRaw ?? {}, null, 2)}
            </pre>
          </ScrollArea>
          <Flex mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft">Ок</Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
