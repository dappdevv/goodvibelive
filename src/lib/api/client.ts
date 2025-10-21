import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

// Инициализация Supabase клиента
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Типы для аутентификации
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

// Базовый класс для API клиентов
export class ApiClient {
  protected async handleResponse<T>(response: { data: T | null; error: any }): Promise<T> {
    if (response.error) {
      throw new Error(response.error.message || 'An error occurred');
    }
    return response.data as T;
  }

  protected async handleResponseWithCount<T>(response: { data: T | null; count: number | null; error: any }): Promise<{ data: T; count: number | null }> {
    if (response.error) {
      throw new Error(response.error.message || 'An error occurred');
    }
    return { data: response.data as T, count: response.count };
  }
}

// Класс для аутентификации
export class AuthClient extends ApiClient {
  async login(credentials: LoginCredentials) {
    const { email, password } = credentials;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

 async register(userData: RegisterData) {
    const { email, password, name } = userData;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return user;
  }

  async updateProfile(userId: string, profileData: Partial<{ name: string; avatar_url: string; bio: string }>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    
    return this.handleResponse(data ? { data } : { data: null, error });
  }

  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      throw new Error(error.message);
    }
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }
}

export const authClient = new AuthClient();