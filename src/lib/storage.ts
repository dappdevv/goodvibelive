export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
};

export type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "radixui.chat.threads.v1";
const TODO_KEY = "radixui.todos.v1";
const USER_KEY = "radixui.user.v1";

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  updatedAt: number;
};

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  phone_number?: string;
};

export function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatThread[]) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function saveThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function loadTodos(): TodoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TODO_KEY);
    return raw ? (JSON.parse(raw) as TodoItem[]) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function saveTodos(todos: TodoItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TODO_KEY, JSON.stringify(todos));
}

export function loadUser(): TelegramUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as TelegramUser) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function saveUser(user: TelegramUser | null) {
  if (typeof window === "undefined") return;
  if (!user) localStorage.removeItem(USER_KEY);
  else localStorage.setItem(USER_KEY, JSON.stringify(user));
}
