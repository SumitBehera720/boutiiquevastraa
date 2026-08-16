export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function buildUrl(endpoint: string, params?: Record<string, string>): string {
  const isServer = typeof window === "undefined";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const base = isServer && siteUrl
    ? siteUrl
    : isServer
    ? `http://127.0.0.1:${process.env.PORT || 3000}`
    : window.location.origin;
  const url = new URL(`/api${endpoint}`, base);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return isServer ? url.href : url.pathname + url.search;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const path = buildUrl(endpoint, options.params);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const cookieStr = cookieStore.toString();
      if (cookieStr) {
        headers["Cookie"] = cookieStr;
      }
    } catch {}
  }

  const res = await fetch(path, {
    ...options,
    headers,
    cache: "no-store",
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let data: any;
    try {
      data = await res.json();
    } catch {
      data = await res.text().catch(() => null);
    }
    throw new ApiError(res.status, data?.message || res.statusText || "API Error", data);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function apiGet<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  return apiFetch<T>(endpoint, { method: "GET", params });
}

export async function apiPost<T>(endpoint: string, body?: any): Promise<T> {
  return apiFetch<T>(endpoint, { method: "POST", body });
}

export async function apiPut<T>(endpoint: string, body?: any): Promise<T> {
  return apiFetch<T>(endpoint, { method: "PUT", body });
}

export async function apiPatch<T>(endpoint: string, body?: any): Promise<T> {
  return apiFetch<T>(endpoint, { method: "PATCH", body });
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: "DELETE" });
}
