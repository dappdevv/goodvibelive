import { apiClient } from './client';

// Типы для профиля пользователя
export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
 first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  social_links?: {
    telegram?: string;
    twitter?: string;
    instagram?: string;
    tiktok?: string;
  };
 stats?: {
    followers_count: number;
    following_count: number;
    posts_count: number;
    likes_received: number;
  };
  preferences?: {
    notifications_enabled: boolean;
    email_notifications: boolean;
    privacy_level: 'public' | 'friends' | 'private';
  };
  created_at: string;
  updated_at: string;
  referral_code?: string;
  telegram_id?: string;
}

export interface UpdateProfileData {
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  social_links?: {
    telegram?: string;
    twitter?: string;
    instagram?: string;
    tiktok?: string;
  };
 preferences?: {
    notifications_enabled?: boolean;
    email_notifications?: boolean;
    privacy_level?: 'public' | 'friends' | 'private';
  };
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private';
  posts_visibility: 'public' | 'friends' | 'private';
  allow_direct_messages: boolean;
  allow_tagging: boolean;
}

// Клиент для работы с профилем
class ProfileApi {
  // Получить профиль пользователя
 async getProfile(userId?: string): Promise<{ error: Error | null; data?: UserProfile }> {
    const currentUser = await apiClient.getCurrentUser();
    const targetUserId = userId || currentUser?.id;

    if (!targetUserId) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Получаем данные пользователя из таблицы users
      const { data: user, error: userError } = await apiClient.getSupabase()
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (userError) {
        return { error: new Error(userError.message) };
      }

      // Получаем статистику пользователя
      const stats = await this.getUserStats(targetUserId);

      // Формируем профиль
      const profile: UserProfile = {
        id: user.id,
        user_id: user.id,
        username: user.username || '',
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email || '',
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location,
        website: user.website,
        social_links: user.social_links,
        stats: stats.data,
        preferences: user.preferences,
        created_at: user.created_at,
        updated_at: user.updated_at,
        referral_code: user.referral_code,
        telegram_id: user.telegram_id
      };

      return { error: null, data: profile };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Обновить профиль пользователя
  async updateProfile(profileData: UpdateProfileData): Promise<{ error: Error | null; data?: UserProfile }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Обновляем данные в Supabase Auth
      const authUpdates: any = {};
      if (profileData.username) authUpdates.data = { ...authUpdates.data, username: profileData.username };
      if (profileData.first_name) authUpdates.data = { ...authUpdates.data, first_name: profileData.first_name };
      if (profileData.last_name) authUpdates.data = { ...authUpdates.data, last_name: profileData.last_name };
      if (profileData.avatar_url) authUpdates.data = { ...authUpdates.data, avatar_url: profileData.avatar_url };
      if (profileData.bio) authUpdates.data = { ...authUpdates.data, bio: profileData.bio };

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await apiClient.getSupabase().auth.updateUser({
          data: authUpdates.data
        });

        if (authError) {
          return { error: new Error(authError.message) };
        }
      }

      // Обновляем данные в пользовательской таблице
      const dbUpdates: any = {};
      if (profileData.username) dbUpdates.username = profileData.username;
      if (profileData.first_name) dbUpdates.first_name = profileData.first_name;
      if (profileData.last_name) dbUpdates.last_name = profileData.last_name;
      if (profileData.avatar_url) dbUpdates.avatar_url = profileData.avatar_url;
      if (profileData.bio) dbUpdates.bio = profileData.bio;
      if (profileData.location) dbUpdates.location = profileData.location;
      if (profileData.website) dbUpdates.website = profileData.website;
      if (profileData.social_links) dbUpdates.social_links = profileData.social_links;
      if (profileData.preferences) dbUpdates.preferences = profileData.preferences;

      const { data, error } = await apiClient.getSupabase()
        .from('users')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return apiClient.handleApiError(error);
      }

      // Возвращаем обновленный профиль
      return { error: null, data: data as UserProfile };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить статистику пользователя
 private async getUserStats(userId: string): Promise<{ error: Error | null; data?: UserProfile['stats'] }> {
    try {
      // Считаем количество подписчиков
      const { count: followersCount, error: followersError } = await apiClient.getSupabase()
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (followersError) {
        console.error('Error fetching followers count:', followersError);
      }

      // Считаем количество подписок
      const { count: followingCount, error: followingError } = await apiClient.getSupabase()
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (followingError) {
        console.error('Error fetching following count:', followingError);
      }

      // Считаем количество постов
      const { count: postsCount, error: postsError } = await apiClient.getSupabase()
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (postsError) {
        console.error('Error fetching posts count:', postsError);
      }

      // Считаем количество полученных лайков
      const { count: likesReceived, error: likesError } = await apiClient.getSupabase()
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .in('post_id', 
          apiClient.getSupabase()
            .from('posts')
            .select('id', { head: true })
            .eq('user_id', userId)
        );

      if (likesError) {
        console.error('Error fetching likes received count:', likesError);
      }

      const stats = {
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        posts_count: postsCount || 0,
        likes_received: likesReceived || 0
      };

      return { error: null, data: stats };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить настройки приватности
  async getPrivacySettings(): Promise<{ error: Error | null; data?: PrivacySettings }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { data, error } = await apiClient.getSupabase()
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Row not found
          // Возвращаем настройки по умолчанию
          return {
            error: null,
            data: {
              profile_visibility: 'public',
              posts_visibility: 'public',
              allow_direct_messages: true,
              allow_tagging: true
            }
          };
        }
        return apiClient.handleApiError(error);
      }

      return { error: null, data: data as PrivacySettings };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Обновить настройки приватности
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<{ error: Error | null; data?: PrivacySettings }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { data, error } = await apiClient.getSupabase()
        .from('user_privacy_settings')
        .upsert({
          user_id: user.id,
          ...settings
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        return apiClient.handleApiError(error);
      }

      return { error: null, data: data as PrivacySettings };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Загрузить аватар
  async uploadAvatar(file: File): Promise<{ error: Error | null; data?: string }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Загружаем файл в Supabase Storage
      const fileName = `${user.id}/avatar/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await apiClient.getSupabase()
        .storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        return { error: new Error(uploadError.message) };
      }

      // Получаем публичный URL файла
      const { data: publicUrlData } = apiClient.getSupabase()
        .storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Обновляем профиль с новым URL аватара
      const updateResult = await this.updateProfile({
        avatar_url: publicUrlData.publicUrl
      });

      if (updateResult.error) {
        return updateResult;
      }

      return { error: null, data: publicUrlData.publicUrl };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить список пользователей по поисковому запросу
  async searchUsers(query: string, limit: number = 20): Promise<{ error: Error | null; data?: UserProfile[] }> {
    if (!query || query.trim().length < 2) {
      return { error: new Error('Search query must be at least 2 characters long') };
    }

    try {
      const { data, error } = await apiClient.getSupabase()
        .from('users')
        .select(`
          id,
          username,
          first_name,
          last_name,
          avatar_url,
          bio
        `)
        .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        return apiClient.handleApiError(error);
      }

      // Преобразуем данные в формат UserProfile
      const profiles: UserProfile[] = data.map(user => ({
        id: user.id,
        user_id: user.id,
        username: user.username || '',
        first_name: user.first_name,
        last_name: user.last_name,
        email: '', // Не возвращаем email при поиске
        avatar_url: user.avatar_url,
        bio: user.bio,
        created_at: '',
        updated_at: '',
        stats: {
          followers_count: 0, // В реальном приложении можно добавить подсчет
          following_count: 0,
          posts_count: 0,
          likes_received: 0
        }
      }));

      return { error: null, data: profiles };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Проверить уникальность username
  async checkUsernameAvailability(username: string): Promise<{ error: Error | null; available: boolean }> {
    try {
      const { data, error } = await apiClient.getSupabase()
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') { // Row not found
        return { error: null, available: true };
      }

      if (error) {
        return { error: new Error(error.message), available: false };
      }

      return { error: null, available: false };
    } catch (error) {
      return { error: apiClient.handleApiError(error).error as Error, available: false };
    }
  }
}

// Экземпляр API клиента для работы с профилем
export const profileApi = new ProfileApi();