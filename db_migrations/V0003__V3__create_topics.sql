CREATE TABLE IF NOT EXISTS t_p16479477_forum_admin_panel_rg.topics (
  id SERIAL PRIMARY KEY,
  category_id INTEGER,
  author_id INTEGER,
  title VARCHAR(255) NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_hot BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_post_at TIMESTAMP DEFAULT NOW(),
  last_poster_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
)
