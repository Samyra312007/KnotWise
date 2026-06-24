import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import type { ClientSessionInfo } from "@knotwise/api-client";
import {
  clearToken,
  createMobileClient,
  getStoredToken,
  setUnauthorizedHandler,
  storeToken,
} from "@/lib/api";
import { registerForPushNotifications } from "@/lib/push";

type AuthState = {
  loading: boolean;
  token: string | null;
  client: ClientSessionInfo | null;
  needsOnboarding: boolean;
  signIn: (magicToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [client, setClient] = useState<ClientSessionInfo | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const signOut = useCallback(async () => {
    const existing = await getStoredToken();
    if (existing) {
      try {
        await createMobileClient(existing).logout();
      } catch {}
    }
    await clearToken();
    setToken(null);
    setClient(null);
    setNeedsOnboarding(false);
    router.replace("/login");
  }, []);

  const refresh = useCallback(async () => {
    const stored = await getStoredToken();
    if (!stored) {
      setToken(null);
      setClient(null);
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    try {
      const api = createMobileClient(stored);
      const session = await api.validateToken();
      setToken(stored);
      setClient(session.client);
      setNeedsOnboarding(session.needsOnboarding);
    } catch {
      await clearToken();
      setToken(null);
      setClient(null);
      setNeedsOnboarding(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    void refresh();
  }, [refresh, signOut]);

  const signIn = useCallback(async (magicToken: string) => {
    const api = createMobileClient();
    const result = await api.exchangeMagicToken(magicToken);
    await storeToken(result.token);
    setToken(result.token);
    setClient(result.client);
    setNeedsOnboarding(result.needsOnboarding);

    const authed = createMobileClient(result.token);
    void registerForPushNotifications(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000", authed).catch(
      () => undefined
    );

    if (result.needsOnboarding) {
      router.replace("/onboarding");
    } else {
      router.replace("/(tabs)");
    }
  }, []);

  const value = useMemo(
    () => ({ loading, token, client, needsOnboarding, signIn, signOut, refresh }),
    [loading, token, client, needsOnboarding, signIn, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider required");
  return ctx;
}
