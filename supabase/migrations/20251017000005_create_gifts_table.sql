-- Create gifts table for the gift system
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = public gift
  
  amount BIGINT NOT NULL CHECK (amount > 0),
  message TEXT,
  status gift_status NOT NULL DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ GENERATED ALWAYS AS (created_at + INTERVAL '7 days') STORED,
  created_referral BOOLEAN DEFAULT false,
  
  CONSTRAINT valid_gift_users CHECK (from_user_id != to_user_id OR to_user_id IS NULL)
);

-- Create indexes for gifts table
CREATE INDEX idx_gifts_to_user_id ON public.gifts(to_user_id);
CREATE INDEX idx_gifts_from_user_id ON public.gifts(from_user_id);
CREATE INDEX idx_gifts_status ON public.gifts(status);
CREATE INDEX idx_gifts_expires_at ON public.gifts(expires_at);
CREATE INDEX idx_gifts_created_at ON public.gifts(created_at);

-- Enable RLS for gifts
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see gifts sent to them
CREATE POLICY "Users can see gifts sent to them"
  ON public.gifts FOR SELECT
  USING (
    (to_user_id = auth.uid()) OR
    (to_user_id IS NULL AND status = 'claimed')
  );

-- RLS Policy: Users can see gifts they sent
CREATE POLICY "Users can see gifts they sent"
  ON public.gifts FOR SELECT
  USING (from_user_id = auth.uid());

-- RLS Policy: Users can create gifts
CREATE POLICY "Users can create gifts"
  ON public.gifts FOR INSERT
  WITH CHECK (
    from_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_balances
      WHERE user_id = auth.uid() AND balance >= amount
    )
  );

-- RLS Policy: Users can update their own gifts (change status)
CREATE POLICY "Users can update gifts they received"
  ON public.gifts FOR UPDATE
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- RLS Policy: Users can claim public gifts if they have no referrer
CREATE POLICY "Users can claim public gifts"
  ON public.gifts FOR UPDATE
  USING (
    to_user_id IS NULL AND
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM public.private_users
      WHERE id = auth.uid() AND referrer_id IS NULL
    )
  )
  WITH CHECK (true);
