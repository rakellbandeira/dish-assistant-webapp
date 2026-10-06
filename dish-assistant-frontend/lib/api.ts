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

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  if (!res.ok) {
    // Every backend error has the shape { "message": "..." }
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message ?? "Something went wrong. Please try again.", res.status);
  }

  return res.json() as Promise<T>;
}
