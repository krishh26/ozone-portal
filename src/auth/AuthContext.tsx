import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginApi, logoutApi, meApi, type User } from "../api/client";
import { ApiError, getAuthToken, setAuthToken } from "../lib/api";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(getAuthToken()));

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsBootstrapping(false);
      return;
    }

    let cancelled = false;
    meApi()
      .then((current) => {
        if (!cancelled) setUser(current);
      })
      .catch(() => {
        if (!cancelled) {
          setAuthToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const current = await loginApi(email, password);
      setUser(current);
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof ApiError ? error.message : "Invalid email or password.",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      logout,
    }),
    [user, isBootstrapping, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
