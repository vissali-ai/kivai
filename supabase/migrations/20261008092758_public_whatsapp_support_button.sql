CREATE TABLE IF NOT EXISTS public.site_whatsapp_support (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  phone text NOT NULL DEFAULT '5531996205058' CHECK (phone ~ '^55[1-9][0-9]{9,10}$'),
  message text NOT NULL DEFAULT 'Estou utilizando o kivai e gostaria de tirar uma dúvida.' CHECK (char_length(trim(message)) BETWEEN 1 AND 500),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_whatsapp_support ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_whatsapp_support FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.site_whatsapp_support TO service_role;
INSERT INTO public.site_whatsapp_support (id, enabled, phone, message)
VALUES (1, true, '5531996205058', 'Estou utilizando o kivai e gostaria de tirar uma dúvida.')
ON CONFLICT (id) DO NOTHING;
