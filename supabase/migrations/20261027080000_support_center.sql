-- Central de Atendimento Kivai: registros privados, acessados apenas pelas APIs do servidor.
CREATE SEQUENCE IF NOT EXISTS public.support_protocol_seq;

CREATE TABLE IF NOT EXISTS public.support_tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 protocol text NOT NULL UNIQUE DEFAULT ('KIV-' || extract(year from now())::int::text || '-' || lpad(nextval('public.support_protocol_seq')::text,6,'0')),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 user_email text NOT NULL,
 user_name text,
 category text NOT NULL CHECK (category IN ('erro','duvida','financeiro','sugestao','outros')),
 title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 5 AND 140),
 status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_atendimento','aguardando_usuario','resolvido','encerrado')),
 priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa','normal','alta')),
 source_url text,
 browser_info text,
 internal_note text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_user_recent_idx ON public.support_tickets(user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_recent_idx ON public.support_tickets(status,updated_at DESC);

CREATE TABLE IF NOT EXISTS public.support_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
 author_type text NOT NULL CHECK (author_type IN ('usuario','admin')),
 author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 2 AND 3000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_messages_ticket_idx ON public.support_messages(ticket_id,created_at,id);

CREATE TABLE IF NOT EXISTS public.support_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
 message_id uuid REFERENCES public.support_messages(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('resposta','resolvido')),
 title text NOT NULL,
 read_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_notifications_user_unread_idx ON public.support_notifications(user_id,created_at DESC) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS public.support_attachments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
 message_id uuid NOT NULL REFERENCES public.support_messages(id) ON DELETE CASCADE,
 file_name text NOT NULL,
 object_path text NOT NULL UNIQUE,
 mime_type text NOT NULL CHECK (mime_type IN ('image/png','image/jpeg','image/webp')),
 size_bytes int NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_attachments_message_idx ON public.support_attachments(message_id);

CREATE OR REPLACE FUNCTION public.kivai_support_message_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE owner_id uuid; ticket_protocol text;
BEGIN
 UPDATE public.support_tickets SET updated_at = now() WHERE id = NEW.ticket_id
 RETURNING user_id,protocol INTO owner_id,ticket_protocol;
 IF NEW.author_type = 'admin' THEN
   INSERT INTO public.support_notifications(user_id,ticket_id,message_id,kind,title)
   VALUES (owner_id,NEW.ticket_id,NEW.id,'resposta','Nova resposta no protocolo ' || ticket_protocol);
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS kivai_support_message_event_trg ON public.support_messages;
CREATE TRIGGER kivai_support_message_event_trg AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.kivai_support_message_event();

CREATE OR REPLACE FUNCTION public.kivai_support_ticket_status_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
 IF NEW.status = 'resolvido' AND OLD.status IS DISTINCT FROM NEW.status THEN
   INSERT INTO public.support_notifications(user_id,ticket_id,kind,title)
   VALUES (NEW.user_id,NEW.id,'resolvido','Protocolo ' || NEW.protocol || ' marcado como resolvido');
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS kivai_support_ticket_status_event_trg ON public.support_tickets;
CREATE TRIGGER kivai_support_ticket_status_event_trg AFTER UPDATE OF status ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.kivai_support_ticket_status_event();

DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['support_tickets','support_messages','support_notifications','support_attachments']
 LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated',t);
 EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
END $$;
REVOKE ALL ON SEQUENCE public.support_protocol_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.support_protocol_seq TO service_role;
REVOKE ALL ON FUNCTION public.kivai_support_message_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kivai_support_ticket_status_event() FROM PUBLIC, anon, authenticated;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('support-attachments','support-attachments',false,5242880,ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=false,file_size_limit=5242880,allowed_mime_types=EXCLUDED.allowed_mime_types;
