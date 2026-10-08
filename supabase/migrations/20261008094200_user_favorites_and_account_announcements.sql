CREATE TABLE public.user_tool_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug text NOT NULL CHECK (char_length(tool_slug) BETWEEN 2 AND 120 AND tool_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tool_title text NOT NULL CHECK (char_length(trim(tool_title)) BETWEEN 2 AND 180),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tool_slug)
);
ALTER TABLE public.user_tool_favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_tool_favorites FROM PUBLIC, anon;
GRANT SELECT, INSERT, DELETE ON public.user_tool_favorites TO authenticated;
GRANT ALL ON public.user_tool_favorites TO service_role;
CREATE POLICY "Users read own favorites" ON public.user_tool_favorites FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users save own favorites" ON public.user_tool_favorites FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users delete own favorites" ON public.user_tool_favorites FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE TABLE public.account_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 140),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 3 AND 1500),
  link_url text CHECK (link_url IS NULL OR (char_length(link_url) <= 300 AND link_url ~ '^/[^/]')),
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','free','pro','agency')),
  enabled boolean NOT NULL DEFAULT true,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_announcements_valid_window CHECK (start_at IS NULL OR end_at IS NULL OR end_at > start_at)
);
CREATE INDEX account_announcements_active_idx ON public.account_announcements (enabled, audience, created_at DESC);
ALTER TABLE public.account_announcements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_announcements FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.account_announcements TO service_role;

CREATE TABLE public.account_announcement_reads (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES public.account_announcements(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);
ALTER TABLE public.account_announcement_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_announcement_reads FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.account_announcement_reads TO service_role;

INSERT INTO public.account_announcements(title,body,link_url,audience,enabled)
VALUES ('Organize suas ferramentas favoritas','Agora você pode salvar as ferramentas que mais utiliza e acessá-las diretamente no painel da sua conta.','/ferramentas','all',true);
