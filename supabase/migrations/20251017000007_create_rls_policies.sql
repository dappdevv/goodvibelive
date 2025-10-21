-- Enable RLS on all tables
ALTER TABLE public.private_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

---
-- private_users: Only the user themselves can see their own data
---
CREATE POLICY "Users can read their own private data"
  ON public.private_users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own private data"
  ON public.private_users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

---
-- public_profiles: Everyone can read, only user can update
---
CREATE POLICY "Public profiles are readable by everyone"
  ON public.public_profiles
  FOR SELECT
  USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.public_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.public_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

---
-- user_balances: Only the user can read their balance
---
CREATE POLICY "Users can read their own balance"
  ON public.user_balances
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance"
  ON public.user_balances
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

---
-- subscription_tiers: Everyone can read, service role can insert/update
---
CREATE POLICY "Subscription tiers are readable by everyone"
  ON public.subscription_tiers
  FOR SELECT
  USING (true);

---
-- user_subscriptions: Only user can read their subscriptions
---
CREATE POLICY "Users can read their own subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

---
-- referral_settings: Only user can read/update their settings
---
CREATE POLICY "Users can read their own referral settings"
  ON public.referral_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral settings"
  ON public.referral_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral settings"
  ON public.referral_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

---
-- referral_tree: Users can read tree data (for analytics)
---
CREATE POLICY "Users can read referral tree"
  ON public.referral_tree
  FOR SELECT
  USING (true);

---
-- referral_commission_rules: Everyone can read (public configuration)
---
CREATE POLICY "Commission rules are readable by everyone"
  ON public.referral_commission_rules
  FOR SELECT
  USING (true);

---
-- referral_commissions: Users can read commissions for themselves
---
CREATE POLICY "Users can read their own commissions"
  ON public.referral_commissions
  FOR SELECT
  USING (auth.uid() = receiver_user_id);

---
-- gifts: Sender can see, receiver can see, admin can see all
---
CREATE POLICY "Users can read gifts sent to them"
  ON public.gifts
  FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Unauthenticated users can see public gifts"
  ON public.gifts
  FOR SELECT
  USING (to_user_id IS NULL AND status = 'pending');

---
-- generation_tasks: Only the creator can read their tasks
---
CREATE POLICY "Users can read their own generation tasks"
  ON public.generation_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can see published tasks"
  ON public.generation_tasks
  FOR SELECT
  USING (is_published = true);

---
-- likes: Users can manage their likes
---
CREATE POLICY "Users can read likes"
  ON public.likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can like tasks"
  ON public.likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike tasks"
  ON public.likes
  FOR DELETE
  USING (auth.uid() = user_id);

---
-- favorites: Users can manage their favorites
---
CREATE POLICY "Users can read favorites"
  ON public.favorites
  FOR SELECT
  USING (true);

CREATE POLICY "Users can add to favorites"
  ON public.favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from favorites"
  ON public.favorites
  FOR DELETE
  USING (auth.uid() = user_id);

---
-- follows: Users can manage their follows
---
CREATE POLICY "Users can read follows"
  ON public.follows
  FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON public.follows
  FOR DELETE
  USING (auth.uid() = follower_id);

---
-- donations: Users can see donations to their content
---
CREATE POLICY "Users can read donations"
  ON public.donations
  FOR SELECT
  USING (true);

---
-- reminders: Only user can access their reminders
---
CREATE POLICY "Users can read their own reminders"
  ON public.reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON public.reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.reminders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.reminders
  FOR DELETE
  USING (auth.uid() = user_id);
