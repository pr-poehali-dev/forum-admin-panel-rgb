import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ADMIN_API, FORUM_API, apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { User, Ban, Warning, ForumSettings } from "@/lib/types";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ModerationModal from "@/components/forum/ModerationModal";

type Tab = "settings" | "users" | "bans" | "warnings";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  owner: { label: "Владелец", color: "#f59e0b" },
  admin: { label: "Администратор", color: "#ef4444" },
  moderator: { label: "Модератор", color: "#3b82f6" },
  member: { label: "Участник", color: "#94a3b8" },
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("settings");
  const [modModal, setModModal] = useState<{ user: User; type: "ban" | "mute" | "warn" } | null>(null);
  const [search, setSearch] = useState("");
  const [settingsForm, setSettingsForm] = useState<Partial<ForumSettings>>({});
  const [settingsSaved, setSettingsSaved] = useState(false);

  const { data: usersRes } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch(ADMIN_API, "/users?per_page=100"),
    enabled: tab === "users",
  });

  const { data: bansRes } = useQuery({
    queryKey: ["admin-bans"],
    queryFn: () => apiFetch(ADMIN_API, "/moderation/bans"),
    enabled: tab === "bans",
  });

  const { data: warningsRes } = useQuery({
    queryKey: ["admin-warnings"],
    queryFn: () => apiFetch(ADMIN_API, "/moderation/warnings"),
    enabled: tab === "warnings",
  });

  const { data: settingsRes } = useQuery({
    queryKey: ["forum-settings"],
    queryFn: () => apiFetch(FORUM_API, "/settings"),
    enabled: tab === "settings",
  });

  const settings = settingsRes?.ok ? (settingsRes.data as ForumSettings) : null;

  const saveSettingsMutation = useMutation({
    mutationFn: (data: Partial<ForumSettings>) =>
      apiFetch(ADMIN_API, "/settings", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-settings"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: number) =>
      apiFetch(ADMIN_API, `/users/${userId}/unban`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      apiFetch(ADMIN_API, `/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users: User[] = (usersRes?.data as { users?: User[] })?.users ?? [];
  const bans: Ban[] = (bansRes?.data as { bans?: Ban[] })?.bans ?? [];
  const warnings: Warning[] = (warningsRes?.data as { warnings?: Warning[] })?.warnings ?? [];

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "settings", label: "Настройки", icon: "Settings" },
    { key: "users", label: "Пользователи", icon: "Users" },
    { key: "bans", label: "Баны", icon: "Ban" },
    { key: "warnings", label: "Варны", icon: "AlertTriangle" },
  ];

  if (!loading && (!user || (user.role !== "admin" && user.role !== "owner"))) {
    navigate("/");
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8 animate-slide-up">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Icon name="ShieldCheck" size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-exo text-foreground">Панель администратора</h1>
          <p className="text-sm text-muted-foreground">Управление форумом</p>
        </div>
      </div>

      <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t.key
                ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon name={t.icon} size={14} />
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="glass-strong rounded-xl p-6 border border-white/10 animate-fade-in">
          <h2 className="text-lg font-semibold font-exo mb-6 text-foreground">Настройки форума</h2>
          {!settings ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 glass rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-5 max-w-lg">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Название форума</Label>
                <Input
                  defaultValue={settings.forum_name}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, forum_name: e.target.value }))}
                  className="glass border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Описание</Label>
                <Input
                  defaultValue={settings.forum_description}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, forum_description: e.target.value }))}
                  className="glass border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Приветственное сообщение</Label>
                <Textarea
                  defaultValue={settings.welcome_message}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, welcome_message: e.target.value }))}
                  className="glass border-white/10 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between glass rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Разрешить регистрацию</p>
                  <p className="text-xs text-muted-foreground">Новые пользователи могут регистрироваться</p>
                </div>
                <Switch
                  defaultChecked={settings.allow_registration === "true"}
                  onCheckedChange={(v) =>
                    setSettingsForm((f) => ({ ...f, allow_registration: v ? "true" : "false" }))
                  }
                />
              </div>
              <Button
                onClick={() => saveSettingsMutation.mutate({ ...settings, ...settingsForm })}
                disabled={saveSettingsMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white glow-purple"
              >
                {settingsSaved ? (
                  <><Icon name="Check" size={14} /> Сохранено!</>
                ) : saveSettingsMutation.isPending ? (
                  <><Icon name="Loader2" size={14} className="animate-spin" /> Сохранение...</>
                ) : (
                  <><Icon name="Save" size={14} /> Сохранить</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div className="animate-fade-in space-y-4">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или email..."
              className="glass border-white/10 pl-9"
            />
          </div>
          <div className="glass-strong rounded-xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[2fr_1fr_auto_auto] gap-2 px-4 py-2 border-b border-white/10 text-xs text-muted-foreground uppercase tracking-wide">
              <span>Пользователь</span>
              <span className="hidden sm:block">Роль</span>
              <span>Постов</span>
              <span>Действия</span>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Icon name="Users" size={32} className="mx-auto mb-3 opacity-30" />
                Пользователи не найдены
              </div>
            ) : (
              filteredUsers.map((u) => {
                const roleInfo = ROLE_LABELS[u.role] ?? ROLE_LABELS.member;
                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[2fr_1fr_auto_auto] gap-2 items-center px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #a855f7, #06b6d4)" }}
                      >
                        {u.username[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.username}</p>
                        {u.is_banned && (
                          <span className="text-xs text-red-400 flex items-center gap-1">
                            <Icon name="Ban" size={9} /> Забанен
                          </span>
                        )}
                        {u.is_muted && !u.is_banned && (
                          <span className="text-xs text-orange-400 flex items-center gap-1">
                            <Icon name="MicOff" size={9} /> Замьючен
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <select
                        value={u.role}
                        onChange={(e) => changeRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                        className="text-xs rounded-lg px-2 py-1 border outline-none cursor-pointer"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          borderColor: `${roleInfo.color}40`,
                          color: roleInfo.color,
                        }}
                        disabled={u.id === user?.id}
                      >
                        {Object.entries(ROLE_LABELS).map(([key, { label }]) => (
                          <option key={key} value={key} style={{ background: "#1a1a2e", color: "#fff" }}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-sm text-muted-foreground">{u.post_count}</span>
                    <div className="flex items-center gap-1">
                      {!u.is_banned ? (
                        <button
                          onClick={() => setModModal({ user: u, type: "ban" })}
                          title="Забанить"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                          disabled={u.id === user?.id}
                        >
                          <Icon name="Ban" size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => unbanMutation.mutate(u.id)}
                          title="Разбанить"
                          className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"
                        >
                          <Icon name="ShieldCheck" size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setModModal({ user: u, type: "mute" })}
                        title="Замьютить"
                        className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-400/10 transition-colors"
                        disabled={u.id === user?.id || u.is_muted}
                      >
                        <Icon name="MicOff" size={14} />
                      </button>
                      <button
                        onClick={() => setModModal({ user: u, type: "warn" })}
                        title="Предупреждение"
                        className="p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                        disabled={u.id === user?.id}
                      >
                        <Icon name="AlertTriangle" size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Bans tab */}
      {tab === "bans" && (
        <div className="animate-fade-in">
          <div className="glass-strong rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 text-xs text-muted-foreground uppercase tracking-wide grid grid-cols-[1fr_1fr_auto_auto] gap-2">
              <span>Пользователь</span>
              <span>Причина</span>
              <span>До</span>
              <span>Действие</span>
            </div>
            {bans.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Icon name="ShieldCheck" size={32} className="mx-auto mb-3 opacity-30" />
                Активных банов нет
              </div>
            ) : (
              bans.map((ban) => (
                <div
                  key={ban.id}
                  className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center px-4 py-3 border-b border-white/5 last:border-0"
                >
                  <span className="text-sm font-medium text-red-300">{ban.username ?? `#${ban.user_id}`}</span>
                  <span className="text-xs text-muted-foreground truncate">{ban.reason}</span>
                  <span className="text-xs text-muted-foreground">
                    {ban.is_permanent ? "Навсегда" : ban.expires_at ? new Date(ban.expires_at).toLocaleDateString("ru-RU") : "—"}
                  </span>
                  <button
                    onClick={() => unbanMutation.mutate(ban.user_id)}
                    className="px-2 py-1 text-xs rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"
                  >
                    Разбан
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Warnings tab */}
      {tab === "warnings" && (
        <div className="animate-fade-in">
          <div className="glass-strong rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 text-xs text-muted-foreground uppercase tracking-wide grid grid-cols-[1fr_2fr_auto] gap-2">
              <span>Пользователь</span>
              <span>Причина</span>
              <span>Дата</span>
            </div>
            {warnings.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Icon name="AlertTriangle" size={32} className="mx-auto mb-3 opacity-30" />
                Варнов пока нет
              </div>
            ) : (
              warnings.map((w) => (
                <div
                  key={w.id}
                  className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center px-4 py-3 border-b border-white/5 last:border-0"
                >
                  <span className="text-sm font-medium text-yellow-300">{w.username ?? `#${w.user_id}`}</span>
                  <span className="text-xs text-muted-foreground truncate">{w.reason}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(w.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {modModal && (
        <ModerationModal
          open={!!modModal}
          target={modModal.user}
          action={modModal.type}
          onClose={() => setModModal(null)}
          onConfirm={async (data) => {
            const uid = modModal.user.id;
            const type = modModal.type;
            if (type === "ban") {
              await apiFetch(ADMIN_API, `/users/${uid}/ban`, { method: "POST", body: JSON.stringify(data) });
            } else if (type === "mute") {
              await apiFetch(ADMIN_API, `/users/${uid}/mute`, { method: "POST", body: JSON.stringify(data) });
            } else {
              await apiFetch(ADMIN_API, `/users/${uid}/warn`, { method: "POST", body: JSON.stringify(data) });
            }
            setModModal(null);
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-bans"] });
            queryClient.invalidateQueries({ queryKey: ["admin-warnings"] });
          }}
        />
      )}
    </div>
  );
}