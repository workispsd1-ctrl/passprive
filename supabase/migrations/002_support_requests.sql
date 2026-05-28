CREATE TABLE IF NOT EXISTS support_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic      TEXT NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  mobile     TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

-- Only the service role (server-side) can read or write
CREATE POLICY "service_role_insert" ON support_requests
  FOR INSERT WITH CHECK (true);
