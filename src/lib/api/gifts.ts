import { apiClient } from './client';

// Типы для системы подарков
export interface Gift {
  id: string;
  sender_id: string;
  receiver_id: string;
  gift_type: 'virtual_item' | 'balance' | 'subscription' | 'content_generation';
  gift_value: number | string; // может быть сумма, ID предмета или тип генерации
  message?: string;
  status: 'sent' | 'delivered' | 'opened' | 'claimed';
  created_at: string;
  updated_at: string;
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

export interface SendGiftData {
  receiver_id: string;
  gift_type: 'virtual_item' | 'balance' | 'subscription' | 'content_generation';
  gift_value: number | string;
  message?: string;
}

export interface GiftType {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
}

// Клиент для системы подарков
class GiftsApi {
  // Отправить подарок
  async sendGift(giftData: SendGiftData): Promise<{ error: Error | null; data?: Gift }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Проверяем, что отправитель и получатель - разные пользователи
      if (user.id === giftData.receiver_id) {
        return { error: new Error('Cannot send gift to yourself') };
      }

      // Проверяем, существует ли получатель
      const { data: receiver, error: receiverError } = await apiClient.getSupabase()
        .from('users')
        .select('id')
        .eq('id', giftData.receiver_id)
        .single();

      if (receiverError) {
        return { error: new Error('Receiver not found') };
      }

      // Проверяем баланс пользователя, если подарок стоит денег
      if (await this.isPaidGift(giftData)) {
        const { data: userBalance, error: balanceError } = await this.getUserBalance();
        if (balanceError) {
          return { error: new Error('Could not verify user balance') };
        }

        const giftCost = await this.getGiftCost(giftData);
        if (userBalance && userBalance < giftCost) {
          return { error: new Error('Insufficient balance') };
        }

        // Списываем средства за подарок
        const debitResult = await this.debitUserBalance(giftCost);
        if (debitResult.error) {
          return { error: new Error('Failed to debit balance for gift') };
        }
      }

      // Создаем запись о подарке
      const giftRecord = {
        sender_id: user.id,
        receiver_id: giftData.receiver_id,
        gift_type: giftData.gift_type,
        gift_value: giftData.gift_value,
        message: giftData.message,
        status: 'sent'
      };

      const result = await apiClient.getSupabase()
        .from('gifts')
        .insert([giftRecord])
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Отправляем уведомление получателю (в реальном приложении)
      await this.sendGiftNotification(result.data.id);

      return { error: null, data: result.data as Gift };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить подарки пользователя (входящие)
  async getReceivedGifts(
    status?: 'sent' | 'delivered' | 'opened' | 'claimed',
    limit: number = 20,
    offset: number = 0
  ): Promise<{ error: Error | null; data?: Gift[] }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      let query = apiClient.getSupabase()
        .from('gifts')
        .select(`
          id,
          sender_id,
          receiver_id,
          gift_type,
          gift_value,
          message,
          status,
          created_at,
          updated_at,
          senders:users!gifts_sender_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const result = await apiClient.executeRequest<Gift[]>(query);

      if (result.data) {
        // Преобразуем результат, чтобы данные отправителя были на верхнем уровне
        result.data = result.data.map(gift => ({
          ...gift,
          sender: gift.senders
        }));
      }

      return result;
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить отправленные подарки
  async getSentGifts(
    status?: 'sent' | 'delivered' | 'opened' | 'claimed',
    limit: number = 20,
    offset: number = 0
  ): Promise<{ error: Error | null; data?: Gift[] }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      let query = apiClient.getSupabase()
        .from('gifts')
        .select(`
          id,
          sender_id,
          receiver_id,
          gift_type,
          gift_value,
          message,
          status,
          created_at,
          updated_at,
          receivers:users!gifts_receiver_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const result = await apiClient.executeRequest<Gift[]>(query);

      if (result.data) {
        // Преобразуем результат, чтобы данные получателя были на верхнем уровне
        result.data = result.data.map(gift => ({
          ...gift,
          receiver: gift.receivers
        }));
      }

      return result;
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Принять/открыть подарок
  async claimGift(giftId: string): Promise<{ error: Error | null; data?: Gift }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Проверяем, что подарок существует и предназначен этому пользователю
      const { data: gift, error: giftError } = await apiClient.getSupabase()
        .from('gifts')
        .select('*')
        .eq('id', giftId)
        .eq('receiver_id', user.id)
        .single();

      if (giftError) {
        return { error: new Error('Gift not found or does not belong to user') };
      }

      // Проверяем статус подарка
      if (gift.status === 'claimed' || gift.status === 'opened') {
        return { error: new Error('Gift already claimed') };
      }

      // Обновляем статус подарка
      const updateResult = await apiClient.getSupabase()
        .from('gifts')
        .update({ status: 'claimed', updated_at: new Date().toISOString() })
        .eq('id', giftId)
        .select()
        .single();

      if (updateResult.error) {
        return apiClient.handleApiError(updateResult.error);
      }

      // Выполняем действия в зависимости от типа подарка
      await this.processGift(updateResult.data);

      return { error: null, data: updateResult.data as Gift };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить доступные типы подарков
 async getGiftTypes(): Promise<{ error: Error | null; data?: GiftType[] }> {
    try {
      // В реальном приложении типы подарков могут храниться в отдельной таблице
      // Пока возвращаем предопределенные типы
      const giftTypes: GiftType[] = [
        {
          id: 'virtual_item_1',
          name: 'Цветы',
          description: 'Виртуальные цветы для поднятия настроения',
          price: 10,
          category: 'virtual_items',
          image_url: '/images/gifts/flowers.png'
        },
        {
          id: 'virtual_item_2',
          name: 'Сердечко',
          description: 'Виртуальное сердечко как знак внимания',
          price: 5,
          category: 'virtual_items',
          image_url: '/images/gifts/heart.png'
        },
        {
          id: 'virtual_item_3',
          name: 'Бриллиант',
          description: 'Виртуальный бриллиант как знак особой признательности',
          price: 50,
          category: 'virtual_items',
          image_url: '/images/gifts/diamond.png'
        },
        {
          id: 'balance_1',
          name: 'Бонус к балансу',
          description: 'Добавляет 10 единиц к балансу получателя',
          price: 10,
          category: 'balance',
          image_url: '/images/gifts/balance_bonus.png'
        },
        {
          id: 'subscription_1',
          name: 'Подписка на неделю',
          description: 'Подарочная подписка на 7 дней',
          price: 25,
          category: 'subscriptions',
          image_url: '/images/gifts/subscription.png'
        }
      ];

      return { error: null, data: giftTypes };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

 // Получить количество непрочитанных подарков
  async getUnreadGiftsCount(): Promise<{ error: Error | null; data?: number }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { count, error } = await apiClient.getSupabase()
        .from('gifts')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'sent');

      if (error) {
        return apiClient.handleApiError(error);
      }

      return { error: null, data: count || 0 };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Приватные методы для внутреннего использования

  // Проверить, является ли подарок платным
  private async isPaidGift(giftData: SendGiftData): Promise<boolean> {
    // В реальном приложении проверка может быть более сложной
    // В зависимости от типа и значения подарка
    return true; // Для простоты считаем все подарки платными
  }

  // Получить стоимость подарка
  private async getGiftCost(giftData: SendGiftData): Promise<number> {
    // В реальном приложении стоимость может зависеть от типа и значения подарка
    // Пока возвращаем фиксированную стоимость
    const giftTypes = await this.getGiftTypes();
    if (giftTypes.data) {
      const giftType = giftTypes.data.find(type => 
        type.id === `${giftData.gift_type}_${giftData.gift_value}` ||
        (type.category === giftData.gift_type && type.name.toLowerCase().includes(giftData.gift_value.toString().toLowerCase()))
      );
      if (giftType) {
        return giftType.price;
      }
    }
    
    // Если не найден конкретный тип, возвращаем стоимость по умолчанию
    return 10;
  }

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
          description: 'Gift purchase',
          balance_after: (currentBalance || 0) - amount
        });

      return { error: null };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Отправить уведомление о подарке
  private async sendGiftNotification(giftId: string): Promise<void> {
    // В реальном приложении здесь будет логика отправки уведомления
    // получателю подарка (например, через Push API, email или встроенную систему уведомлений)
    console.log(`Gift notification sent for gift ID: ${giftId}`);
  }

 // Обработать подарок в зависимости от его типа
  private async processGift(gift: Gift): Promise<void> {
    // В зависимости от типа подарка выполняем соответствующие действия
    switch (gift.gift_type) {
      case 'balance':
        // Начисляем баланс получателю
        await this.creditUserBalance(gift.receiver_id, Number(gift.gift_value));
        break;
      case 'subscription':
        // Продлеваем подписку получателя
        await this.extendSubscription(gift.receiver_id, gift.gift_value);
        break;
      case 'content_generation':
        // Выдаем пользователю кредиты на генерацию контента
        await this.addGenerationCredits(gift.receiver_id, Number(gift.gift_value));
        break;
      case 'virtual_item':
        // В реальном приложении можно добавить виртуальный предмет в инвентарь пользователя
        console.log(`Virtual item ${gift.gift_value} added to user ${gift.receiver_id}`);
        break;
      default:
        console.log(`Unknown gift type: ${gift.gift_type}`);
    }
  }

 // Начислить баланс пользователю
  private async creditUserBalance(userId: string, amount: number): Promise<void> {
    try {
      // Получаем текущий баланс
      const { data: currentBalance, error: balanceError } = await apiClient.getSupabase()
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      let newBalance = amount;
      if (!balanceError && currentBalance) {
        newBalance = currentBalance.balance + amount;
      }

      // Обновляем баланс
      await apiClient.getSupabase()
        .from('user_balances')
        .upsert({
          user_id: userId,
          balance: newBalance
        }, { onConflict: 'user_id' });

      // Создаем запись о транзакции
      await apiClient.getSupabase()
        .from('balance_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          type: 'credit',
          description: 'Gift balance',
          balance_after: newBalance
        });
    } catch (error) {
      console.error('Error crediting user balance:', error);
    }
  }

  // Продлить подписку пользователя
  private async extendSubscription(userId: string, subscriptionType: any): Promise<void> {
    try {
      // В реальном приложении здесь будет логика продления подписки
      // В зависимости от типа и длительности подписки
      console.log(`Extending subscription for user ${userId}, type: ${subscriptionType}`);
      
      // Обновляем дату окончания подписки в зависимости от типа
      const duration = this.getSubscriptionDuration(subscriptionType);
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + duration);
      
      await apiClient.getSupabase()
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          expiry_date: newExpiryDate.toISOString(),
          status: 'active'
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error extending subscription:', error);
    }
  }

  // Получить длительность подписки в днях
  private getSubscriptionDuration(subscriptionType: any): number {
    // В реальном приложении это будет зависеть от типа подписки
    if (subscriptionType === 'subscription_1') {
      return 7; // 7 дней для подарочной подписки
    }
    return 7; // По умолчанию 7 дней
  }

  // Добавить кредиты на генерацию контента
  private async addGenerationCredits(userId: string, credits: number): Promise<void> {
    try {
      // В реальном приложении здесь будет логика добавления кредитов на генерацию
      // которые можно использовать для создания контента
      console.log(`Adding ${credits} generation credits to user ${userId}`);
      
      // Обновляем количество кредитов пользователя
      const { data: currentCredits, error } = await apiClient.getSupabase()
        .from('user_generation_credits')
        .select('credits')
        .eq('user_id', userId)
        .single();

      let newCredits = credits;
      if (!error && currentCredits) {
        newCredits = currentCredits.credits + credits;
      }

      await apiClient.getSupabase()
        .from('user_generation_credits')
        .upsert({
          user_id: userId,
          credits: newCredits
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error adding generation credits:', error);
    }
  }
}

// Экземпляр API клиента для системы подарков
export const giftsApi = new GiftsApi();