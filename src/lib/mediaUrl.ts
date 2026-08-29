import { API_BASE_URL } from "../config/env";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");

export function resolveMediaUrl(value: string): string {
  if (!value.includes("/uploads/")) return value;

  let out = value.replace(
    /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/[^\s"'<>?#]*)/gi,
    `${API_ORIGIN}$1`,
  );
  out = out.replace(/(^|["'(=\s])(\/uploads\/[^\s"'<>?#]+)/g, `$1${API_ORIGIN}$2`);
  return out;
}

export function resolveMediaTree<T>(value: T): T {
  if (typeof value === "string") return resolveMediaUrl(value) as T;
  if (Array.isArray(value)) return value.map((item) => resolveMediaTree(item)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = resolveMediaTree(nested);
    }
    return out as T;
  }
  return value;
}
