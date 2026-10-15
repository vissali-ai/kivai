-- Kivai activation onboarding: per-account choice, separate from paid plans and existing profiles.
CREATE TABLE public.user_onboarding (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal text CHECK (goal IN ('images', 'documents', 'sales', 'social') OR goal IS NULL),
  status text NOT NULL CHECK (status IN ('completed', 'skipped')),
  completed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_onboarding_goal_status CHECK (
    (status = 'completed' AND goal IS NOT NULL)
    OR (status = 'skipped' AND goal IS NULL)
  )
);
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_onboarding FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_onboarding TO authenticated;
GRANT ALL ON public.user_onboarding TO service_role;

CREATE POLICY user_onboarding_select_own ON public.user_onboarding
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY user_onboarding_insert_own ON public.user_onboarding
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY user_onboarding_update_own ON public.user_onboarding
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
