-- Migration: Create Indexes for Performance Optimization
-- Version: 20251017000008
-- Description: Создание индексов по часто используемым полям для оптимизации запросов

-- Indexes for private_users table
CREATE INDEX idx_private_users_telegram_id ON public.private_users(telegram_id) WHERE telegram_id IS NOT NULL;
CREATE INDEX idx_private_users_referrer_id ON public.private_users(referrer_id);
CREATE INDEX idx_private_users_wallet_address ON public.private_users(wallet_address) WHERE wallet_address IS NOT NULL;

-- Indexes for public_profiles table
CREATE INDEX idx_public_profiles_username ON public.public_profiles(username);
CREATE INDEX idx_public_profiles_is_public ON public.public_profiles(is_public);
CREATE INDEX idx_public_profiles_created_at ON public.public_profiles(created_at DESC);

-- Indexes for user_balances table
CREATE INDEX idx_user_balances_balance ON public.user_balances(balance DESC);

-- Indexes for user_subscriptions table
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_tier_id ON public.user_subscriptions(tier_id);
CREATE INDEX idx_user_subscriptions_is_active ON public.user_subscriptions(is_active);
CREATE INDEX idx_user_subscriptions_ends_at ON public.user_subscriptions(ends_at);

-- Indexes for referral_tree table
CREATE INDEX idx_referral_tree_referrer_id ON public.referral_tree(referrer_id);
CREATE INDEX idx_referral_tree_referred_id ON public.referral_tree(referred_id);
CREATE INDEX idx_referral_tree_level ON public.referral_tree(level);
CREATE INDEX idx_referral_tree_created_at ON public.referral_tree(created_at DESC);

-- Indexes for referral_commissions table
CREATE INDEX idx_referral_commissions_payer_user_id ON public.referral_commissions(payer_user_id);
CREATE INDEX idx_referral_commissions_receiver_user_id ON public.referral_commissions(receiver_user_id);
CREATE INDEX idx_referral_commissions_level ON public.referral_commissions(level);
CREATE INDEX idx_referral_commissions_created_at ON public.referral_commissions(created_at DESC);

-- Indexes for gifts table
CREATE INDEX idx_gifts_from_user_id ON public.gifts(from_user_id);
CREATE INDEX idx_gifts_to_user_id ON public.gifts(to_user_id) WHERE to_user_id IS NOT NULL;
CREATE INDEX idx_gifts_status ON public.gifts(status);
CREATE INDEX idx_gifts_expires_at ON public.gifts(expires_at);
CREATE INDEX idx_gifts_created_at ON public.gifts(created_at DESC);
-- Index for finding public gifts available for claiming
CREATE INDEX idx_gifts_public_available ON public.gifts(status) WHERE to_user_id IS NULL AND status = 'pending';

-- Indexes for generation_tasks table
CREATE INDEX idx_generation_tasks_user_id ON public.generation_tasks(user_id);
CREATE INDEX idx_generation_tasks_status ON public.generation_tasks(status);
CREATE INDEX idx_generation_tasks_is_published ON public.generation_tasks(is_published);
CREATE INDEX idx_generation_tasks_provider ON public.generation_tasks(provider);
CREATE INDEX idx_generation_tasks_created_at ON public.generation_tasks(created_at DESC);

-- Indexes for social interaction tables
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_task_id ON public.likes(task_id);
CREATE INDEX idx_likes_created_at ON public.likes(created_at DESC);

CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_task_id ON public.favorites(task_id);
CREATE INDEX idx_favorites_created_at ON public.favorites(created_at DESC);

CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_follows_created_at ON public.follows(created_at DESC);

CREATE INDEX idx_donations_from_user_id ON public.donations(from_user_id);
CREATE INDEX idx_donations_to_user_id ON public.donations(to_user_id);
CREATE INDEX idx_donations_task_id ON public.donations(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_donations_created_at ON public.donations(created_at DESC);

-- Indexes for reminders table
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX idx_reminders_reminder_type ON public.reminders(reminder_type);
CREATE INDEX idx_reminders_is_completed ON public.reminders(is_completed);
CREATE INDEX idx_reminders_due_date ON public.reminders(due_date);
CREATE INDEX idx_reminders_created_at ON public.reminders(created_at DESC);
