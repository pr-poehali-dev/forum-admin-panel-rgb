import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@/lib/types";
import {
  AUTH_API,
  apiFetch,
  setSessionId,
  clearSessionId,
  getSessionId,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!getSessionId()) {
      setLoading(false);
      return;
    }
    const res = await apiFetch(AUTH_API, "/me");
    if (res.ok) {
      setUser((res.data as { user: User }).user ?? null);
    } else {
      clearSessionId();
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await apiFetch(AUTH_API, "/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const d = res.data as { session_id: string; user: User };
      setSessionId(d.session_id);
      setUser(d.user);
      return { ok: true };
    }
    return {
      ok: false,
      error: (res.data as { error?: string }).error ?? "Ошибка входа",
    };
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await apiFetch(AUTH_API, "/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    if (res.ok) {
      const d = res.data as { session_id: string; user: User };
      setSessionId(d.session_id);
      setUser(d.user);
      return { ok: true };
    }
    return {
      ok: false,
      error: (res.data as { error?: string }).error ?? "Ошибка регистрации",
    };
  };

  const logout = async () => {
    await apiFetch(AUTH_API, "/logout", { method: "POST" });
    clearSessionId();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
