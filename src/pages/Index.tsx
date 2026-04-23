import { useQuery } from "@tanstack/react-query";
import { FORUM_API, apiFetch } from "@/lib/api";
import type { Category, ForumStats, ForumSettings } from "@/lib/types";
import CategoryCard from "@/components/forum/CategoryCard";
import Icon from "@/components/ui/icon";

function StatCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  delay: string;
}) {
  return (
    <div
      className="glass rounded-xl p-5 text-center animate-fade-in opacity-0-start"
      style={{
        animationDelay: delay,
        animationFillMode: "forwards",
        borderTop: `2px solid ${color}50`,
      }}
    >
      <div
        className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
        style={{ background: `${color}20`, boxShadow: `0 0 20px ${color}30` }}
      >
        <Icon name={icon} size={22} style={{ color }} />
      </div>
      <div className="text-2xl font-bold font-exo text-foreground">
        {value.toLocaleString("ru-RU")}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function Index() {
  const { data: settingsRes, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch(FORUM_API, "/settings"),
  });

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiFetch(FORUM_API, "/stats"),
  });

  const { data: categoriesRes, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch(FORUM_API, "/categories"),
  });

  const settings = (settingsRes?.ok ? settingsRes.data : null) as ForumSettings | null;
  const stats = (statsRes?.ok ? statsRes.data : null) as ForumStats | null;
  const categories = (
    categoriesRes?.ok ? (categoriesRes.data as { categories: Category[] }).categories : []
  ) as Category[];

  const forumName = settings?.forum_name ?? "NeonForum";
  const forumDesc = settings?.forum_description ?? "Место для ярких разговоров";
  const welcomeMsg = settings?.welcome_message ?? "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <section className="text-center mb-14 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-purple-500/30 text-xs text-purple-300 mb-6">
          <Icon name="Zap" size={12} className="animate-pulse-glow" style={{ color: "#a855f7" }} />
          Добро пожаловать на форум
        </div>

        {settingsLoading ? (
          <div className="h-16 w-80 mx-auto rounded-xl bg-white/5 animate-pulse mb-4" />
        ) : (
          <h1 className="text-5xl sm:text-6xl font-bold font-exo mb-4">
            <span className="shimmer-text">{forumName}</span>
          </h1>
        )}

        <p className="text-muted-foreground text-lg max-w-xl mx-auto">{forumDesc}</p>

        {welcomeMsg && (
          <div className="mt-6 max-w-2xl mx-auto glass rounded-xl p-4 border border-cyan-500/20">
            <p className="text-sm text-cyan-300/80">{welcomeMsg}</p>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="mb-12">
        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon="Users" label="Пользователей" value={stats.users} color="#a855f7" delay="0.1s" />
            <StatCard icon="FileText" label="Топиков" value={stats.topics} color="#06b6d4" delay="0.2s" />
            <StatCard icon="MessageCircle" label="Постов" value={stats.posts} color="#ec4899" delay="0.3s" />
            <StatCard icon="Wifi" label="Онлайн" value={stats.online_count} color="#22c55e" delay="0.4s" />
          </div>
        ) : null}
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
            <Icon name="LayoutGrid" size={16} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold font-exo text-foreground">Разделы форума</h2>
        </div>

        {categoriesLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-5 h-20 animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Icon name="FolderOpen" size={48} className="text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground text-lg">Разделы ещё не созданы</p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              Попросите администратора добавить категории
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
