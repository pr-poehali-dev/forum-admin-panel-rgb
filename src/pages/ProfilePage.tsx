import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AUTH_API, apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ROLE_LABELS: Record<string, string> = {
  owner: "Владелец",
  admin: "Администратор",
  moderator: "Модератор",
  user: "Участник",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "#f59e0b",
  admin: "#ef4444",
  moderator: "#3b82f6",
  user: "#94a3b8",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [bio, setBio] = useState("");
  const [title, setTitle] = useState("");
  const [rgbProfile, setRgbProfile] = useState(false);
  const [rgbColor1, setRgbColor1] = useState("#a855f7");
  const [rgbColor2, setRgbColor2] = useState("#06b6d4");
  const [rgbColor3, setRgbColor3] = useState("#ec4899");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    setBio(user.bio ?? "");
    setTitle(user.title ?? "");
    setRgbProfile(user.rgb_profile ?? false);
    setRgbColor1(user.rgb_color1 ?? "#a855f7");
    setRgbColor2(user.rgb_color2 ?? "#06b6d4");
    setRgbColor3(user.rgb_color3 ?? "#ec4899");
  }, [user, navigate]);

  const updateMutation = useMutation({
    mutationFn: (data: object) =>
      apiFetch(AUTH_API, "/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
      await refreshUser();
      setSaved(true);
      setSaveError("");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: { error?: string }) => {
      setSaveError(err?.error ?? "Ошибка сохранения");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      bio: bio || null,
      title: title || null,
      rgb_profile: rgbProfile ? "true" : "false",
      rgb_color1: rgbColor1,
      rgb_color2: rgbColor2,
      rgb_color3: rgbColor3,
    });
  };

  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role] ?? "#94a3b8";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold font-exo mb-8 shimmer-text animate-slide-up">Профиль</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: profile card */}
        <div className="md:col-span-1">
          <div
            className={`glass-strong rounded-2xl p-6 text-center border border-white/10 animate-fade-in ${rgbProfile ? "rgb-border" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold font-exo ${rgbProfile ? "rgb-border" : ""}`}
              style={
                rgbProfile
                  ? {}
                  : {
                      background: `linear-gradient(135deg, ${roleColor}40, ${roleColor}20)`,
                      border: `2px solid ${roleColor}50`,
                    }
              }
            >
              {user.username[0].toUpperCase()}
            </div>

            {/* Username */}
            <div
              className={`text-xl font-semibold font-exo ${rgbProfile ? "rgb-text" : ""}`}
              style={rgbProfile ? {} : { color: roleColor }}
            >
              {user.username}
            </div>

            {/* Role */}
            <div
              className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium"
              style={{ color: roleColor, background: `${roleColor}20` }}
            >
              {ROLE_LABELS[user.role] ?? user.role}
            </div>

            {/* Custom title */}
            {title && (
              <div className="text-xs text-muted-foreground mt-2 italic">{title}</div>
            )}

            {/* Stats */}
            <div className="mt-5 space-y-2">
              <div className="glass rounded-lg p-2.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Icon name="MessageSquare" size={12} /> Постов
                </span>
                <span className="font-semibold text-foreground">{user.post_count}</span>
              </div>
              <div className="glass rounded-lg p-2.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Icon name="Calendar" size={12} /> На форуме с
                </span>
                <span className="text-xs text-foreground">{formatDate(user.created_at)}</span>
              </div>
              {user.is_muted && (
                <div className="glass rounded-lg p-2.5 flex items-center gap-2 text-xs text-orange-400">
                  <Icon name="MicOff" size={12} /> Вы замьючены
                </div>
              )}
              {user.is_banned && (
                <div className="glass rounded-lg p-2.5 flex items-center gap-2 text-xs text-red-400">
                  <Icon name="Ban" size={12} /> Аккаунт заблокирован
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: edit form */}
        <div className="md:col-span-2 space-y-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {/* Basic info */}
          <div className="glass-strong rounded-xl p-5 border border-white/10">
            <h2 className="font-semibold font-exo text-foreground mb-4 flex items-center gap-2">
              <Icon name="Edit3" size={16} className="text-purple-400" />
              Основные данные
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Заголовок профиля</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Опытный разработчик..."
                  className="glass border-white/10"
                  maxLength={60}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">О себе</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о себе..."
                  className="glass border-white/10 resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
              </div>
            </div>
          </div>

          {/* RGB settings */}
          <div className="glass-strong rounded-xl p-5 border border-white/10">
            <h2 className="font-semibold font-exo text-foreground mb-4 flex items-center gap-2">
              <Icon name="Sparkles" size={16} className="text-cyan-400" />
              RGB профиль
            </h2>

            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setRgbProfile((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  rgbProfile
                    ? "bg-gradient-to-r from-purple-600 to-cyan-500"
                    : "bg-white/10"
                }`}
              >
                <div
                  className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all duration-300 ${
                    rgbProfile ? "left-6.5" : "left-0.5"
                  }`}
                  style={{ left: rgbProfile ? "26px" : "2px" }}
                />
              </button>
              <span className="text-sm text-muted-foreground">
                {rgbProfile ? "RGB эффект включён" : "RGB эффект выключен"}
              </span>
            </div>

            {rgbProfile && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Цвет 1", value: rgbColor1, set: setRgbColor1 },
                    { label: "Цвет 2", value: rgbColor2, set: setRgbColor2 },
                    { label: "Цвет 3", value: rgbColor3, set: setRgbColor3 },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
                        />
                        <span className="text-xs text-muted-foreground font-mono">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div className="glass rounded-xl p-4 mt-4">
                  <p className="text-xs text-muted-foreground mb-3">Предпросмотр:</p>
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold font-exo mx-auto rgb-border"
                    style={{
                      background: `linear-gradient(135deg, ${rgbColor1}30, ${rgbColor2}30, ${rgbColor3}30)`,
                    }}
                  >
                    <span className="rgb-text">{user.username[0].toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          {saveError && (
            <div className="glass rounded-lg p-3 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
              <Icon name="AlertCircle" size={14} /> {saveError}
            </div>
          )}
          {saved && (
            <div className="glass rounded-lg p-3 border border-green-500/30 flex items-center gap-2 text-green-400 text-sm animate-fade-in">
              <Icon name="CheckCircle" size={14} /> Сохранено успешно!
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium glow-purple hover:opacity-90 transition-all duration-200"
          >
            {updateMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Icon name="Loader2" size={14} className="animate-spin" /> Сохранение...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Icon name="Save" size={14} /> Сохранить изменения
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
