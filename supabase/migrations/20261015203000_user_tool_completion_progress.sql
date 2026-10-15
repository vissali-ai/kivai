-- Progresso leve: somente identificador público da ferramenta e dia (UTC).
-- Não armazena arquivos, conteúdo processado, IP ou dados dos cálculos.
CREATE TABLE public.user_tool_completion_days (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug text NOT NULL CHECK (length(tool_slug) BETWEEN 3 AND 120 AND tool_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  completed_on date NOT NULL,
  PRIMARY KEY (user_id, tool_slug, completed_on)
);
CREATE INDEX user_tool_completion_days_user_day_idx
  ON public.user_tool_completion_days(user_id, completed_on);

ALTER TABLE public.user_tool_completion_days ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_tool_completion_days FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_tool_completion_days TO authenticated;
GRANT ALL ON public.user_tool_completion_days TO service_role;
CREATE POLICY completion_days_read_owner ON public.user_tool_completion_days
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- A data é definida no servidor. Uma repetição no mesmo dia é ignorada.
-- O limite de 20 ferramentas diferentes por dia evita carga acidental.
CREATE FUNCTION public.record_kivai_tool_completion(p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  today_utc date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_slug IS NULL OR length(p_slug) NOT BETWEEN 3 AND 120 OR
     p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Invalid tool';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_tool_completion_days
    WHERE user_id = actor AND tool_slug = p_slug AND completed_on = today_utc
  ) THEN RETURN; END IF;
  IF (
    SELECT count(*) FROM public.user_tool_completion_days
    WHERE user_id = actor AND completed_on = today_utc
  ) >= 20 THEN RETURN; END IF;
  INSERT INTO public.user_tool_completion_days(user_id, tool_slug, completed_on)
    VALUES (actor, p_slug, today_utc)
    ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.record_kivai_tool_completion(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_kivai_tool_completion(text) TO authenticated;

-- Agrega resultados e favoritos existentes, sem cópias das tabelas.
CREATE FUNCTION public.get_kivai_progress()
RETURNS TABLE (
  favorite_count integer,
  result_count integer,
  different_tools integer,
  active_days integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    (SELECT count(*)::integer FROM public.user_tool_favorites f WHERE f.user_id = auth.uid()),
    (SELECT count(*)::integer FROM public.user_tool_completion_days c WHERE c.user_id = auth.uid()),
    (SELECT count(DISTINCT c.tool_slug)::integer FROM public.user_tool_completion_days c WHERE c.user_id = auth.uid()),
    (SELECT count(DISTINCT c.completed_on)::integer FROM public.user_tool_completion_days c WHERE c.user_id = auth.uid())
$$;

REVOKE ALL ON FUNCTION public.get_kivai_progress() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_kivai_progress() TO authenticated;
