import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId параметр обязателен' },
        { status: 400 }
      );
    }

    // Получить баланс пользователя
    const { data: balance, error: balanceError } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (balanceError) {
      return NextResponse.json(
        { error: 'Баланс не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ balance });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении баланса' },
      { status: 500 }
    );
  }
}
