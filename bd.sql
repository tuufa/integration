
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица animals
CREATE TABLE IF NOT EXISTS animals (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  url VARCHAR(255) NOT NULL,
  api_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица likes
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  animal_id INTEGER REFERENCES animals(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, animal_id)
);

-- Таблица posts
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  animal_id INTEGER REFERENCES animals(id),
  fact_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);