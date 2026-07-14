-- Schema para o app de figurinhas com PostgreSQL

-- Tabela de grupos
CREATE TABLE IF NOT EXISTS groups (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  group_id VARCHAR(50) REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, name)
);

-- Tabela de figurinhas
CREATE TABLE IF NOT EXISTS stickers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  sticker_code VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('faltante', 'repetida')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, sticker_code, type)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_stickers_user ON stickers(user_id);
CREATE INDEX IF NOT EXISTS idx_stickers_type ON stickers(type);
