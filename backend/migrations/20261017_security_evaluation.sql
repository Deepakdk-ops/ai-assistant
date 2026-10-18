-- Review and back up the database before applying. Run as the application migration owner.
CREATE TABLE IF NOT EXISTS users (
  id varchar(36) PRIMARY KEY,
  email varchar(320) NOT NULL UNIQUE,
  full_name varchar(180) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role varchar(24) NOT NULL DEFAULT 'user',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id varchar(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  chat_model varchar(120) NOT NULL DEFAULT 'qwen2.5:3b',
  embedding_model varchar(120) NOT NULL DEFAULT 'nomic-embed-text',
  retrieval_top_k integer NOT NULL DEFAULT 5,
  temperature double precision NOT NULL DEFAULT 0.2,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE evaluation_runs ADD COLUMN IF NOT EXISTS error_message text;
