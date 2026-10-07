// One place for calling the FastAPI backend.
// Paths are relative ("/api/..."): Next.js forwards them to the backend (see next.config.ts),
// and the browser sends the login cookies automatically. See docs/auth-contract.md.

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// These never trigger a refresh: they are the login/session endpoints themselves
const NO_REFRESH_PATHS = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/logout"];

let refreshInProgress: Promise<boolean> | null = null;

/**
 * Ask the backend for a new 30-minute access token using the longer-lived refresh cookie.
 * Several requests failing at once share one refresh call. Returns true if the session was renewed.
 */
export function refreshSession(): Promise<boolean> {
  refreshInProgress ??= fetch("/api/auth/refresh", { method: "POST" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInProgress = null;
    });
  return refreshInProgress;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, canRefresh = true): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  // Access token expired: renew the session once, then repeat the same request
  if (res.status === 401 && canRefresh && !NO_REFRESH_PATHS.includes(path) && (await refreshSession())) {
    return apiRequest<T>(path, options, false);
  }

  if (!res.ok) {
    // Every backend error has the shape { "message": "..." }
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message ?? "Something went wrong. Please try again.", res.status);
  }

  return res.json() as Promise<T>;
}
