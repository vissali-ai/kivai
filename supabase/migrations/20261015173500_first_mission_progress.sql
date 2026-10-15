-- Acompanhar a primeira tarefa útil sem criar outra tabela ou armazenar arquivos do usuário.
ALTER TABLE public.user_onboarding
  ADD COLUMN IF NOT EXISTS first_mission_tool_slug text,
  ADD COLUMN IF NOT EXISTS first_mission_completed_at timestamptz;

ALTER TABLE public.user_onboarding
  ADD CONSTRAINT user_onboarding_first_mission_together
  CHECK (
    (first_mission_tool_slug IS NULL AND first_mission_completed_at IS NULL)
    OR (first_mission_tool_slug IS NOT NULL AND first_mission_completed_at IS NOT NULL)
  );
