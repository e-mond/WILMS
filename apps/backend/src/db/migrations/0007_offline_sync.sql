-- P14.6 offline sync queue + conflict review
CREATE TABLE IF NOT EXISTS offline_sync_operations (
  id UUID PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES users(id),
  operation_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  client_created_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS offline_sync_idempotency_idx
  ON offline_sync_operations (actor_user_id, idempotency_key);

CREATE INDEX IF NOT EXISTS offline_sync_status_idx ON offline_sync_operations (status);

CREATE TABLE IF NOT EXISTS offline_sync_conflicts (
  id UUID PRIMARY KEY,
  operation_id UUID NOT NULL REFERENCES offline_sync_operations(id),
  conflict_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  resolution_note TEXT,
  resolved_by_user_id UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offline_sync_conflicts_status_idx ON offline_sync_conflicts (status);

-- Down (rollback): DROP TABLE offline_sync_conflicts; DROP TABLE offline_sync_operations;
