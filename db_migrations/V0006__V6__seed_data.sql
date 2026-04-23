INSERT INTO t_p16479477_forum_admin_panel_rg.categories (name, description, icon, color, sort_order) VALUES
  ('Общее', 'Обсуждение всего подряд', 'MessageSquare', '#a855f7', 1),
  ('Новости', 'Последние новости и анонсы', 'Newspaper', '#06b6d4', 2),
  ('Игры', 'Всё об играх', 'Gamepad2', '#ec4899', 3),
  ('Технологии', 'IT, программирование, гаджеты', 'Cpu', '#22c55e', 4),
  ('Творчество', 'Арт, музыка, видео', 'Palette', '#f97316', 5),
  ('Флуд', 'Мемы, оффтоп, юмор', 'Smile', '#f59e0b', 6);

INSERT INTO t_p16479477_forum_admin_panel_rg.forum_settings (key, value) VALUES
  ('forum_name', 'NeonForum'),
  ('forum_description', 'Яркий форум нового поколения'),
  ('allow_registration', 'true'),
  ('posts_per_page', '20'),
  ('topics_per_page', '25'),
  ('theme_color', '#a855f7'),
  ('welcome_message', 'Добро пожаловать на NeonForum!');

INSERT INTO t_p16479477_forum_admin_panel_rg.users (username, email, password_hash, role, rgb_profile, title)
VALUES ('Admin', 'admin@forum.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGEz4ZWzlnVrpVWVeGjJ8sKRZQe', 'owner', true, 'Основатель')
