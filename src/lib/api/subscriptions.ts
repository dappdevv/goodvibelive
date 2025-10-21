import { apiClient } from './client';

// Типы для системы подписок
export interface SubscriptionPlan {
  id: string;
  name: string;
 description: string;
 price: number;
 currency: string;
 duration_days: number; // продолжительность подписки в днях
  features: string[]; // список возможностей
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  auto_renew: boolean;
  plan?: SubscriptionPlan;
}

export interface SubscriptionPayment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionData {
  plan_id: string;
  auto_renew?: boolean;
}

// Клиент для системы подписок
class SubscriptionsApi {
  // Получить доступные тарифные планы
  async getSubscriptionPlans(): Promise<{ error: Error | null; data?: SubscriptionPlan[] }> {
    try {
      const result = await apiClient.getSupabase()
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      return { error: null, data: result.data as SubscriptionPlan[] };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить текущую подписку пользователя
  async getCurrentSubscription(): Promise<{ error: Error | null; data?: UserSubscription }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const result = await apiClient.getSupabase()
        .from('user_subscriptions')
        .select(`
          id,
          user_id,
          plan_id,
          start_date,
          expiry_date,
          status,
          auto_renew,
          subscription_plans (
            id,
            name,
            description,
            price,
            currency,
            duration_days,
            features
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'pending'])
        .order('expiry_date', { ascending: false })
        .single();

      if (result.error) {
        if (result.error.code === 'PGRST116') { // Row not found
          return { error: null, data: undefined };
        }
        return apiClient.handleApiError(result.error);
      }

      // Преобразуем результат, чтобы данные плана были на верхнем уровне
      const subscription = {
        ...result.data,
        plan: result.data.subscription_plans
      };

      delete subscription.subscription_plans;

      return { error: null, data: subscription as UserSubscription };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить историю подписок пользователя
  async getSubscriptionHistory(): Promise<{ error: Error | null; data?: UserSubscription[] }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const result = await apiClient.getSupabase()
        .from('user_subscriptions')
        .select(`
          id,
          user_id,
          plan_id,
          start_date,
          expiry_date,
          status,
          auto_renew,
          subscription_plans (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Преобразуем результат, чтобы данные плана были на верхнем уровне
      const subscriptions = result.data.map(sub => ({
        ...sub,
        plan: sub.subscription_plans
      }));

      // Удаляем вложенные данные плана
      subscriptions.forEach(sub => delete sub.subscription_plans);

      return { error: null, data: subscriptions as UserSubscription[] };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Создать новую подписку
  async createSubscription(subscriptionData: CreateSubscriptionData): Promise<{ error: Error | null; data?: UserSubscription }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Получаем информацию о выбранном плане
      const { data: plan, error: planError } = await apiClient.getSupabase()
        .from('subscription_plans')
        .select('*')
        .eq('id', subscriptionData.plan_id)
        .eq('is_active', true)
        .single();

      if (planError) {
        return { error: new Error('Invalid or inactive subscription plan') };
      }

      // Проверяем баланс пользователя
      const { data: userBalance, error: balanceError } = await this.getUserBalance();
      if (balanceError) {
        return { error: new Error('Could not verify user balance') };
      }

      if (userBalance && userBalance < plan.price) {
        return { error: new Error('Insufficient balance') };
      }

      // Списываем средства за подписку
      const debitResult = await this.debitUserBalance(plan.price);
      if (debitResult.error) {
        return { error: new Error('Failed to debit balance for subscription') };
      }

      // Создаем запись о платеже
      const paymentData = {
        user_id: user.id,
        plan_id: subscriptionData.plan_id,
        amount: plan.price,
        currency: plan.currency,
        status: 'completed'
      };

      const paymentResult = await apiClient.getSupabase()
        .from('subscription_payments')
        .insert([paymentData])
        .select()
        .single();

      if (paymentResult.error) {
        return apiClient.handleApiError(paymentResult.error);
      }

      // Определяем даты начала и окончания подписки
      const startDate = new Date().toISOString();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + plan.duration_days);
      
      // Создаем запись о подписке
      const subscriptionDataToInsert = {
        user_id: user.id,
        plan_id: subscriptionData.plan_id,
        start_date: startDate,
        expiry_date: expiryDate.toISOString(),
        status: 'active',
        auto_renew: subscriptionData.auto_renew ?? false
      };

      const result = await apiClient.getSupabase()
        .from('user_subscriptions')
        .insert([subscriptionDataToInsert])
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Добавляем информацию о плане к результату
      const subscriptionWithPlan = {
        ...result.data,
        plan: plan
      };

      return { error: null, data: subscriptionWithPlan as UserSubscription };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Продлить текущую подписку
 async renewSubscription(autoRenew?: boolean): Promise<{ error: Error | null; data?: UserSubscription }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Получаем текущую активную подписку
      const currentSubscription = await this.getCurrentSubscription();
      if (!currentSubscription.data) {
        return { error: new Error('No active subscription to renew') };
      }

      // Получаем информацию о плане текущей подписки
      const { data: plan, error: planError } = await apiClient.getSupabase()
        .from('subscription_plans')
        .select('*')
        .eq('id', currentSubscription.data.plan_id)
        .single();

      if (planError) {
        return { error: new Error('Could not retrieve subscription plan') };
      }

      // Проверяем баланс пользователя
      const { data: userBalance, error: balanceError } = await this.getUserBalance();
      if (balanceError) {
        return { error: new Error('Could not verify user balance') };
      }

      if (userBalance && userBalance < plan.price) {
        return { error: new Error('Insufficient balance') };
      }

      // Списываем средства за продление
      const debitResult = await this.debitUserBalance(plan.price);
      if (debitResult.error) {
        return { error: new Error('Failed to debit balance for subscription renewal') };
      }

      // Создаем запись о платеже
      const paymentData = {
        user_id: user.id,
        plan_id: currentSubscription.data.plan_id,
        amount: plan.price,
        currency: plan.currency,
        status: 'completed'
      };

      const paymentResult = await apiClient.getSupabase()
        .from('subscription_payments')
        .insert([paymentData])
        .select()
        .single();

      if (paymentResult.error) {
        return apiClient.handleApiError(paymentResult.error);
      }

      // Продлеваем дату окончания подписки
      const newExpiryDate = new Date(currentSubscription.data.expiry_date);
      newExpiryDate.setDate(newExpiryDate.getDate() + plan.duration_days);

      const result = await apiClient.getSupabase()
        .from('user_subscriptions')
        .update({
          expiry_date: newExpiryDate.toISOString(),
          status: 'active',
          auto_renew: autoRenew ?? currentSubscription.data.auto_renew
        })
        .eq('id', currentSubscription.data.id)
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Добавляем информацию о плане к результату
      const updatedSubscription = {
        ...result.data,
        plan: plan
      };

      return { error: null, data: updatedSubscription as UserSubscription };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Отменить подписку
  async cancelSubscription(subscriptionId: string): Promise<{ error: Error | null; data?: UserSubscription }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Проверяем, что подписка принадлежит пользователю
      const { data: subscription, error: subscriptionError } = await apiClient.getSupabase()
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', user.id)
        .single();

      if (subscriptionError) {
        return { error: new Error('Subscription not found or does not belong to user') };
      }

      // Если подписка уже отменена или истекла, возвращаем ошибку
      if (subscription.status === 'expired' || subscription.status === 'cancelled') {
        return { error: new Error('Subscription is already cancelled or expired') };
      }

      // Обновляем статус подписки на отмененную
      const result = await apiClient.getSupabase()
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          auto_renew: false
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Добавляем информацию о плане к результату
      const { data: plan, error: planError } = await apiClient.getSupabase()
        .from('subscription_plans')
        .select('*')
        .eq('id', result.data.plan_id)
        .single();

      const subscriptionWithPlan = {
        ...result.data,
        plan: planError ? undefined : plan
      };

      return { error: null, data: subscriptionWithPlan as UserSubscription };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Включить/выключить автопродление
 async toggleAutoRenew(subscriptionId: string, autoRenew: boolean): Promise<{ error: Error | null; data?: UserSubscription }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Проверяем, что подписка принадлежит пользователю
      const { data: subscription, error: subscriptionError } = await apiClient.getSupabase()
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', user.id)
        .single();

      if (subscriptionError) {
        return { error: new Error('Subscription not found or does not belong to user') };
      }

      // Обновляем статус автопродления
      const result = await apiClient.getSupabase()
        .from('user_subscriptions')
        .update({
          auto_renew: autoRenew
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Добавляем информацию о плане к результату
      const { data: plan, error: planError } = await apiClient.getSupabase()
        .from('subscription_plans')
        .select('*')
        .eq('id', result.data.plan_id)
        .single();

      const subscriptionWithPlan = {
        ...result.data,
        plan: planError ? undefined : plan
      };

      return { error: null, data: subscriptionWithPlan as UserSubscription };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить статус подписки пользователя
 async getSubscriptionStatus(): Promise<{ error: Error | null; data?: { status: string; expires_at: string | null } }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Получаем текущую подписку
      const subscription = await this.getCurrentSubscription();

      if (!subscription.data) {
        return { error: null, data: { status: 'inactive', expires_at: null } };
      }

      const currentDate = new Date();
      const expiryDate = new Date(subscription.data.expiry_date);

      let status = subscription.data.status;
      if (currentDate > expiryDate && status === 'active') {
        status = 'expired';

        // Обновляем статус в базе данных
        await apiClient.getSupabase()
          .from('user_subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.data.id);
      }

      return { error: null, data: { status, expires_at: subscription.data.expiry_date } };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить платежи по подписке
  async getSubscriptionPayments(
    subscriptionId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ error: Error | null; data?: SubscriptionPayment[] }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      let query = apiClient.getSupabase()
        .from('subscription_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (subscriptionId) {
        query = query.eq('subscription_id', subscriptionId);
      }

      const result = await apiClient.executeRequest<SubscriptionPayment[]>(query);
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
  private async debitUserBalance(amount: number): Promise<{ error: Error | null }> {
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
          description: 'Subscription payment',
          balance_after: (currentBalance || 0) - amount
        });

      return { error: null };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }
}

// Экземпляр API клиента для системы подписок
export const subscriptionsApi = new SubscriptionsApi();