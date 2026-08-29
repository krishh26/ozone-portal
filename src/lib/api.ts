import { API_BASE_URL } from "../config/env";
import { resolveMediaTree } from "./mediaUrl";

const TOKEN_KEY = "ozone.auth.token";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const body = (await res.json()) as {
        message?: string;
        error?: string | { message?: string };
      };
      if (typeof body.error === "object" && body.error?.message) {
        message = body.error.message;
      } else if (body.message) {
        message = body.message;
      } else if (typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }

  return resolveMediaTree((await res.json()) as T);
}
