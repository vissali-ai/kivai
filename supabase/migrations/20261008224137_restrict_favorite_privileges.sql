-- Default Supabase grants can include TRUNCATE, which is not constrained by RLS.
-- Keep only the operations used by the favorites feature.
REVOKE ALL ON public.user_tool_favorites FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_tool_favorites TO authenticated;
