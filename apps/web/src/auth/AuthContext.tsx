import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { PublicUser, LoginRequest, RegisterRequest } from "@assertquest/shared";
import { api, setSessionExpiredHandler, ApiRequestError } from "../lib/api.js";

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent refresh on load: the refresh token lives in an httpOnly cookie, so the
  // access token (kept only in memory, never localStorage) is lost on every page
  // reload — this recovers a session without the user re-entering credentials.
  useEffect(() => {
    api
      .refresh()
      .then((res) => {
        setUser(res.user);
        setAccessToken(res.tokens.accessToken);
      })
      .catch(() => {
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const res = await api.login(payload);
    setUser(res.user);
    setAccessToken(res.tokens.accessToken);
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const res = await api.register(payload);
    setUser(res.user);
    setAccessToken(res.tokens.accessToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    // Revoke the httpOnly refresh cookie server-side so it can't silently
    // re-authenticate the user (via the silent refresh on mount) after they've
    // explicitly logged out. Local state is already cleared above regardless
    // of whether this succeeds.
    api.logout().catch(() => {});
  }, []);

  // Any authed call that comes back 401 means the session has already died
  // server-side (expired/rotated token) — drop the stale local session so the
  // side nav and protected pages stop rendering as if still signed in.
  useEffect(() => {
    setSessionExpiredHandler(logout);
    return () => setSessionExpiredHandler(null);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout }}>
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
