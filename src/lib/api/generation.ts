import { apiClient } from './client';

// Типы для генерации контента
export interface GenerationRequest {
  type: 'image' | 'video' | 'audio' | 'text';
  prompt: string;
  options?: {
    style?: string;
    resolution?: string;
    duration?: number;
    quality?: string;
    model?: string;
  };
}

export interface GenerationResponse {
  id: string;
  type: 'image' | 'video' | 'audio' | 'text';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  result_data?: any;
  created_at: string;
  updated_at: string;
}

export interface ImageGenerationOptions {
  style?: string;
  resolution?: '256x256' | '512x512' | '1024x1024';
  quality?: 'low' | 'medium' | 'high';
  model?: string;
}

export interface VideoGenerationOptions {
  duration?: number; // in seconds
  resolution?: string;
  quality?: 'low' | 'medium' | 'high';
  model?: string;
}

export interface AudioGenerationOptions {
  duration?: number; // in seconds
  style?: string;
  quality?: 'low' | 'medium' | 'high';
  model?: string;
}

export interface TextGenerationOptions {
  style?: string;
  length?: 'short' | 'medium' | 'long';
  model?: string;
}

// Клиент для генерации контента
class GenerationApi {
  // Генерация изображения
 async generateImage(
    prompt: string, 
    options?: ImageGenerationOptions
  ): Promise<{ error: Error | null; data?: GenerationResponse }> {
    try {
      const generationRequest: GenerationRequest = {
        type: 'image',
        prompt,
        options
      };

      const response = await fetch('/api/t2i', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { error: null, data: result };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Генерация видео
  async generateVideo(
    prompt: string, 
    options?: VideoGenerationOptions
  ): Promise<{ error: Error | null; data?: GenerationResponse }> {
    try {
      const generationRequest: GenerationRequest = {
        type: 'video',
        prompt,
        options
      };

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { error: null, data: result };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Генерация аудио/музыки
 async generateAudio(
    prompt: string, 
    options?: AudioGenerationOptions
  ): Promise<{ error: Error | null; data?: GenerationResponse }> {
    try {
      const generationRequest: GenerationRequest = {
        type: 'audio',
        prompt,
        options
      };

      const response = await fetch('/api/suno', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { error: null, data: result };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Генерация текста
  async generateText(
    prompt: string, 
    options?: TextGenerationOptions
  ): Promise<{ error: Error | null; data?: GenerationResponse }> {
    try {
      const generationRequest: GenerationRequest = {
        type: 'text',
        prompt,
        options
      };

      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { error: null, data: result };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
 }

  // Получить статус генерации
  async getGenerationStatus(taskId: string): Promise<{ error: Error | null; data?: GenerationResponse }> {
    try {
      const response = await fetch(`/api/generation/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { error: null, data: result };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Получить историю генераций пользователя
  async getGenerationHistory(
    type?: 'image' | 'video' | 'audio' | 'text',
    limit: number = 20,
    offset: number = 0
  ): Promise<{ error: Error | null; data?: GenerationResponse[] }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      let query = apiClient.getSupabase()
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('type', type);
      }

      return apiClient.executeRequest<GenerationResponse[]>(query);
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }

  // Отправить задачу на генерацию и оплатить
  async createGenerationTask(
    request: GenerationRequest,
    price?: number
  ): Promise<{ error: Error | null; data?: GenerationResponse }> {
    const user = await apiClient.getCurrentUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Проверяем баланс пользователя, если указана цена
      if (price) {
        const { data: userBalance, error: balanceError } = await this.getUserBalance();
        if (balanceError) {
          return { error: new Error('Could not verify user balance') };
        }
        
        if (userBalance && userBalance < price) {
          return { error: new Error('Insufficient balance') };
        }
      }

      // Создаем запись о задаче генерации
      const generationData = {
        user_id: user.id,
        type: request.type,
        prompt: request.prompt,
        options: request.options,
        status: 'pending',
        price: price || null
      };

      const result = await apiClient.getSupabase()
        .from('generations')
        .insert([generationData])
        .select()
        .single();

      if (result.error) {
        return apiClient.handleApiError(result.error);
      }

      // Если указана цена, списываем средства
      if (price && price > 0) {
        const { error: debitError } = await this.debitUserBalance(price);
        if (debitError) {
          // Отменяем создание задачи при ошибке списания
          await apiClient.getSupabase()
            .from('generations')
            .delete()
            .eq('id', result.data.id);
          
          return { error: new Error('Failed to debit balance') };
        }
      }

      // Запускаем процесс генерации в зависимости от типа
      let generationResult;
      switch (request.type) {
        case 'image':
          generationResult = await this.generateImage(request.prompt, request.options as ImageGenerationOptions);
          break;
        case 'audio':
          generationResult = await this.generateAudio(request.prompt, request.options as AudioGenerationOptions);
          break;
        default:
          return { error: new Error(`Generation type ${request.type} not supported yet`) };
      }

      if (generationResult.error) {
        // Обновляем статус задачи на ошибку
        await apiClient.getSupabase()
          .from('generations')
          .update({ status: 'failed', error: generationResult.error.message })
          .eq('id', result.data.id);
        
        return generationResult;
      }

      // Обновляем статус задачи
      const updateResult = await apiClient.getSupabase()
        .from('generations')
        .update({ 
          status: generationResult.data?.status || 'completed',
          result_url: generationResult.data?.result_url,
          result_data: generationResult.data?.result_data
        })
        .eq('id', result.data.id)
        .select()
        .single();

      if (updateResult.error) {
        return apiClient.handleApiError(updateResult.error);
      }

      return { error: null, data: updateResult.data };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
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
          description: 'Content generation',
          balance_after: (currentBalance || 0) - amount
        });

      return { error: null };
    } catch (error) {
      return apiClient.handleApiError(error);
    }
  }
}

// Экземпляр API клиента для генерации
export const generationApi = new GenerationApi();