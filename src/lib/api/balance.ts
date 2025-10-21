import { apiClient } from './client';

// Типы для системы баланса
export interface UserBalance {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface BalanceTransaction {
  id: string;
  user_id: string;
  amount: number; // положительное значение для пополнения, отрицательное для списания
  type: 'credit' | 'debit'; // тип транзакции
  description: string; // описание транзакции
  balance_after: number; // баланс после транзакции
  source?: string; // источник транзакции (например, 'subscription', 'gift', 'generation', 'referral')
  related_id?: string; // ID связанной сущности (например, ID подписки или генерации)
  created_at: string;
}

export interface TransactionHistoryParams {
  type?: 'credit' | 'debit';
  source?: string;
  limit?: number;
  offset?: number;
  from_date?: string; // в формате ISO
  to_date?: string;
}

export interface TopUpData {
  amount: number;
  payment_method: string; // например, 'card', 'crypto', 'paypal' и т.д.
  currency?: string;
}

// Клиент для работы с балансом
class BalanceApi {
  // Получить текущий баланс пользователя
 async getBalance(): Promise<{ error: Error | null; data?: UserBalance }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const result = await apiClient.getSupabase()
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (result.error) {
        if (result.error.code === 'PGRST116') { // Row not found
          // Если баланс не найден, создаем запись с нулевым балансом
          const newBalance = {
            user_id: user.id,
            balance: 0,
            currency: 'USD' // по умолчанию
          };

          const insertResult = await apiClient.getSupabase()
            .from('user_balances')
            .insert([newBalance])
            .select()
            .single();

          if (insertResult.error) {
            return apiClient.handleApiError(insertResult.error);
          }

          return { error: null, data: insertResult.data as UserBalance };
        }
        return apiClient.handleApiError(result.error);
      }

      return { error: null, data: result.data as UserBalance };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить историю транзакций
  async getTransactionHistory(params: TransactionHistoryParams = {}): Promise<{ error: Error | null; data?: BalanceTransaction[] }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const {
        type,
        source,
        limit = 20,
        offset = 0,
        from_date,
        to_date
      } = params;

      let query = apiClient.getSupabase()
        .from('balance_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('type', type);
      }

      if (source) {
        query = query.eq('source', source);
      }

      if (from_date) {
        query = query.gte('created_at', from_date);
      }

      if (to_date) {
        query = query.lte('created_at', to_date);
      }

      const result = await apiClient.executeRequest<BalanceTransaction[]>(query);
      return result;
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Пополнить баланс
  async topUpBalance(topUpData: TopUpData): Promise<{ error: Error | null; data?: BalanceTransaction }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    if (topUpData.amount <= 0) {
      return { error: new Error('Top-up amount must be positive') };
    }

    try {
      // В реальном приложении здесь будет интеграция с платежной системой
      // Пока просто увеличиваем баланс пользователя
      
      // Получаем текущий баланс
      const currentBalanceResult = await this.getBalance();
      if (currentBalanceResult.error) {
        return currentBalanceResult;
      }

      const currentBalance = currentBalanceResult.data?.balance || 0;
      const newBalance = currentBalance + topUpData.amount;

      // Обновляем баланс
      const balanceResult = await apiClient.getSupabase()
        .from('user_balances')
        .upsert({
          user_id: user.id,
          balance: newBalance,
          currency: topUpData.currency || 'USD'
        }, { onConflict: 'user_id' });

      if (balanceResult.error) {
        return apiClient.handleApiError(balanceResult.error);
      }

      // Создаем запись о транзакции
      const transactionData = {
        user_id: user.id,
        amount: topUpData.amount,
        type: 'credit',
        description: `Balance top-up via ${topUpData.payment_method}`,
        balance_after: newBalance,
        source: 'top_up',
        related_id: null // В реальном приложении тут может быть ID платежа
      };

      const transactionResult = await apiClient.getSupabase()
        .from('balance_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionResult.error) {
        return apiClient.handleApiError(transactionResult.error);
      }

      return { error: null, data: transactionResult.data as BalanceTransaction };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Списать средства
  async debitBalance(amount: number, description: string, source?: string, relatedId?: string): Promise<{ error: Error | null; data?: BalanceTransaction }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    if (amount <= 0) {
      return { error: new Error('Debit amount must be positive') };
    }

    try {
      // Получаем текущий баланс
      const currentBalanceResult = await this.getBalance();
      if (currentBalanceResult.error) {
        return currentBalanceResult;
      }

      const currentBalance = currentBalanceResult.data?.balance || 0;
      const newBalance = currentBalance - amount;

      if (newBalance < 0) {
        return { error: new Error('Insufficient balance') };
      }

      // Обновляем баланс
      const balanceResult = await apiClient.getSupabase()
        .from('user_balances')
        .upsert({
          user_id: user.id,
          balance: newBalance,
          currency: currentBalanceResult.data?.currency || 'USD'
        }, { onConflict: 'user_id' });

      if (balanceResult.error) {
        return apiClient.handleApiError(balanceResult.error);
      }

      // Создаем запись о транзакции
      const transactionData = {
        user_id: user.id,
        amount: -amount, // отрицательное значение для списания
        type: 'debit',
        description: description,
        balance_after: newBalance,
        source: source || 'general',
        related_id: relatedId || null
      };

      const transactionResult = await apiClient.getSupabase()
        .from('balance_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionResult.error) {
        return apiClient.handleApiError(transactionResult.error);
      }

      return { error: null, data: transactionResult.data as BalanceTransaction };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Перевести средства другому пользователю
  async transferToUser(recipientId: string, amount: number, message?: string): Promise<{ error: Error | null; data?: { debit: BalanceTransaction; credit: BalanceTransaction } }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    if (user.id === recipientId) {
      return { error: new Error('Cannot transfer to yourself') };
    }

    if (amount <= 0) {
      return { error: new Error('Transfer amount must be positive') };
    }

    try {
      // Проверяем, существует ли получатель
      const { data: recipient, error: recipientError } = await apiClient.getSupabase()
        .from('users')
        .select('id')
        .eq('id', recipientId)
        .single();

      if (recipientError) {
        return { error: new Error('Recipient not found') };
      }

      // Списываем средства с отправителя
      const debitResult = await this.debitBalance(
        amount,
        `Transfer to user ${recipientId}${message ? `: ${message}` : ''}`,
        'transfer',
        recipientId
      );

      if (debitResult.error) {
        return debitResult;
      }

      // Добавляем средства получателю
      const creditResult = await this.creditUserBalance(
        recipientId,
        amount,
        `Transfer from user ${user.id}${message ? `: ${message}` : ''}`,
        'transfer',
        user.id
      );

      if (creditResult.error) {
        // Если не удалось зачислить средства получателю, возвращаем средства отправителю
        await this.creditUserBalance(
          user.id,
          amount,
          'Transfer reversal due to failed credit to recipient',
          'transfer_reversal',
          recipientId
        );
        return creditResult;
      }

      return {
        error: null,
        data: {
          debit: debitResult.data!,
          credit: creditResult.data!
        }
      };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить статистику по балансу
 async getBalanceStats(): Promise<{ error: Error | null; data?: { total_spent: number; total_received: number; total_transferred: number } }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Общая сумма списаний
      const { data: debitData, error: debitError } = await apiClient.getSupabase()
        .from('balance_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'debit');

      if (debitError) {
        return apiClient.handleApiError(debitError);
      }

      const totalSpent = Math.abs(debitData?.reduce((sum, t) => sum + t.amount, 0) || 0);

      // Общая сумма пополнений
      const { data: creditData, error: creditError } = await apiClient.getSupabase()
        .from('balance_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'credit');

      if (creditError) {
        return apiClient.handleApiError(creditError);
      }

      const totalReceived = creditData?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Общая сумма переводов другим пользователям
      const { data: transferData, error: transferError } = await apiClient.getSupabase()
        .from('balance_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'debit')
        .eq('source', 'transfer');

      if (transferError) {
        return apiClient.handleApiError(transferError);
      }

      const totalTransferred = Math.abs(transferData?.reduce((sum, t) => sum + t.amount, 0) || 0);

      const stats = {
        total_spent: totalSpent,
        total_received: totalReceived,
        total_transferred: totalTransferred
      };

      return { error: null, data: stats };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Приватные методы для внутреннего использования

 // Начислить средства пользователю
  private async creditUserBalance(userId: string, amount: number, description: string, source?: string, relatedId?: string): Promise<{ error: Error | null; data?: BalanceTransaction }> {
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
      const transactionData = {
        user_id: userId,
        amount: amount,
        type: 'credit',
        description: description,
        balance_after: newBalance,
        source: source || 'credit',
        related_id: relatedId || null
      };

      const result = await apiClient.getSupabase()
        .from('balance_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      return { error: null, data: result.data as BalanceTransaction };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }
}

// Экземпляр API клиента для работы с балансом
export const balanceApi = new BalanceApi();