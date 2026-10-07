const TOKEN_KEY = "dish_assistant_token";

// The signed-in user, as returned by the backend (register, login, /api/auth/me)
export type AuthUser = { id: string; email: string; username: string };

type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type RegisterPayload = {
  email: string;
  password: string;
  acceptedTerms: boolean;
};

export function setToken(token: string, remember: boolean = false): void {
  if (typeof window === "undefined") return;
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export async function loginRequest(
  payload: LoginPayload
): Promise<{ user: AuthUser }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);

    throw new Error(
      data?.message ?? "That email and password don't match."
    );
  }

  return res.json();
}


export async function registerRequest(payload: RegisterPayload): Promise<{ user: AuthUser }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message ?? "Something went wrong creating your account.");
  }

  return res.json();
}