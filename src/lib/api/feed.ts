import { supabase } from '@/lib/supabaseClient';

export interface Media {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  image_url: string;
  type: 'image' | 'video' | 'music' | 'post';
  created_at: string;
  likes_count: number;
  views_count: number;
}

export interface Music {
  id: string;
  user_id: string;
  title: string;
  genre: string;
  audio_url: string;
  duration: number;
  created_at: string;
  likes_count: number;
}

// Fetch generated images
export async function fetchGeneratedImages(limit = 6) {
  try {
    // Mock data for now
    return {
      data: [
        {
          id: '1',
          title: 'Mountain Sunset',
          image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
          type: 'image',
          likes_count: 124,
          views_count: 512,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Portrait',
          image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          type: 'image',
          likes_count: 87,
          views_count: 321,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Abstract Art',
          image_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=400&fit=crop',
          type: 'image',
          likes_count: 256,
          views_count: 1024,
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

// Fetch generated videos
export async function fetchGeneratedVideos(limit = 3) {
  try {
    return {
      data: [
        {
          id: '1',
          title: 'Food Video',
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
          type: 'video',
          likes_count: 43,
          views_count: 234,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Beach Scene',
          image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
          type: 'video',
          likes_count: 156,
          views_count: 789,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Creative Writing',
          image_url: 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?w=400&h=400&fit=crop',
          type: 'video',
          likes_count: 98,
          views_count: 456,
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

// Fetch user posts
export async function fetchUserPosts(limit = 3) {
  try {
    return {
      data: [
        {
          id: '1',
          title: 'Adventure Travels',
          image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop',
          type: 'post',
          likes_count: 234,
          views_count: 1200,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Creative Writing',
          image_url: 'https://images.unsplash.com/photo-1507842072343-583f20270319?w=400&h=400&fit=crop',
          type: 'post',
          likes_count: 189,
          views_count: 945,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Tech Innovations',
          image_url: 'https://images.unsplash.com/photo-1518235506717-e1ed3306a326?w=400&h=400&fit=crop',
          type: 'post',
          likes_count: 412,
          views_count: 2100,
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

// Fetch generated music
export async function fetchGeneratedMusic(limit = 3) {
  try {
    return {
      data: [
        {
          id: '1',
          title: 'Music #1',
          genre: 'Deep House',
          audio_url: 'https://example.com/music1.mp3',
          duration: 240,
          likes_count: 67,
          views_count: 334,
          created_at: new Date().toISOString(),
          user_id: 'user1',
        },
        {
          id: '2',
          title: 'Deep House',
          genre: 'Electronic',
          audio_url: 'https://example.com/music2.mp3',
          duration: 300,
          likes_count: 145,
          views_count: 725,
          created_at: new Date().toISOString(),
          user_id: 'user1',
        },
      ],
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

// Like/Unlike media
export async function toggleLike(mediaId: string, userId: string, liked: boolean) {
  try {
    if (liked) {
      // Remove like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('media_id', mediaId)
        .eq('user_id', userId);
      
      return { success: !error, error };
    } else {
      // Add like
      const { error } = await supabase
        .from('likes')
        .insert([{ media_id: mediaId, user_id: userId }]);
      
      return { success: !error, error };
    }
  } catch (error) {
    return { success: false, error };
  }
}

// Add/Remove favorite
export async function toggleFavorite(mediaId: string, userId: string, favorited: boolean) {
  try {
    if (favorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('media_id', mediaId)
        .eq('user_id', userId);
      
      return { success: !error, error };
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ media_id: mediaId, user_id: userId }]);
      
      return { success: !error, error };
    }
  } catch (error) {
    return { success: false, error };
  }
}
