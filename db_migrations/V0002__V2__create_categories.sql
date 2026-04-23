CREATE TABLE IF NOT EXISTS t_p16479477_forum_admin_panel_rg.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7) DEFAULT '#a855f7',
  sort_order INTEGER DEFAULT 0,
  topic_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)
