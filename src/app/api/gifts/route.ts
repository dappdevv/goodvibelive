import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * POST /api/gifts - Отправить подарок другому пользователю
 * Body: { to_user_id, amount, message? }
 */
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      request.headers.get('authorization')?.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { to_user_id, amount, message } = await request.json();

    if (!to_user_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Проверить баланс отправителя
    const { data: balance, error: balanceError } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (balanceError || !balance || balance.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Создать подарок
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .insert({
        from_user_id: user.id,
        to_user_id,
        amount,
        message,
        status: 'pending'
      })
      .select('id')
      .single();

    if (giftError || !gift) {
      return NextResponse.json(
        { error: 'Failed to create gift' },
        { status: 500 }
      );
    }

    // Списать с баланса отправителя
    await supabase
      .from('user_balances')
      .update({ balance: balance.balance - amount })
      .eq('user_id', user.id);

    return NextResponse.json(
      { id: gift.id, status: 'pending' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/gifts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gifts - Получить подарки пользователя (входящие и исходящие)
 * Query: ?type=incoming|outgoing|public
 */
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      request.headers.get('authorization')?.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const type = request.nextUrl.searchParams.get('type') || 'incoming';

    let query = supabase
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false });

    if (type === 'incoming') {
      query = query.eq('to_user_id', user.id);
    } else if (type === 'outgoing') {
      query = query.eq('from_user_id', user.id);
    } else if (type === 'public') {
      query = query
        .is('to_user_id', null)
        .eq('status', 'pending');
    }

    const { data: gifts, error: giftsError } = await query;

    if (giftsError) {
      return NextResponse.json(
        { error: 'Failed to fetch gifts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ gifts });
  } catch (error) {
    console.error('Error in GET /api/gifts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
