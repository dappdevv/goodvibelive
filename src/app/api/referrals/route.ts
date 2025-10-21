import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/referrals
 * Получить реферальную статистику пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Получить всех рефералов пользователя по уровням
    const { data: referralTree, error: treeError } = await supabase
      .from('referral_tree')
      .select('referred_id, level')
      .eq('referrer_id', user.id);

    if (treeError) throw treeError;

    // Получить информацию о рефералах
    const referredIds = referralTree?.map(r => r.referred_id) || [];
    let referralStats: any[] = [];

    if (referredIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('public_profiles')
        .select('id, username, avatar_url')
        .in('id', referredIds);

      if (profileError) throw profileError;

      referralStats = profiles?.map(profile => {
        const treeEntry = referralTree?.find(r => r.referred_id === profile.id);
        return {
          ...profile,
          level: treeEntry?.level || 0
        };
      }) || [];
    }

    // Получить статистику комиссий
    const { data: commissions, error: commError } = await supabase
      .from('referral_commissions')
      .select('level, amount, created_at')
      .eq('receiver_user_id', user.id)
      .order('created_at', { ascending: false });

    if (commError) throw commError;

    // Вычислить общий доход из комиссий
    const totalCommissions = (commissions || []).reduce((sum, c) => sum + Number(c.amount), 0);

    return NextResponse.json({
      referrals: referralStats,
      totalReferrals: referralStats.length,
      commissions: {
        total: totalCommissions,
        history: commissions || []
      }
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}
