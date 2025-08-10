"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ChatThread,
  TodoItem,
  TelegramUser,
  loadTodos,
  saveTodos,
  loadUser,
  saveUser,
} from "@/lib/storage";

type AppState = {
  user: TelegramUser | null;
  todos: TodoItem[];
  threads: ChatThread[];
  activeThreadId: string | null;
};

type AppActions = {
  setUser: (u: TelegramUser | null) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  createThread: (title?: string) => string;
  addMessage: (
    threadId: string,
    role: ChatThread["messages"][number]["role"],
    content: string
  ) => void;
  setActiveThread: (id: string | null) => void;
  renameThread: (id: string, title: string) => void;
  deleteThread: (id: string) => void;
  reset: () => void;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      user: loadUser(),
      todos: loadTodos(),
      threads: [],
      activeThreadId: null,

      setUser: (u) => set({ user: u }),
      addTodo: (text) =>
        set((state) => ({
          todos: [
            ...state.todos,
            {
              id: uid(),
              text,
              done: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, done: !t.done, updatedAt: Date.now() } : t
          ),
        })),
      deleteTodo: (id) =>
        set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),
      createThread: (title = "Новый чат") => {
        const id = uid();
        const newThread: ChatThread = {
          id,
          title,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          threads: [newThread, ...state.threads],
          activeThreadId: id,
        }));
        return id;
      },
      addMessage: (threadId, role, content) =>
        set((state) => ({
          threads: state.threads.map((th) =>
            th.id === threadId
              ? {
                  ...th,
                  title:
                    th.messages.length === 0 && role === "user"
                      ? (content || "Новый чат").slice(0, 42)
                      : th.title,
                  messages: [
                    ...th.messages,
                    { id: uid(), role, content, createdAt: Date.now() },
                  ],
                  updatedAt: Date.now(),
                }
              : th
          ),
        })),
      setActiveThread: (id) => set({ activeThreadId: id }),
      renameThread: (id, title) =>
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === id
              ? { ...t, title: title.slice(0, 120), updatedAt: Date.now() }
              : t
          ),
        })),
      deleteThread: (id) =>
        set((state) => ({
          threads: state.threads.filter((t) => t.id !== id),
          activeThreadId:
            state.activeThreadId === id ? null : state.activeThreadId,
        })),
      reset: () =>
        set({ user: null, todos: [], threads: [], activeThreadId: null }),
    }),
    { name: "radixui.app.v1" }
  )
);

// Persist todos to dedicated localStorage key on any state change (client-side only)
if (typeof window !== "undefined") {
  useAppStore.subscribe((state) => {
    try {
      saveTodos(state.todos);
      saveUser(state.user);
    } catch {
      // noop
    }
  });
}

export default useAppStore;
