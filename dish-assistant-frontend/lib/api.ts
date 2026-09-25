const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<{ token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

// --- Preferences ---
export const preferencesApi = {
  get: () => request<unknown>("/preferences"),

  update: (data: unknown) =>
    request<unknown>("/preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// --- Recommendations ---
export const recommendationsApi = {
  getForMenu: (menuInput: unknown) =>
    request<unknown>("/recommendations", {
      method: "POST",
      body: JSON.stringify(menuInput),
    }),

  getHistory: () => request<unknown[]>("/recommendations/history"),
};

export { ApiError };