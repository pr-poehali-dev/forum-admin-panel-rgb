import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import type { Topic } from "@/lib/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

interface TopicRowProps {
  topic: Topic;
}

export default function TopicRow({ topic }: TopicRowProps) {
  const isHot = topic.reply_count > 20 || topic.views > 100;

  return (
    <Link to={`/topic/${topic.id}`} className="block group">
      <div className="glass rounded-xl px-5 py-4 transition-all duration-200 hover:bg-white/5 hover:scale-[1.005]">
        <div className="flex items-center gap-4">
          {/* Status icon */}
          <div className="flex-shrink-0">
            {topic.is_locked ? (
              <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <Icon name="Lock" size={16} className="text-red-400" />
              </div>
            ) : topic.is_pinned ? (
              <div className="w-9 h-9 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
                <Icon name="Pin" size={16} className="text-yellow-400" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                <Icon name="MessageSquare" size={16} className="text-purple-400" />
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-foreground group-hover:text-white transition-colors duration-200 truncate">
                {topic.title}
              </h3>
              {/* Badges */}
              {topic.is_pinned && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex-shrink-0">
                  Закреплён
                </span>
              )}
              {topic.is_locked && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
                  Закрыт
                </span>
              )}
              {isHot && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 flex-shrink-0">
                  Горячий
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="User" size={11} />
                {topic.username}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Calendar" size={11} />
                {formatDate(topic.created_at)}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5 flex-shrink-0 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 text-center">
              <Icon name="Eye" size={12} />
              <span>{topic.views}</span>
            </div>
            <div className="flex items-center gap-1 text-center">
              <Icon name="MessageCircle" size={12} />
              <span>{topic.reply_count}</span>
            </div>
            {topic.last_post_at && (
              <div className="hidden sm:flex items-center gap-1">
                <Icon name="Clock" size={12} />
                <span>{formatDate(topic.last_post_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
