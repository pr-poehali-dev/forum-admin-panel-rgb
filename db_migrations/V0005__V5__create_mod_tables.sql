CREATE TABLE t_p16479477_forum_admin_panel_rg.warnings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  moderator_id INTEGER,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p16479477_forum_admin_panel_rg.bans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  moderator_id INTEGER,
  reason TEXT NOT NULL,
  expires_at TIMESTAMP,
  is_permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p16479477_forum_admin_panel_rg.mutes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  moderator_id INTEGER,
  reason TEXT NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p16479477_forum_admin_panel_rg.forum_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p16479477_forum_admin_panel_rg.sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE t_p16479477_forum_admin_panel_rg.reactions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER,
  user_id INTEGER,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id, emoji)
)
