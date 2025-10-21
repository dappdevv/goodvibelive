import { apiClient } from './client';

// Типы для социальных взаимодействий
export interface Follow {
  id: string;
  follower_id: string;
 following_id: string;
  created_at: string;
  follower?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  following?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface Like {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'post' | 'comment' | 'profile';
  created_at: string;
}

export interface Donation {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  message?: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  receiver?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface Comment {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'post' | 'comment'; // комментарий к посту или комментарию (ответ)
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string; // для ответов на комментарии
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  likes_count: number;
  is_liked?: boolean;
}

// Клиент для социальных взаимодействий
class SocialApi {
  // Подписаться на пользователя
 async followUser(userId: string): Promise<{ error: Error | null; data?: Follow }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    if (user.id === userId) {
      return { error: new Error('Cannot follow yourself') };
    }

    try {
      // Проверяем, существует ли пользователь, на которого подписываются
      const { data: targetUser, error: userError } = await apiClient.getSupabase()
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError) {
        return { error: new Error('User not found') };
      }

      // Проверяем, не подписаны ли уже на этого пользователя
      const { data: existingFollow, error: existingError } = await apiClient.getSupabase()
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (existingFollow) {
        return { error: new Error('Already following this user') };
      }

      // Создаем запись о подписке
      const followData = {
        follower_id: user.id,
        following_id: userId
      };

      const result = await apiClient.getSupabase()
        .from('user_follows')
        .insert([followData])
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Возвращаем данные с информацией о подписчике и подписке
      const followWithUsers = {
        ...result.data,
        follower: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url
        },
        following: {
          id: targetUser.id,
          username: targetUser.username,
          avatar_url: targetUser.avatar_url
        }
      };

      return { error: null, data: followWithUsers as Follow };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Отписаться от пользователя
  async unfollowUser(userId: string): Promise<{ error: Error | null; success: boolean }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    try {
      const result = await apiClient.getSupabase()
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (result.error) {
        return { error: apiClient.handleApiError(result.error).error as Error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      return { error: apiClient.handleApiError(error).error as Error, success: false };
    }
  }

 // Получить список подписчиков пользователя
  async getFollowers(userId: string, limit: number = 20, offset: number = 0): Promise<{ error: Error | null; data?: Follow[] }> {
    try {
      const result = await apiClient.getSupabase()
        .from('user_follows')
        .select(`
          id,
          follower_id,
          following_id,
          created_at,
          followers:users!user_follows_follower_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Преобразуем результат, чтобы данные подписчика были на верхнем уровне
      const follows = result.data.map(follow => ({
        ...follow,
        follower: follow.followers,
        following: {
          id: userId,
          username: '', // Будет заполнено при необходимости отдельным запросом
          avatar_url: ''
        }
      }));

      // Удаляем вложенные данные
      follows.forEach(follow => delete follow.followers);

      return { error: null, data: follows as Follow[] };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить список подписок пользователя
 async getFollowing(userId: string, limit: number = 20, offset: number = 0): Promise<{ error: Error | null; data?: Follow[] }> {
    try {
      const result = await apiClient.getSupabase()
        .from('user_follows')
        .select(`
          id,
          follower_id,
          following_id,
          created_at,
          followings:users!user_follows_following_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Преобразуем результат, чтобы данные подписки были на верхнем уровне
      const follows = result.data.map(follow => ({
        ...follow,
        following: follow.followings,
        follower: {
          id: userId,
          username: '', // Будет заполнено при необходимости отдельным запросом
          avatar_url: ''
        }
      }));

      // Удаляем вложенные данные
      follows.forEach(follow => delete follow.followings);

      return { error: null, data: follows as Follow[] };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Проверить, подписан ли пользователь на другого пользователя
 async isFollowing(followerId: string, followingId: string): Promise<{ error: Error | null; data?: boolean }> {
    try {
      const { data, error } = await apiClient.getSupabase()
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 означает "Row not found"
        return apiClient.handleApiError(error);
      }

      return { error: null, data: !!data };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Поставить лайк
  async likeItem(itemId: string, itemType: 'post' | 'comment' | 'profile'): Promise<{ error: Error | null; data?: Like }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Проверяем, существует ли элемент, которому ставим лайк
      let exists = false;
      let existsError = null;

      switch (itemType) {
        case 'post':
          const { error: postError } = await apiClient.getSupabase()
            .from('posts')
            .select('id', { head: true })
            .eq('id', itemId)
            .single();
          exists = !postError;
          existsError = postError;
          break;
        case 'comment':
          const { error: commentError } = await apiClient.getSupabase()
            .from('comments')
            .select('id', { head: true })
            .eq('id', itemId)
            .single();
          exists = !commentError;
          existsError = commentError;
          break;
        case 'profile':
          const { error: profileError } = await apiClient.getSupabase()
            .from('users')
            .select('id', { head: true })
            .eq('id', itemId)
            .single();
          exists = !profileError;
          existsError = profileError;
          break;
      }

      if (!exists) {
        return { error: new Error(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found`) };
      }

      // Проверяем, не поставлен ли уже лайк
      const { data: existingLike, error: existingError } = await apiClient.getSupabase()
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .single();

      if (existingLike) {
        return { error: new Error('Like already exists') };
      }

      // Создаем запись о лайке
      const likeData = {
        user_id: user.id,
        item_id: itemId,
        item_type: itemType
      };

      const result = await apiClient.getSupabase()
        .from('likes')
        .insert([likeData])
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      return { error: null, data: result.data as Like };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Убрать лайк
  async unlikeItem(itemId: string, itemType: 'post' | 'comment' | 'profile'): Promise<{ error: Error | null; success: boolean }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    try {
      const result = await apiClient.getSupabase()
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      if (result.error) {
        return { error: apiClient.handleApiError(result.error).error as Error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      return { error: apiClient.handleApiError(error).error as Error, success: false };
    }
  }

  // Проверить, поставлен ли лайк
  async isLiked(userId: string, itemId: string, itemType: 'post' | 'comment' | 'profile'): Promise<{ error: Error | null; data?: boolean }> {
    try {
      const { data, error } = await apiClient.getSupabase()
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 означает "Row not found"
        return apiClient.handleApiError(error);
      }

      return { error: null, data: !!data };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Сделать донат пользователю
  async makeDonation(userId: string, amount: number, message?: string): Promise<{ error: Error | null; data?: Donation }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    if (user.id === userId) {
      return { error: new Error('Cannot donate to yourself') };
    }

    if (amount <= 0) {
      return { error: new Error('Donation amount must be positive') };
    }

    try {
      // Проверяем, существует ли получатель
      const { data: receiver, error: receiverError } = await apiClient.getSupabase()
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (receiverError) {
        return { error: new Error('Receiver not found') };
      }

      // Проверяем баланс пользователя
      const { data: userBalance, error: balanceError } = await this.getUserBalance();
      if (balanceError) {
        return { error: new Error('Could not verify user balance') };
      }

      if (userBalance && userBalance < amount) {
        return { error: new Error('Insufficient balance') };
      }

      // Списываем средства с баланса отправителя
      const debitResult = await this.debitUserBalance(amount, `Donation to user ${userId}`);
      if (debitResult.error) {
        return { error: new Error('Failed to debit balance for donation') };
      }

      // Начисляем средства получателю
      const creditResult = await this.creditUserBalance(userId, amount, `Donation from user ${user.id}`);
      if (creditResult.error) {
        // Если не удалось зачислить средства получателю, возвращаем средства отправителю
        await this.creditUserBalance(user.id, amount, 'Donation reversal due to failed credit to receiver');
        return { error: new Error('Failed to credit donation to receiver') };
      }

      // Создаем запись о донате
      const donationData = {
        sender_id: user.id,
        receiver_id: userId,
        amount,
        message
      };

      const result = await apiClient.getSupabase()
        .from('donations')
        .insert([donationData])
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Возвращаем данные с информацией об отправителе и получателе
      const donationWithUsers = {
        ...result.data,
        sender: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url
        },
        receiver: {
          id: receiver.id,
          username: receiver.username,
          avatar_url: receiver.avatar_url
        }
      };

      return { error: null, data: donationWithUsers as Donation };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить донаты пользователя (полученные или отправленные)
  async getUserDonations(
    userId: string,
    type: 'received' | 'sent' = 'received',
    limit: number = 20,
    offset: number = 0
  ): Promise<{ error: Error | null; data?: Donation[] }> {
    const currentUser = await apiClient.getCurrentUser();
    if (!currentUser) {
      return { error: new Error('User not authenticated') };
    }

    try {
      let query = apiClient.getSupabase()
        .from('donations')
        .select(`
          id,
          sender_id,
          receiver_id,
          amount,
          message,
          created_at,
          senders:users!donations_sender_id_fkey (
            id,
            username,
            avatar_url
          ),
          receivers:users!donations_receiver_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type === 'received') {
        query = query.eq('receiver_id', userId);
      } else {
        query = query.eq('sender_id', userId);
      }

      const result = await apiClient.executeRequest<Donation[]>(query);

      if (result.data) {
        // Преобразуем результат, чтобы данные отправителя и получателя были на верхнем уровне
        result.data = result.data.map(donation => ({
          ...donation,
          sender: donation.senders,
          receiver: donation.receivers
        }));
      }

      return result;
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Добавить комментарий
  async addComment(itemId: string, itemType: 'post' | 'comment', content: string, parentId?: string): Promise<{ error: Error | null; data?: Comment }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    if (!content.trim()) {
      return { error: new Error('Comment content cannot be empty') };
    }

    if (content.length > 1000) {
      return { error: new Error('Comment content is too long (max 1000 characters)') };
    }

    try {
      // Проверяем, существует ли элемент, к которому добавляем комментарий
      let exists = false;
      let existsError = null;

      if (itemType === 'post') {
        const { error: postError } = await apiClient.getSupabase()
          .from('posts')
          .select('id', { head: true })
          .eq('id', itemId)
          .single();
        exists = !postError;
        existsError = postError;
      } else if (itemType === 'comment') {
        const { error: commentError } = await apiClient.getSupabase()
          .from('comments')
          .select('id', { head: true })
          .eq('id', itemId)
          .single();
        exists = !commentError;
        existsError = commentError;
      }

      if (!exists) {
        return { error: new Error(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found`) };
      }

      // Если это ответ на комментарий, проверяем, что родительский комментарий существует
      if (parentId) {
        const { error: parentError } = await apiClient.getSupabase()
          .from('comments')
          .select('id', { head: true })
          .eq('id', parentId)
          .single();
        
        if (parentError) {
          return { error: new Error('Parent comment not found') };
        }
      }

      // Создаем запись о комментарии
      const commentData: any = {
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
        content: content.trim()
      };

      if (parentId) {
        commentData.parent_id = parentId;
      }

      const result = await apiClient.getSupabase()
        .from('comments')
        .insert([commentData])
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Возвращаем комментарий с информацией о пользователе
      const commentWithUser = {
        ...result.data,
        user: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url
        },
        likes_count: 0, // Новый комментарий не имеет лайков
        is_liked: false // Пользователь не лайкал свой же комментарий
      };

      return { error: null, data: commentWithUser as Comment };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить комментарии к элементу
  async getItemComments(
    itemId: string,
    itemType: 'post' | 'comment',
    limit: number = 20,
    offset: number = 0
  ): Promise<{ error: Error | null; data?: Comment[] }> {
    const user = await apiClient.getCurrentUser();

    try {
      let query = apiClient.getSupabase()
        .from('comments')
        .select(`
          id,
          user_id,
          item_type,
          content,
          created_at,
          updated_at,
          parent_id,
          users (
            id,
            username,
            avatar_url
          )
        `)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .is('parent_id', null) // Получаем только основные комментарии, не ответы
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const result = await apiClient.executeRequest<Comment[]>(query);

      if (result.data && result.data.length > 0) {
        // Добавляем информацию о лайках для каждого комментария
        const commentIds = result.data.map(comment => comment.id);
        
        // Получаем количество лайков для каждого комментария
        const { data: likesCounts, error: likesError } = await apiClient.getSupabase()
          .from('likes')
          .select('item_id, count(*)')
          .in('item_id', commentIds)
          .eq('item_type', 'comment')
          .group('item_id');

        if (!likesError && likesCounts) {
          const likesMap = new Map(likesCounts.map(like => [like.item_id, parseInt(like.count)]));
          result.data = result.data.map(comment => ({
            ...comment,
            likes_count: likesMap.get(comment.id) || 0,
            user: comment.users,
            is_liked: false // Значение будет обновлено ниже, если пользователь авторизован
          }));
          
          // Удаляем вложенное свойство users
          result.data.forEach(comment => delete comment.users);
        }

        // Если пользователь авторизован, определяем, какие комментарии он лайкнул
        if (user) {
          const { data: userLikes, error: userLikesError } = await apiClient.getSupabase()
            .from('likes')
            .select('item_id')
            .eq('user_id', user.id)
            .eq('item_type', 'comment')
            .in('item_id', commentIds);
            
          if (!userLikesError && userLikes) {
            const likedCommentIds = new Set(userLikes.map(like => like.item_id));
            result.data = result.data.map(comment => ({
              ...comment,
              is_liked: likedCommentIds.has(comment.id)
            }));
          }
        }
      }

      return result;
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Приватные методы для внутреннего использования

  // Получить баланс пользователя
  private async getUserBalance(): Promise<{ error: Error | null; data?: number }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const result = await apiClient.getSupabase()
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (result.error) {
        if (result.error.code === 'PGRST116') { // Row not found
          // Если баланс не найден, возвращаем 0
          return { error: null, data: 0 };
        }
        return apiClient.handleApiError(result.error);
      }

      return { error: null, data: result.data.balance };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Списать средства с баланса пользователя
  private async debitUserBalance(amount: number, description: string): Promise<{ error: Error | null }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Получаем текущий баланс
      const { data: currentBalance, error: balanceError } = await this.getUserBalance();
      if (balanceError) {
        return balanceError;
      }

      if (currentBalance !== undefined && currentBalance < amount) {
        return { error: new Error('Insufficient balance') };
      }

      // Обновляем баланс
      const result = await apiClient.getSupabase()
        .from('user_balances')
        .upsert({
          user_id: user.id,
          balance: (currentBalance || 0) - amount
        }, { onConflict: 'user_id' });

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Создаем запись о транзакции
      await apiClient.getSupabase()
        .from('balance_transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          type: 'debit',
          description: description,
          balance_after: (currentBalance || 0) - amount
        });

      return { error: null };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Начислить средства пользователю
 private async creditUserBalance(userId: string, amount: number, description: string): Promise<{ error: Error | null }> {
    try {
      // Получаем текущий баланс получателя
      const { data: currentBalance, error: balanceError } = await apiClient.getSupabase()
        .from('user_balances')
        .select('balance, currency')
        .eq('user_id', userId)
        .single();

      let newBalance = amount;
      let currency = 'USD';

      if (!balanceError && currentBalance) {
        newBalance = currentBalance.balance + amount;
        currency = currentBalance.currency;
      }

      // Обновляем баланс получателя
      await apiClient.getSupabase()
        .from('user_balances')
        .upsert({
          user_id: userId,
          balance: newBalance,
          currency: currency
        }, { onConflict: 'user_id' });

      // Создаем запись о транзакции для получателя
      await apiClient.getSupabase()
        .from('balance_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          type: 'credit',
          description: description,
          balance_after: newBalance
        });

      return { error: null };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }
}

// Экземпляр API клиента для социальных взаимодействий
export const socialApi = new SocialApi();