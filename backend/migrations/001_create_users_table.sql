-- Migration: Create users table
-- Description: Store user account information

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default demo users (same as hardcoded data)
INSERT INTO users (email, password, name, created_at) VALUES
  ('demo@example.com', 'demo123', 'Demo User', '2025-12-10'),
  ('john@example.com', 'password', 'John Doe', '2025-12-10')
ON CONFLICT (email) DO NOTHING;

-- Add comment
COMMENT ON TABLE users IS 'User accounts for OXY Productivity';

