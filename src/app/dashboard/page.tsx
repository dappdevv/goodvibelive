"use client";

import Chat from "@/components/Chat";
import TodoList from "@/components/TodoList";
import useAppStore from "@/store/useAppStore";
import { Button, Card, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const user = useAppStore((s) => s.user);
  const reset = useAppStore((s) => s.reset);
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/");
  }, [user, router]);

  if (!user) return null;

  return (
    <Container size="3" className="py-10">
      <Card className="glass-card p-6">
        <Flex align="center" justify="between">
          <Heading className="neon-text" size="6">
            Ваши задачи и чат
          </Heading>
          <Flex align="center" gap="3">
            <Text className="text-gray-300">
              {user.username ?? user.first_name ?? "Пользователь"}
            </Text>
            <Button
              variant="soft"
              color="red"
              onClick={() => {
                reset();
                router.replace("/");
              }}
            >
              Выйти
            </Button>
          </Flex>
        </Flex>
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <TodoList />
        <Chat />
      </div>
    </Container>
  );
}
