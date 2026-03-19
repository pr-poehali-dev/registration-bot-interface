CREATE TABLE IF NOT EXISTS vc_users (
  id SERIAL PRIMARY KEY,
  nick VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vc_chats (
  id SERIAL PRIMARY KEY,
  user1_id INT NOT NULL REFERENCES vc_users(id),
  user2_id INT NOT NULL REFERENCES vc_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS vc_messages (
  id SERIAL PRIMARY KEY,
  chat_id INT NOT NULL REFERENCES vc_chats(id),
  sender_id INT NOT NULL REFERENCES vc_users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vc_bot_messages (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES vc_users(id),
  text TEXT NOT NULL,
  from_bot BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vc_messages_chat ON vc_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_vc_bot_user ON vc_bot_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_vc_chats_u1 ON vc_chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_vc_chats_u2 ON vc_chats(user2_id);
