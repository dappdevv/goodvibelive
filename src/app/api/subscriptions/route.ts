import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createRouteHandlerClient({ cookies })

/**
 * GET /api/subscriptions
 * Получить информацию о подписке пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(
        `
        id,
        tier_id,
        starts_at,
        ends_at,
        is_active,
        subscription_tiers(name, max_storage_bytes, max_monthly_generations, price_monthly)
      `
      )
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ subscription: subscription || null })
  } catch (error) {
    console.error('GET /api/subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subscriptions
 * Создать или обновить подписку пользователя
 */
export async function POST(request: NextRequest) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier_id, months = 1 } = await request.json()

    if (!tier_id) {
      return NextResponse.json(
        { error: 'tier_id is required' },
        { status: 400 }
      )
    }

    // Проверить, есть ли уже активная подписка
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('id, ends_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const now = new Date()
    const startsAt = existingSubscription
      ? new Date(existingSubscription.ends_at)
      : now
    const endsAt = new Date(startsAt)
    endsAt.setMonth(endsAt.getMonth() + months)

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        tier_id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (error) {
    console.error('POST /api/subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
