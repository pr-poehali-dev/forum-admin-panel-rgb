import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Icon from "@/components/ui/icon";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: "hsl(240 15% 6%)" }}
    >
      {/* ── Animated background orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Purple — top-left */}
        <div
          className="absolute w-[480px] h-[480px] rounded-full animate-float"
          style={{
            background: "radial-gradient(circle, #a855f7 0%, transparent 70%)",
            top: "-12%",
            left: "-8%",
            filter: "blur(72px)",
            opacity: 0.18,
          }}
        />
        {/* Cyan — top-right */}
        <div
          className="absolute w-[380px] h-[380px] rounded-full animate-float"
          style={{
            background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
            top: "15%",
            right: "-6%",
            filter: "blur(60px)",
            opacity: 0.14,
            animationDelay: "1.2s",
          }}
        />
        {/* Pink — bottom-center */}
        <div
          className="absolute w-[340px] h-[340px] rounded-full animate-float"
          style={{
            background: "radial-gradient(circle, #ec4899 0%, transparent 70%)",
            bottom: "8%",
            left: "28%",
            filter: "blur(64px)",
            opacity: 0.12,
            animationDelay: "2.2s",
          }}
        />
        {/* Purple — bottom-right */}
        <div
          className="absolute w-[280px] h-[280px] rounded-full animate-float"
          style={{
            background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
            bottom: "28%",
            right: "18%",
            filter: "blur(48px)",
            opacity: 0.1,
            animationDelay: "0.6s",
          }}
        />
        {/* Green accent — mid-left */}
        <div
          className="absolute w-[220px] h-[220px] rounded-full animate-float"
          style={{
            background: "radial-gradient(circle, #22c55e 0%, transparent 70%)",
            top: "55%",
            left: "5%",
            filter: "blur(52px)",
            opacity: 0.07,
            animationDelay: "3s",
          }}
        />
      </div>

      {/* ── Navbar ── */}
      <nav
        className="relative z-20 sticky top-0 border-b border-white/[0.07]"
        style={{
          background: "rgba(10, 10, 20, 0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center glow-purple flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)",
                }}
              >
                <Icon name="Zap" size={16} className="text-white" />
              </div>
              <span
                className="shimmer-text text-xl font-bold"
                style={{ fontFamily: '"Exo 2", sans-serif' }}
              >
                NeonForum
              </span>
            </Link>

            {/* Center nav links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <Icon name="Home" size={14} />
                Главная
              </Link>

              {user && (user.role === "admin" || user.role === "owner") && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
                  style={{ color: "#f97316" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(249,115,22,0.1)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <Icon name="ShieldCheck" size={14} />
                  Админ
                </Link>
              )}
            </div>

            {/* Auth area */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.08)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.04)")
                    }
                  >
                    {/* Mini avatar */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, #a855f7, #06b6d4)",
                      }}
                    >
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="text-foreground hidden sm:block max-w-[120px] truncate">
                      {user.username}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                    title="Выйти"
                  >
                    <Icon name="LogOut" size={14} />
                    <span className="hidden sm:block">Выйти</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="px-4 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-white transition-all duration-200"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.06)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "transparent")
                    }
                  >
                    Войти
                  </Link>
                  <Link
                    to="/auth?tab=register"
                    className="px-4 py-1.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all duration-200 glow-purple"
                    style={{
                      background:
                        "linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)",
                    }}
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className="relative z-10">{children}</main>

      {/* ── Footer ── */}
      <footer className="relative z-10 mt-20 py-8 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #a855f7, #06b6d4)",
              }}
            >
              <Icon name="Zap" size={11} className="text-white" />
            </div>
            <span
              className="shimmer-text text-sm font-semibold"
              style={{ fontFamily: '"Exo 2", sans-serif' }}
            >
              NeonForum
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Место для умных разговоров
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-white transition-colors">
              Главная
            </Link>
            {user && (
              <Link to="/profile" className="hover:text-white transition-colors">
                Профиль
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
