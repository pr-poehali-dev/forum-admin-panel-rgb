export interface User {
  id: number;
  username: string;
  email?: string;
  role: "member" | "moderator" | "admin" | "owner";
  avatar_url?: string;
  bio?: string;
  title?: string;
  post_count: number;
  reputation?: number;
  rgb_profile: boolean;
  rgb_color1: string;
  rgb_color2: string;
  rgb_color3: string;
  is_banned: boolean;
  is_muted: boolean;
  created_at: string;
  last_seen_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  topic_count: number;
  post_count: number;
  is_visible: boolean;
  created_at: string;
}

export interface Topic {
  id: number;
  category_id: number;
  author_id?: number;
  username?: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_hot: boolean;
  views: number;
  reply_count: number;
  last_post_at?: string;
  created_at: string;
}

export interface Post {
  id: number;
  topic_id: number;
  author_id?: number;
  username?: string;
  user_title?: string;
  user_role?: string;
  user_post_count?: number;
  rgb_profile?: boolean;
  rgb_color1?: string;
  rgb_color2?: string;
  rgb_color3?: string;
  content: string;
  likes: number;
  removed?: boolean;
  edited_at?: string;
  created_at: string;
}

export interface Ban {
  id: number;
  user_id: number;
  username?: string;
  moderator_id?: number;
  moderator_username?: string;
  reason: string;
  expires_at?: string;
  is_permanent: boolean;
  created_at: string;
}

export interface Warning {
  id: number;
  user_id: number;
  username?: string;
  moderator_id?: number;
  moderator_username?: string;
  reason: string;
  created_at: string;
}

export interface Mute {
  id: number;
  user_id: number;
  username?: string;
  reason: string;
  expires_at?: string;
  created_at: string;
}

export interface ForumSettings {
  forum_name: string;
  forum_description: string;
  welcome_message: string;
  allow_registration: string;
  posts_per_page: string;
  topics_per_page: string;
  theme_color: string;
}

export interface ForumStats {
  users: number;
  posts: number;
  topics: number;
  online_count: number;
}
