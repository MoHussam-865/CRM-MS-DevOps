"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getApiClient } from "@/src/lib/api";
import type { User } from "@/src/types";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ─── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate any existing token on mount by fetching /api/me
  // Only setUser is called inside the effect body, and only within
  // async .then/.catch callbacks — never synchronously — so it
  // does not trigger react-hooks/set-state-in-effect.
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      return;
    }

    let cancelled = false;

    getApiClient()
      .get<User>("/api/me")
      .then((res) => {
        if (cancelled) return;
        if (res.data) setUser(res.data);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem("token");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await getApiClient().post<{ token: string; user: User }>(
      "/api/login",
      { email, password },
    );

    if (!res.data) throw new Error("No data returned from login");

    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
