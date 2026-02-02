-- Add UPDATE policy for user_subscriptions table
CREATE POLICY "Users can update own subscription"
  ON public.user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);