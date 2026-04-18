CREATE TABLE IF NOT EXISTS public.private_messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_private_messages_sender_receiver_created
  ON public.private_messages (sender_id, receiver_id, created_at);

CREATE INDEX IF NOT EXISTS idx_private_messages_receiver_sender_created
  ON public.private_messages (receiver_id, sender_id, created_at);
