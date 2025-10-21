import { apiClient } from './client';
import { type Post } from '../../types/supabase';

// Типы для фида
export interface FeedPost {
  id: string;
  user_id: string;
  content_type: 'image' | 'video' | 'audio' | 'text';
  content_url: string;
  title?: string;
 description?: string;
 tags?: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

// Экспортируем FeedItem как альтернативное имя для FeedPost
export type FeedItem = FeedPost;

export interface GetFeedParams {
  limit?: number;
  offset?: number;
  content_type?: 'image' | 'video' | 'audio' | 'text';
  tags?: string[];
  user_id?: string;
}

export interface LikeResponse {
  success: boolean;
  likes_count: number;
  is_liked: boolean;
}

export interface BookmarkResponse {
  success: boolean;
  is_bookmarked: boolean;
}

// Клиент для работы с фидом
class FeedApi {
  // Получить фид
  async getFeed(params: GetFeedParams = {}): Promise<{ error: Error | null; data?: FeedPost[] }> {
    const { limit = 20, offset = 0, content_type, tags, user_id } = params;
    
    try {
      let query = apiClient.getSupabase()
        .from('posts')
        .select(`
          id,
          user_id,
          content_type,
          content_url,
          title,
          description,
          tags,
          likes_count,
          comments_count,
          created_at,
          users ( id, username, avatar_url )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (content_type) {
        query = query.eq('content_type', content_type);
      }

      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags);
      }

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      const result = await apiClient.executeRequest<FeedPost[]>(query);
      
      // Добавляем информацию о лайке и закладке для каждого поста
      if (result.data) {
        const user = await apiClient.getCurrentUser();
        if (user) {
          const postIds = result.data.map(post => post.id);
          const { data: userLikes, error: likesError } = await apiClient.getSupabase()
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds);
            
          if (!likesError && userLikes) {
            const likedPostIds = new Set(userLikes.map(like => like.post_id));
            result.data = result.data.map(post => ({
              ...post,
              is_liked: likedPostIds.has(post.id)
            }));
          }
          
          const { data: userBookmarks, error: bookmarksError } = await apiClient.getSupabase()
            .from('post_bookmarks')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds);
            
          if (!bookmarksError && userBookmarks) {
            const bookmarkedPostIds = new Set(userBookmarks.map(bm => bm.post_id));
            result.data = result.data.map(post => ({
              ...post,
              is_bookmarked: bookmarkedPostIds.has(post.id)
            }));
          }
        }
      }
      
      return result;
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить посты пользователя
  async getUserPosts(userId: string, params: GetFeedParams = {}): Promise<{ error: Error | null; data?: FeedPost[] }> {
    return this.getFeed({ ...params, user_id: userId });
  }

  // Получить избранные посты пользователя
  async getBookmarks(params: GetFeedParams = {}): Promise<{ error: Error | null; data?: FeedPost[] }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { limit = 20, offset = 0, content_type, tags } = params;
      
      let query = apiClient.getSupabase()
        .from('post_bookmarks')
        .select(`
          post_id,
          posts (
            id,
            user_id,
            content_type,
            content_url,
            title,
            description,
            tags,
            likes_count,
            comments_count,
            created_at,
            users ( id, username, avatar_url )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (content_type) {
        query = query.eq('posts.content_type', content_type);
      }

      if (tags && tags.length > 0) {
        query = query.overlaps('posts.tags', tags);
      }

      const result = await query;
      
      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Преобразуем результат к формату FeedPost
      const feedPosts: FeedPost[] = result.data.map(item => ({
        ...item.posts,
        is_bookmarked: true,
        is_liked: false // Значение будет обновлено ниже
      }));

      // Добавляем информацию о лайках
      const postIds = feedPosts.map(post => post.id);
      const { data: userLikes, error: likesError } = await apiClient.getSupabase()
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
        
      if (!likesError && userLikes) {
        const likedPostIds = new Set(userLikes.map(like => like.post_id));
        return {
          error: null,
          data: feedPosts.map(post => ({
            ...post,
            is_liked: likedPostIds.has(post.id)
          }))
        };
      }

      return {
        error: null,
        data: feedPosts
      };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Поставить/убрать лайк с поста
  async toggleLike(postId: string): Promise<{ error: Error | null; data?: LikeResponse }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Проверяем, есть ли уже лайк
      const { data: existingLike, error: checkError } = await apiClient.getSupabase()
        .from('post_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 означает "Row not found"
        return apiClient.handleApiError(checkError);
      }

      let result: any;
      let isLiked: boolean;

      if (existingLike) {
        // Удаляем лайк
        result = await apiClient.getSupabase()
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);

        isLiked = false;
      } else {
        // Добавляем лайк
        result = await apiClient.getSupabase()
          .from('post_likes')
          .insert([{ user_id: user.id, post_id: postId }]);

        isLiked = true;
      }

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Обновляем счетчик лайков
      const { count, error: countError } = await apiClient.getSupabase()
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (countError) {
        return apiClient.handleApiError(countError);
      }

      return {
        error: null,
        data: {
          success: true,
          likes_count: count || 0,
          is_liked: isLiked
        }
      };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Добавить/удалить пост из избранного
  async toggleBookmark(postId: string): Promise<{ error: Error | null; data?: BookmarkResponse }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Проверяем, есть ли уже закладка
      const { data: existingBookmark, error: checkError } = await apiClient.getSupabase()
        .from('post_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 означает "Row not found"
        return apiClient.handleApiError(checkError);
      }

      let result: any;
      let isBookmarked: boolean;

      if (existingBookmark) {
        // Удаляем закладку
        result = await apiClient.getSupabase()
          .from('post_bookmarks')
          .delete()
          .eq('id', existingBookmark.id);

        isBookmarked = false;
      } else {
        // Добавляем закладку
        result = await apiClient.getSupabase()
          .from('post_bookmarks')
          .insert([{ user_id: user.id, post_id: postId }]);

        isBookmarked = true;
      }

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      return {
        error: null,
        data: {
          success: true,
          is_bookmarked: isBookmarked
        }
      };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить посты по тегам
  async getPostsByTags(tags: string[], params: GetFeedParams = {}): Promise<{ error: Error | null; data?: FeedPost[] }> {
    return this.getFeed({ ...params, tags });
  }

  // Получить рекомендованные посты
  async getRecommendedPosts(params: GetFeedParams = {}): Promise<{ error: Error | null; data?: FeedPost[] }> {
    // Для простоты возвращаем посты по популярности
    // В реальном приложении можно использовать более сложную логику рекомендаций
    try {
      let query = apiClient.getSupabase()
        .from('posts')
        .select(`
          id,
          user_id,
          content_type,
          content_url,
          title,
          description,
          tags,
          likes_count,
          comments_count,
          created_at,
          users ( id, username, avatar_url )
        `)
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false });

      const { limit = 20, offset = 0, content_type } = params;

      query = query.range(offset, offset + limit - 1);

      if (content_type) {
        query = query.eq('content_type', content_type);
      }

      const result = await apiClient.executeRequest<FeedPost[]>(query);
      
      // Добавляем информацию о лайке и закладке для каждого поста
      if (result.data) {
        const user = await apiClient.getCurrentUser();
        if (user) {
          const postIds = result.data.map(post => post.id);
          const { data: userLikes, error: likesError } = await apiClient.getSupabase()
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds);
            
          if (!likesError && userLikes) {
            const likedPostIds = new Set(userLikes.map(like => like.post_id));
            result.data = result.data.map(post => ({
              ...post,
              is_liked: likedPostIds.has(post.id)
            }));
          }
          
          const { data: userBookmarks, error: bookmarksError } = await apiClient.getSupabase()
            .from('post_bookmarks')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds);
            
          if (!bookmarksError && userBookmarks) {
            const bookmarkedPostIds = new Set(userBookmarks.map(bm => bm.post_id));
            result.data = result.data.map(post => ({
              ...post,
              is_bookmarked: bookmarkedPostIds.has(post.id)
            }));
          }
        }
      }
      
      return result;
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }
}

// Экземпляр API клиента для фида
export const feedApi = new FeedApi();

// Экспортируем feedClient как альтернативное имя для feedApi
export const feedClient = feedApi;