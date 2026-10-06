"use client";

// Who is signed in, available to every page and component through useAuth().
//
// The login cookies are httpOnly (JavaScript can't read them, on purpose), so the only way to
// know who is signed in is to ask the backend: GET /api/auth/me returns the user, or 401.
// If the 30-minute access token expired, apiRequest renews it once with the refresh cookie.

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { AuthUser } from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null; // null = signed out
  isLoading: boolean; // true until the first /api/auth/me answer arrives
  setUser: (user: AuthUser | null) => void; // call after login/register with the user from the response
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the signed-in user once, when the app opens (or the page is refreshed)
  useEffect(() => {
    apiRequest<{ user: AuthUser }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null)) // 401 (signed out) or server unreachable
      .finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, sign out on this device
    }
    setUser(null);
    router.push("/");
  }, [router]);

  const value = useMemo(() => ({ user, isLoading, setUser, logout }), [user, isLoading, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Signed-in user and auth actions. Must be used inside <AuthProvider> (see app/layout.tsx). */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
