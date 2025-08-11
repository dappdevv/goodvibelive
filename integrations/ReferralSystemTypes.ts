// GoodVibe Live 8-Level Referral System Type Definitions

export type ReferralLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Profile {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  wallet_address: string | null;
  referral_code: string;
  referred_by: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  credits_balance: number;
  created_at: string;
  updated_at: string;
}

export interface CommissionRate {
  id: string;
  level: string;
  rate_percentage: number;
  created_at: string;
}

export interface ReferralRelationship {
  id: string;
  ancestor_id: number;
  descendant_id: number;
  depth: ReferralLevel;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  level: ReferralLevel;
  commission_rate: number;
  total_earned: number;
  referral_date: string;
}

export interface ReferralEarning {
  id: string;
  referrer_id: number;
  referred_user_id: number;
  amount: number;
  depth: ReferralLevel;
  created_at: string;
}

export interface TokenBalance {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  last_updated: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  type:
    | "usage"
    | "referral"
    | "purchase"
    | "reward"
    | "gift_sent"
    | "gift_received";
  amount: number;
  description: string | null;
  created_at: string;
}

export interface Gift {
  id: string;
  sender_id: string;
  recipient_phone: string;
  promo_code: string;
  token_amount: number;
  message: string | null;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  status: "pending" | "used" | "expired";
}

export interface UserReferralSlot {
  id: string;
  user_id: number;
  slot_number: number;
  referred_user_id: number | null;
  is_filled: boolean;
  created_at: string;
}

// API Request Types

export interface TrackReferralRequest {
  user_id: string;
  referral_code: string;
}

export interface CreateGiftRequest {
  sender_id: string;
  recipient_phone: string;
  token_amount: number;
  message?: string;
}

export interface RedeemGiftRequest {
  recipient_phone: string;
  user_id: string;
  referral_code?: string;
}

// API Response Types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TrackReferralResponse {
  success: boolean;
  referrer_id: string;
  placement_level: number;
  message: string;
}

export interface GiftResponse {
  success: boolean;
  gift_id: string;
  promo_code: string;
  token_balance: number;
  error_message: string;
}

export interface RedeemGiftResponse {
  success: boolean;
  amount_received: number;
  gift_id: string;
  sender_referral_code: string;
  error_message: string;
}

// Analytics Types

export interface LevelStats {
  level: number;
  referrals: number;
  earnings: number;
  rate: number;
}

export interface ReferralStatistics {
  total_referrals: number;
  total_commission: number;
  level_stats: LevelStats[];
  referral_tree: any;
}

export interface AnalyticsRequest {
  start_date?: string;
  end_date?: string;
  user_id?: string;
  limit?: number;
}

export interface TopReferrer {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  total_referrals: number;
  total_commission: number;
  level_breakdown: {
    level: ReferralLevel;
    count: number;
    commission: number;
  }[];
}

// Commission Constants
export const COMMISSION_RATES = {
  1: 30,
  2: 20,
  3: 15,
  4: 10,
  5: 8,
  6: 6,
  7: 4,
  8: 2,
} as const;

// Service Interfaces

export interface ReferralService {
  trackReferral: (
    userId: string,
    referralCode: string
  ) => Promise<TrackReferralResponse>;
  createGift: (
    senderId: string,
    recipientPhone: string,
    amount: number,
    message?: string
  ) => Promise<GiftResponse>;
  redeemGift: (
    phone: string,
    userId: string,
    referralCode?: string
  ) => Promise<RedeemGiftResponse>;
  getBalance: (userId: string) => Promise<{ balance: number }>;
  getStatistics: (userId: string) => Promise<ReferralStatistics>;
}

export interface AdminAnalyticsService {
  referralOverview: (params: AnalyticsRequest) => Promise<any>;
  topReferrers: (params: AnalyticsRequest) => Promise<TopReferrer[]>;
  commissionSummary: (params: AnalyticsRequest) => Promise<any>;
  userAnalytics: (userId: string) => Promise<any>;
  giftAnalytics: (params: AnalyticsRequest) => Promise<any>;
  systemHealth: () => Promise<any>;
}

// Error Types
export interface ApiError {
  success: false;
  error: string;
  code?: string;
  timestamp: string;
}

export type ReferralErrorCode =
  | "INSUFFICIENT_BALANCE"
  | "INVALID_REFERRAL_CODE"
  | "PHONE_NOT_FOUND"
  | "SLOTS_FULL"
  | "ALREADY_REFERRED"
  | "INVALID_PHONE_FORMAT"
  | "USER_NOT_FOUND"
  | "TRANSFER_FAILED";

// Function Types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      SUPABASE_ANON_KEY: string;
    }
  }
}

// Direct Database Function Types
export interface DatabaseFunctions {
  find_optimal_referrer: (referral_code: string) => Promise<
    {
      optimal_referrer_id: string;
      referral_level: number;
      referral_path_text: string;
    }[]
  >;

  process_referral_placement: (
    new_user_id: string,
    referral_code: string
  ) => Promise<
    {
      success: boolean;
      referrer_id: string;
      placement_level: number;
      error_message: string;
    }[]
  >;

  get_user_balance: (user_id: string) => Promise<number>;

  credit_user_balance: (
    user_id: string,
    amount: number,
    description?: string,
    transaction_type?: string
  ) => Promise<
    {
      success: boolean;
      new_balance: number;
      transaction_id: string;
      error_message: string;
    }[]
  >;

  debit_user_balance: (
    user_id: string,
    amount: number,
    description?: string,
    transaction_type?: string
  ) => Promise<
    {
      success: boolean;
      new_balance: number;
      transaction_id: string;
      error_message: string;
    }[]
  >;

  distribute_referral_commissions: (
    ai_usage_user_id: string,
    cost_tokens: number,
    generation_type: string
  ) => Promise<
    {
      total_commission: number;
      commission_breakdown: any;
    }[]
  >;

  create_gift_token: (
    sender_uuid: string,
    recipient_phone: string,
    token_amount: number,
    gift_message?: string
  ) => Promise<GiftResponse>;

  redeem_gift_token: (
    recipient_phone: string,
    redeemer_user_uuid: string,
    got_referral_code?: string
  ) => Promise<RedeemGiftResponse>;

  get_active_gifts_by_phone: (recipient_phone: string) => Promise<
    {
      gift_id: string;
      promo_code: string;
      token_amount: number;
      sender_username: string;
      message: string;
      created_at: string;
    }[]
  >;

  get_referral_statistics: (user_id: string) => Promise<ReferralStatistics>;
}
