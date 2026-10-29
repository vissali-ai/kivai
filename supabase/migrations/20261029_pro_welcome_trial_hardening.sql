-- Harden the already-applied welcome trial RPC.
ALTER FUNCTION public.kivai_welcome_trial(uuid, boolean) SECURITY DEFINER;
-- Different-account redemption for canonical email is serialized in function body.
