import { supabase } from './client';
import { ApiClient } from './client';

// Типы для фида
export interface FeedItem {
 id: string;
  user_id: string;
  content: string;
  type: 'post' | 'image' | 'video' | 'music';
  url?: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string;
  };
  likes_count: number;
  is_liked: boolean;
  is_favorite: boolean;
}

export interface FeedFilters {
  type?: 'post' | 'image' | 'video' | 'music';
  limit?: number;
  offset?: number;
}

// Класс для работы с фидом
export class FeedClient extends ApiClient {
  async getFeed(filters: FeedFilters = {}) {
    let query = supabase
      .from('feed_items')
      .select(`
        id, 
        user_id, 
        content, 
        type, 
        url, 
        thumbnail_url, 
        title, 
        description, 
        created_at, 
        updated_at,
        user:profiles(id, name, avatar_url),
        feed_item_likes(count),
        feed_item_user_likes:user_feed_item_likes(feed_item_id)
      `)
      .order('created_at', { ascending: false });

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Преобразуем данные для добавления флагов лайков и избранного
    const feedItems = data.map(item => {
      const feedItem: FeedItem = {
        id: item.id,
        user_id: item.user_id,
        content: item.content,
        type: item.type,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
        title: item.title,
        description: item.description,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: {
          id: item.user.id,
          name: item.user.name,
          avatar_url: item.user.avatar_url,
        },
        likes_count: item.feed_item_likes?.[0]?.count || 0,
        is_liked: item.feed_item_user_likes && item.feed_item_user_likes.length > 0,
        is_favorite: false, // Пока не реализовано, можно добавить позже
      };
      return feedItem;
    });

    return { data: feedItems, count };
  }

  async getUserFeed(userId: string, filters: FeedFilters = {}) {
    let query = supabase
      .from('feed_items')
      .select(`
        id, 
        user_id, 
        content, 
        type, 
        url, 
        thumbnail_url, 
        title, 
        description, 
        created_at, 
        updated_at,
        user:profiles(id, name, avatar_url),
        feed_item_likes(count),
        feed_item_user_likes:user_feed_item_likes(feed_item_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const feedItems = data.map(item => {
      const feedItem: FeedItem = {
        id: item.id,
        user_id: item.user_id,
        content: item.content,
        type: item.type,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
        title: item.title,
        description: item.description,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: {
          id: item.user.id,
          name: item.user.name,
          avatar_url: item.user.avatar_url,
        },
        likes_count: item.feed_item_likes?.[0]?.count || 0,
        is_liked: item.feed_item_user_likes && item.feed_item_user_likes.length > 0,
        is_favorite: false,
      };
      return feedItem;
    });

    return { data: feedItems, count };
  }

  async toggleLike(feedItemId: string, shouldLike: boolean = true) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (shouldLike) {
      const { error } = await supabase
        .from('feed_item_likes')
        .insert({ feed_item_id: feedItemId, user_id: user.id });
      
      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase
        .from('feed_item_likes')
        .delete()
        .match({ feed_item_id: feedItemId, user_id: user.id });
      
      if (error) {
        throw new Error(error.message);
      }
    }

    // Обновляем количество лайков
    const { count, error: countError } = await supabase
      .from('feed_item_likes')
      .select('*', { count: 'exact', head: true })
      .eq('feed_item_id', feedItemId);

    if (countError) {
      throw new Error(countError.message);
    }

    return { liked: shouldLike, likes_count: count };
  }

  async toggleFavorite(feedItemId: string, shouldFavorite: boolean = true) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // В Supabase у нас нет таблицы избранных элементов, поэтому временно возвращаем заглушку
    // В реальном приложении нужно создать таблицу user_favorites
    return { favorited: shouldFavorite };
  }

  async subscribeToUser(targetUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_follows')
      .insert({ follower_id: user.id, following_id: targetUserId });
    
    if (error) {
      throw new Error(error.message);
    }

    return { subscribed: true };
  }

  async unsubscribeFromUser(targetUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .match({ follower_id: user.id, following_id: targetUserId });
    
    if (error) {
      throw new Error(error.message);
    }

    return { subscribed: false };
  }

  async isFollowing(userId: string, targetUserId: string) {
    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .match({ follower_id: userId, following_id: targetUserId })
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 означает "Row not found"
      throw new Error(error.message);
    }

    return !!data;
  }

  async getFollowers(userId: string) {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        id,
        follower_id,
        profiles(id, name, avatar_url)
      `)
      .eq('following_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return data.map(follow => ({
      id: follow.id,
      follower_id: follow.follower_id,
      user: follow.profiles
    }));
  }

  async getFollowing(userId: string) {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        id,
        following_id,
        profiles(id, name, avatar_url)
      `)
      .eq('follower_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return data.map(follow => ({
      id: follow.id,
      following_id: follow.following_id,
      user: follow.profiles
    }));
 }
}

export const feedClient = new FeedClient();