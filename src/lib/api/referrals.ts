import { apiClient } from './client';

// Типы для реферальной системы
export interface Referral {
  id: string;
  user_id: string;
  referred_user_id: string;
  referral_code: string;
  commission_rate: number;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  referred_user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface ReferralCommission {
  id: string;
  user_id: string;
  referral_id: string;
  amount: number;
  commission_rate: number;
 source: string; // 'generation', 'subscription', 'gift', etc.
 status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
}

export interface CreateReferralData {
  referral_code: string;
}

// Клиент для реферальной системы
class ReferralsApi {
  // Получить реферальный код текущего пользователя
  async getReferralCode(): Promise<{ error: Error | null; data?: string }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { data, error } = await apiClient.getSupabase()
        .from('users')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (error) {
        return apiClient.handleApiError(error);
      }

      return { error: null, data: data.referral_code };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить список рефералов пользователя
  async getReferrals(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ error: Error | null; data?: Referral[] }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const result = await apiClient.getSupabase()
        .from('referrals')
        .select(`
          id,
          user_id,
          referred_user_id,
          commission_rate,
          created_at,
          users!referrals_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          referred_users:users!referrals_referred_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Преобразуем результат, чтобы поля пользователя и реферала были на верхнем уровне
      const referrals = result.data.map(referral => ({
        ...referral,
        user: referral.users,
        referred_user: referral.referred_users
      }));

      return { error: null, data: referrals as Referral[] };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить статистику по рефералам
  async getReferralStats(): Promise<{ error: Error | null; data?: ReferralStats }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Общее количество рефералов
      const { count: totalReferrals, error: countError } = await apiClient.getSupabase()
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        return apiClient.handleApiError(countError);
      }

      // Активные рефералы (пользователи, которые зарегистрировались и, возможно, совершили действия)
      const { count: activeReferrals, error: activeError } = await apiClient.getSupabase()
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('referred_user_id', 'is', null);

      if (activeError) {
        return apiClient.handleApiError(activeError);
      }

      // Общая сумма комиссий
      const { data: totalCommissionData, error: totalCommissionError } = await apiClient.getSupabase()
        .from('referral_commissions')
        .select('amount')
        .eq('user_id', user.id);

      if (totalCommissionError) {
        return apiClient.handleApiError(totalCommissionError);
      }

      const totalCommission = totalCommissionData?.reduce((sum, commission) => sum + commission.amount, 0) || 0;

      // Сумма ожидаемых комиссий
      const { data: pendingCommissionData, error: pendingCommissionError } = await apiClient.getSupabase()
        .from('referral_commissions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (pendingCommissionError) {
        return apiClient.handleApiError(pendingCommissionError);
      }

      const pendingCommission = pendingCommissionData?.reduce((sum, commission) => sum + commission.amount, 0) || 0;

      // Сумма выплаченных комиссий
      const { data: paidCommissionData, error: paidCommissionError } = await apiClient.getSupabase()
        .from('referral_commissions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'paid');

      if (paidCommissionError) {
        return apiClient.handleApiError(paidCommissionError);
      }

      const paidCommission = paidCommissionData?.reduce((sum, commission) => sum + commission.amount, 0) || 0;

      const stats: ReferralStats = {
        total_referrals: totalReferrals || 0,
        active_referrals: activeReferrals || 0,
        total_commission: totalCommission,
        pending_commission: pendingCommission,
        paid_commission: paidCommission
      };

      return { error: null, data: stats };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить историю комиссий
  async getCommissionHistory(
    status?: 'pending' | 'paid' | 'cancelled',
    limit: number = 20,
    offset: number = 0
  ): Promise<{ error: Error | null; data?: ReferralCommission[] }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      let query = apiClient.getSupabase()
        .from('referral_commissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const result = await apiClient.executeRequest<ReferralCommission[]>(query);
      return result;
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Создать рефералку (регистрация нового пользователя по реферальному коду)
  async createReferral(referralCode: string): Promise<{ error: Error | null; data?: Referral }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    // Проверяем, не является ли текущий пользователь тем, чей код используется
    if (user.referral_code === referralCode) {
      return { error: new Error('Cannot use your own referral code') };
    }

    try {
      // Находим пользователя, чей реферальный код используется
      const { data: referrer, error: referrerError } = await apiClient.getSupabase()
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError) {
        return { error: new Error('Invalid referral code') };
      }

      // Проверяем, не является ли пользователь уже рефералом для кого-то другого
      const { data: existingReferral, error: existingError } = await apiClient.getSupabase()
        .from('referrals')
        .select('id')
        .eq('referred_user_id', user.id)
        .single();

      if (existingReferral) {
        return { error: new Error('User is already associated with a referral') };
      }

      // Создаем запись о реферале
      const referralData = {
        user_id: referrer.id,
        referred_user_id: user.id,
        referral_code: referralCode,
        commission_rate: 0.1 // 10% комиссия по умолчанию
      };

      const result = await apiClient.getSupabase()
        .from('referrals')
        .insert([referralData])
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      return { error: null, data: result.data as Referral };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Применить реферальный код при регистрации
  async applyReferralCode(referralCode: string): Promise<{ error: Error | null }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Проверяем, действителен ли реферальный код
      const { data: referrer, error: referrerError } = await apiClient.getSupabase()
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError) {
        return { error: new Error('Invalid referral code') };
      }

      // Проверяем, не является ли пользователь уже рефералом
      const { data: existingReferral, error: existingError } = await apiClient.getSupabase()
        .from('referrals')
        .select('id')
        .eq('referred_user_id', user.id)
        .single();

      if (existingReferral) {
        return { error: new Error('Referral already applied') };
      }

      // Создаем запись о реферале
      const { error: referralError } = await apiClient.getSupabase()
        .from('referrals')
        .insert([{
          user_id: referrer.id,
          referred_user_id: user.id,
          referral_code: referralCode,
          commission_rate: 0.1 // 10% комиссия по умолчанию
        }]);

      if (referralError) {
        return apiClient.handleApiError(referralError);
      }

      // Начисляем бонус рефералу (новому пользователю)
      const { error: bonusError } = await this.awardReferralBonus(user.id);
      if (bonusError) {
        console.error('Error awarding referral bonus:', bonusError);
        // Не возвращаем ошибку, так как реферал уже создан
      }

      // Начисляем бонус рефереру
      const { error: referrerBonusError } = await this.awardReferrerBonus(referrer.id);
      if (referrerBonusError) {
        console.error('Error awarding referrer bonus:', referrerBonusError);
        // Не возвращаем ошибку, так как реферал уже создан
      }

      return { error: null };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Начислить бонус рефералу
 private async awardReferralBonus(userId: string): Promise<{ error: Error | null }> {
    try {
      // В реальном приложении здесь будет логика начисления бонуса рефералу
      // Например, добавление средств на баланс или начисление очков
      console.log(`Awarding referral bonus to user: ${userId}`);
      
      // Обновляем баланс пользователя
      const { error } = await apiClient.getSupabase()
        .from('user_balances')
        .upsert({
          user_id: userId,
          balance: 10 // Бонус в размере 10 единиц
        }, { onConflict: 'user_id' });

      if (error) {
        return apiClient.handleApiError(error);
      }

      // Создаем запись о транзакции
      await apiClient.getSupabase()
        .from('balance_transactions')
        .insert({
          user_id: userId,
          amount: 10,
          type: 'credit',
          description: 'Referral bonus',
          balance_after: 10
        });

      return { error: null };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Начислить бонус рефереру
  private async awardReferrerBonus(userId: string): Promise<{ error: Error | null }> {
    try {
      // В реальном приложении здесь будет логика начисления бонуса рефереру
      // Например, добавление средств на баланс или начисление очков
      console.log(`Awarding referrer bonus to user: ${userId}`);
      
      // Обновляем баланс пользователя
      const { error } = await apiClient.getSupabase()
        .from('user_balances')
        .upsert({
          user_id: userId,
          balance: 5 // Бонус в размере 5 единиц
        }, { onConflict: 'user_id' });

      if (error) {
        return apiClient.handleApiError(error);
      }

      // Создаем запись о транзакции
      await apiClient.getSupabase()
        .from('balance_transactions')
        .insert({
          user_id: userId,
          amount: 5,
          type: 'credit',
          description: 'Referrer bonus',
          balance_after: 5
        });

      return { error: null };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить реферальные коды друзей
  async getFriendReferralCodes(limit: number = 10): Promise<{ error: Error | null; data?: { username: string; referral_code: string }[] }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Находим пользователей, на которых подписан текущий пользователь
      const { data: following, error: followingError } = await apiClient.getSupabase()
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) {
        return apiClient.handleApiError(followingError);
      }

      if (!following || following.length === 0) {
        return { error: null, data: [] };
      }

      // Получаем реферальные коды для этих пользователей
      const followingIds = following.map(f => f.following_id);
      const { data, error } = await apiClient.getSupabase()
        .from('users')
        .select('username, referral_code')
        .in('id', followingIds);

      if (error) {
        return apiClient.handleApiError(error);
      }

      return { error: null, data };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }
}

// Экземпляр API клиента для реферальной системы
export const referralsApi = new ReferralsApi();