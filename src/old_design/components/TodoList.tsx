"use client";

import useAppStore from "@/store/useAppStore";
import {
  Checkbox,
  Flex,
  IconButton,
  TextField,
  Button,
  Card,
  Heading,
} from "@radix-ui/themes";
import { useState } from "react";
import { TrashIcon } from "@radix-ui/react-icons";

export default function TodoList() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useAppStore();
  const [text, setText] = useState("");

  return (
    <Card className="glass-card w-full">
      <Heading className="neon-text mb-3" size="4">
        Задачи
      </Heading>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) {
            addTodo(text.trim());
            setText("");
          }
        }}
      >
        <Flex gap="2" align="center">
          <TextField.Root
            className="flex-1"
            placeholder="Новая задача"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button className="btn-primary" type="submit">
            Добавить
          </Button>
        </Flex>
      </form>
      <div className="mt-4 space-y-2">
        {todos.map((t) => (
          <Flex
            key={t.id}
            align="center"
            justify="between"
            className="rounded-md border border-[color:var(--border)] px-3 py-2"
          >
            <label className="flex items-center gap-2">
              <Checkbox
                checked={t.done}
                onCheckedChange={() => toggleTodo(t.id)}
              />
              <span className={t.done ? "line-through text-gray-400" : ""}>
                {t.text}
              </span>
            </label>
            <IconButton
              color="red"
              variant="soft"
              onClick={() => deleteTodo(t.id)}
            >
              <TrashIcon />
            </IconButton>
          </Flex>
        ))}
        {todos.length === 0 && (
          <div className="text-sm text-gray-400">
            Нет задач — добавьте первую!
          </div>
        )}
      </div>
    </Card>
  );
}
