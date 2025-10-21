import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type Database } from '../../types/supabase';

// Тип для экземпляра Supabase клиента
export type SupabaseInstance = SupabaseClient<Database>;

// Базовый API клиент с инициализацией Supabase
class ApiClient {
  private supabase: SupabaseInstance;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  // Получить экземпляр Supabase клиента
  getSupabase(): SupabaseInstance {
    return this.supabase;
  }

  // Обработка ошибок API
  handleApiError(error: any): { error: Error | null; data?: any } {
    if (error) {
      console.error('API Error:', error);
      return { error: new Error(error.message || 'An error occurred') };
    }
    return { error: null };
  }

  // Метод для выполнения запросов с обработкой ошибок
  async executeRequest<T>(request: Promise<any>): Promise<{ error: Error | null; data?: T }> {
    try {
      const response = await request;
      
      // Проверяем, является ли ответ объектом с полем error
      if (response.error) {
        return this.handleApiError(response.error);
      }
      
      // Если ошибки нет, возвращаем данные
      return { error: null, data: response.data || response };
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}

// Экземпляр API клиента
export const apiClient = new ApiClient();

// Функция для получения текущего пользователя
export const getCurrentUser = async () => {
  const { data: { user } } = await apiClient.getSupabase().auth.getUser();
  return user;
};

// Функция для проверки аутентификации
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};