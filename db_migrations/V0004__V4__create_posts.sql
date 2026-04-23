CREATE TABLE t_p16479477_forum_admin_panel_rg.posts (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER,
  author_id INTEGER,
  content TEXT NOT NULL,
  removed BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
)
