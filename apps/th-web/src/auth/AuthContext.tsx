import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { THUser, THLoginRequest, THRegisterRequest } from "@assertquest/shared";
import { api, ApiRequestError } from "../lib/api.js";

const STORAGE_KEY = "th_access_token";

interface AuthState {
  user: THUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (payload: THLoginRequest) => Promise<void>;
  register: (payload: THRegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// Simpler than SwiftCargo's session model on purpose (see docs/api/th-platform.md)
// — a single long-lived token in localStorage, no refresh-cookie rotation.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<THUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    api
      .me(stored)
      .then((res) => {
        setUser(res.user);
        setAccessToken(stored);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: THLoginRequest) => {
    const res = await api.login(payload);
    localStorage.setItem(STORAGE_KEY, res.accessToken);
    setUser(res.user);
    setAccessToken(res.accessToken);
  }, []);

  const register = useCallback(async (payload: THRegisterRequest) => {
    const res = await api.register(payload);
    localStorage.setItem(STORAGE_KEY, res.accessToken);
    setUser(res.user);
    setAccessToken(res.accessToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setAccessToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!accessToken) return;
    const res = await api.me(accessToken);
    setUser(res.user);
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiRequestError };
