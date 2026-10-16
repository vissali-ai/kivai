-- Lembretes de rotina opcionais, independentes dos avisos existentes e dos planos.
CREATE TABLE IF NOT EXISTS public.user_routine_reminders (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  weekday smallint NOT NULL DEFAULT 1 CHECK (weekday BETWEEN 0 AND 6),
  hour smallint NOT NULL DEFAULT 9 CHECK (hour BETWEEN 8 AND 21),
  time_zone text NOT NULL DEFAULT 'America/Sao_Paulo' CHECK (length(time_zone) <= 64),
  tool_slug text NOT NULL DEFAULT 'compressor-de-imagens' CHECK (length(tool_slug) <= 120),
  last_sent_local_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_routine_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE CHECK (length(endpoint) BETWEEN 30 AND 2048),
  p256dh text NOT NULL CHECK (length(p256dh) BETWEEN 40 AND 256),
  auth_key text NOT NULL CHECK (length(auth_key) BETWEEN 12 AND 128),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kivai_reminders_enabled ON public.user_routine_reminders(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_kivai_push_owner ON public.user_routine_push_subscriptions(user_id);

ALTER TABLE public.user_routine_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_routine_push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_routine_reminders FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.user_routine_push_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_routine_reminders TO authenticated;
GRANT ALL ON public.user_routine_reminders TO service_role;
GRANT SELECT ON public.user_routine_push_subscriptions TO authenticated;
GRANT ALL ON public.user_routine_push_subscriptions TO service_role;

CREATE POLICY routine_reminders_select_owner ON public.user_routine_reminders
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY routine_push_select_owner ON public.user_routine_push_subscriptions
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
-- Escrita somente por rota autenticada usando service_role; não por cliente REST direto.
