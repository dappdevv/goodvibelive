import { apiClient } from './client';

// Типы для аутентификации
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  first_name?: string;
  last_name?: string;
}

export interface UpdateProfileData {
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface AuthResponse {
  error: Error | null;
  data?: {
    user: any;
    session: any;
  };
}

export interface UpdateProfileResponse {
  error: Error | null;
  data?: any;
}

// Клиент для аутентификации
class AuthApi {
  // Вход пользователя
 async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials;
      const result = await apiClient.getSupabase().auth.signInWithPassword({
        email,
        password
      });

      if (result.error) {
        return { error: new Error(result.error.message) };
      }

      return { error: null, data: { user: result.data.user, session: result.data.session } };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Регистрация пользователя
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const { email, password, username, first_name, last_name } = userData;
      
      // Сначала создаем пользователя
      const signUpResult = await apiClient.getSupabase().auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            first_name,
            last_name
          }
        }
      });

      if (signUpResult.error) {
        return { error: new Error(signUpResult.error.message) };
      }

      // Если регистрация успешна, сразу логиним пользователя
      const loginResult = await this.login({ email, password });
      
      // Создаем запись в таблице пользователей, если не создалась автоматически
      if (loginResult.data?.user) {
        const { error: userError } = await apiClient.getSupabase()
          .from('users')
          .upsert({
            id: loginResult.data.user.id,
            email: loginResult.data.user.email,
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            referral_code: this.generateReferralCode()
          }, { onConflict: 'id' });

        if (userError) {
          console.error('Error creating user profile:', userError);
        }
      }

      return loginResult;
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Выход пользователя
  async logout(): Promise<{ error: Error | null }> {
    try {
      const result = await apiClient.getSupabase().auth.signOut();
      if (result.error) {
        return { error: new Error(result.error.message) };
      }
      return { error: null };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получение текущего пользователя
  async getCurrentUser() {
    return await apiClient.getCurrentUser();
  }

 // Обновление профиля пользователя
 async updateProfile(profileData: UpdateProfileData): Promise<UpdateProfileResponse> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Обновляем профиль в Supabase auth
      if (profileData.username || profileData.first_name || profileData.last_name) {
        const updateResult = await apiClient.getSupabase().auth.updateUser({
          data: {
            ...(profileData.username && { username: profileData.username }),
            ...(profileData.first_name && { first_name: profileData.first_name }),
            ...(profileData.last_name && { last_name: profileData.last_name }),
            ...(profileData.bio && { bio: profileData.bio }),
            ...(profileData.avatar_url && { avatar_url: profileData.avatar_url })
          }
        });

        if (updateResult.error) {
          return { error: new Error(updateResult.error.message) };
        }
      }

      // Обновляем профиль в пользовательской таблице
      const { error } = await apiClient.getSupabase()
        .from('users')
        .update({
          ...(profileData.username && { username: profileData.username }),
          ...(profileData.first_name && { first_name: profileData.first_name }),
          ...(profileData.last_name && { last_name: profileData.last_name }),
          ...(profileData.bio && { bio: profileData.bio }),
          ...(profileData.avatar_url && { avatar_url: profileData.avatar_url })
        })
        .eq('id', user.id);

      if (error) {
        return { error: new Error(error.message) };
      }

      // Возвращаем обновленные данные пользователя
      const { data: updatedUser, error: fetchError } = await apiClient.getSupabase()
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        return { error: new Error(fetchError.message) };
      }

      return { error: null, data: updatedUser };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получение профиля пользователя
 async getProfile(userId?: string) {
    const currentUser = await this.getCurrentUser();
    const targetUserId = userId || currentUser?.id;

    if (!targetUserId) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { data, error } = await apiClient.getSupabase()
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null, data };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Восстановление пароля
  async forgotPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await apiClient.getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Обновление пароля
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error } = await apiClient.getSupabase().auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Подтверждение email
  async confirmEmail(token: string): Promise<AuthResponse> {
    try {
      const result = await apiClient.getSupabase().auth.verifyOtp({
        type: 'email',
        token
      });

      if (result.error) {
        return { error: new Error(result.error.message) };
      }

      return { error: null, data: { user: result.data.user, session: result.data.session } };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Проверка аутентификации
  async isAuthenticated(): Promise<boolean> {
    return await apiClient.isAuthenticated();
  }

  // Генерация реферального кода
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Вход через Telegram
  async loginWithTelegram(telegramData: any): Promise<AuthResponse> {
    try {
      // Проверяем подпись Telegram для безопасности
      if (!this.verifyTelegramAuth(telegramData)) {
        return { error: new Error('Invalid Telegram authentication data') };
      }

      // Проверяем, существует ли пользователь с таким Telegram ID
      const { data: existingUser, error: fetchError } = await apiClient.getSupabase()
        .from('users')
        .select('*')
        .eq('telegram_id', telegramData.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 означает "Row not found"
        return { error: new Error(fetchError.message) };
      }

      if (existingUser) {
        // Если пользователь существует, создаем сессию
        const { data: session, error: sessionError } = await apiClient.getSupabase()
          .auth.signInWithPassword({
            email: existingUser.email,
            password: `telegram_${telegramData.id}` // Используем уникальный пароль для Telegram
          });

        if (sessionError) {
          // Если стандартный вход не работает, создаем сессию напрямую
          // (это может потребовать настройки специального провайдера аутентификации)
          console.warn('Standard sign-in failed, attempting custom session creation');
        }

        return { error: null, data: { user: existingUser, session } };
      } else {
        // Если пользователя нет, создаем нового
        const newUserData = {
          id: telegramData.id.toString(),
          email: `telegram_${telegramData.id}@example.com`, // Временный email
          username: telegramData.username || `user${telegramData.id}`,
          first_name: telegramData.first_name,
          last_name: telegramData.last_name,
          telegram_id: telegramData.id,
          avatar_url: telegramData.photo_url,
          referral_code: this.generateReferralCode()
        };

        // Создаем пользователя в таблице
        const { error: insertError } = await apiClient.getSupabase()
          .from('users')
          .insert([newUserData]);

        if (insertError) {
          return { error: new Error(insertError.message) };
        }

        // Создаем сессию для нового пользователя
        const { data: session, error: sessionError } = await apiClient.getSupabase()
          .auth.signInWithPassword({
            email: newUserData.email,
            password: `telegram_${telegramData.id}`
          });

        return { error: null, data: { user: newUserData, session } };
      }
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Проверка подписи Telegram (упрощенная версия)
  private verifyTelegramAuth(data: any): boolean {
    // В реальном приложении здесь должна быть проверка подписи Telegram
    // согласно https://core.telegram.org/widgets/login#checking-authorization
    // Для упрощения возвращаем true, но в продакшене нужно реализовать
    // полную проверку подписи
    console.log('Telegram auth data:', data);
    return true;
  }
}

// Экземпляр API клиента для аутентификации
export const authApi = new AuthApi();