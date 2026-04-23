import Icon from "@/components/ui/icon";
import type { Post } from "@/lib/types";

const ROLE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  owner: { label: "Владелец", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  admin: { label: "Админ", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  moderator: { label: "Модератор", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  user: { label: "Участник", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface PostCardProps {
  post: Post;
  index: number;
}

export default function PostCard({ post, index }: PostCardProps) {
  const roleStyle = ROLE_STYLES[post.user_role] ?? ROLE_STYLES.user;
  const hasRgb = post.rgb_profile;

  return (
    <div
      className={`glass rounded-xl overflow-hidden animate-fade-in transition-all duration-300 hover:bg-white/5 ${hasRgb ? "rgb-border" : "border border-white/5"}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Left: user info */}
        <div
          className="sm:w-48 p-4 flex flex-row sm:flex-col items-center sm:items-center gap-3 sm:gap-2 border-b sm:border-b-0 sm:border-r border-white/5"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          {/* Avatar */}
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-xl font-bold font-exo flex-shrink-0 ${hasRgb ? "rgb-border" : ""}`}
            style={
              hasRgb
                ? {}
                : {
                    background: `linear-gradient(135deg, ${roleStyle.color}40, ${roleStyle.color}20)`,
                    border: `2px solid ${roleStyle.color}40`,
                  }
            }
          >
            {post.username[0].toUpperCase()}
          </div>

          {/* Username */}
          <div className="flex-1 sm:text-center">
            <div
              className={`font-semibold text-sm truncate ${hasRgb ? "rgb-text" : ""}`}
              style={hasRgb ? {} : { color: roleStyle.color }}
            >
              {post.username}
            </div>

            {/* Role badge */}
            <div
              className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium"
              style={{ color: roleStyle.color, background: roleStyle.bg }}
            >
              {roleStyle.label}
            </div>

            {/* Custom title */}
            {post.user_title && (
              <div className="text-xs text-muted-foreground mt-1 italic truncate">
                {post.user_title}
              </div>
            )}

            {/* Post count */}
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
              <Icon name="MessageSquare" size={10} />
              <span>{post.user_post_count} постов</span>
            </div>
          </div>
        </div>

        {/* Right: content */}
        <div className="flex-1 p-4 min-w-0">
          {/* Post header */}
          <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Icon name="Clock" size={11} />
              <span>{formatDate(post.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="Hash" size={11} />
              <span>#{post.id}</span>
            </div>
          </div>

          {/* Content */}
          <div
            className="text-foreground text-sm leading-relaxed whitespace-pre-wrap break-words"
            style={{ minHeight: "3rem" }}
          >
            {post.content}
          </div>
        </div>
      </div>
    </div>
  );
}
