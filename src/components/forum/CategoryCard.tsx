import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import type { Category } from "@/lib/types";

const FALLBACK_COLORS = [
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#22c55e",
  "#f97316",
  "#3b82f6",
  "#f59e0b",
];

interface CategoryCardProps {
  category: Category;
  index: number;
}

export default function CategoryCard({ category, index }: CategoryCardProps) {
  const color =
    category.color && category.color !== "#000000" && category.color !== ""
      ? category.color
      : FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  const iconName = category.icon || "MessageSquare";

  return (
    <Link to={`/category/${category.id}`} className="block group">
      <div
        className="glass rounded-xl p-5 transition-all duration-300 hover:bg-white/5 hover:scale-[1.02] cursor-pointer animate-fade-in"
        style={{
          borderLeft: `3px solid ${color}`,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.05)`,
        }}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{
              background: `${color}20`,
              border: `1px solid ${color}40`,
              boxShadow: `0 0 15px ${color}20`,
            }}
          >
            <Icon name={iconName} size={22} style={{ color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-lg font-exo transition-colors duration-200 group-hover:text-white truncate"
              style={{ color }}
            >
              {category.name}
            </h3>
            {category.description && (
              <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="FileText" size={12} />
              <span>{category.topic_count} топиков</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="MessageCircle" size={12} />
              <span>{category.post_count} постов</span>
            </div>
          </div>
        </div>

        {/* Bottom glow line */}
        <div
          className="mt-4 h-px opacity-20 group-hover:opacity-40 transition-opacity duration-300"
          style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
        />
      </div>
    </Link>
  );
}