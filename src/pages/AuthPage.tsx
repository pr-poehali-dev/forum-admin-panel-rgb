import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Tab = "login" | "register";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    searchParams.get("tab") === "register" ? "register" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      navigate("/");
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error ?? "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "hsl(240 15% 6%)" }}
    >
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full opacity-10 animate-float"
          style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)", top: "-10%", left: "10%", filter: "blur(60px)" }}
        />
        <div
          className="absolute w-80 h-80 rounded-full opacity-8 animate-float"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", bottom: "0", right: "5%", filter: "blur(50px)", animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center glow-purple mb-2">
              <Icon name="Zap" size={28} className="text-white" />
            </div>
            <span className="shimmer-text text-3xl font-bold font-exo">NeonForum</span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 border border-white/10">
          {/* Tabs */}
          <div className="flex rounded-xl glass p-1 mb-6 gap-1">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === "login"
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Icon name="LogIn" size={14} />
                Войти
              </span>
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === "register"
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Icon name="UserPlus" size={14} />
                Регистрация
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "register" && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Имя пользователя</Label>
                <div className="relative">
                  <Icon
                    name="User"
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className="glass border-white/10 pl-9 focus:border-purple-500/50"
                    autoComplete="username"
                    minLength={3}
                    maxLength={32}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <div className="relative">
                <Icon
                  name="Mail"
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="glass border-white/10 pl-9 focus:border-purple-500/50"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Пароль</Label>
              <div className="relative">
                <Icon
                  name="Lock"
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === "register" ? "Минимум 6 символов" : "••••••••"}
                  className="glass border-white/10 pl-9 focus:border-purple-500/50"
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  minLength={6}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="glass rounded-lg p-3 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm animate-fade-in">
                <Icon name="AlertCircle" size={15} />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium py-5 glow-purple hover:opacity-90 transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  Загрузка...
                </span>
              ) : tab === "login" ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="LogIn" size={16} />
                  Войти
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="UserPlus" size={16} />
                  Зарегистрироваться
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            {tab === "login" ? (
              <>
                Нет аккаунта?{" "}
                <button
                  onClick={() => { setTab("register"); setError(""); }}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Зарегистрироваться
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?{" "}
                <button
                  onClick={() => { setTab("login"); setError(""); }}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Войти
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
