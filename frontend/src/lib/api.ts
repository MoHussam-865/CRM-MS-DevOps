import type { ApiResponse } from "@/src/types";

// ─── Types ─────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>>;
  post<T>(path: string, body?: unknown): Promise<ApiResponse<T>>;
  put<T>(path: string, body?: unknown): Promise<ApiResponse<T>>;
  del<T>(path: string): Promise<ApiResponse<T>>;
}

type RequestOptions = Omit<RequestInit, "method" | "body">;

// ─── Factory ───────────────────────────────────────────────────────────────

export function apiClient(baseUrl: string): ApiClient {
  async function request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const url = new URL(path, baseUrl);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };

    // Attach JWT if present
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });

    const json: ApiResponse<T> = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message ?? `Request failed (${res.status})`);
    }

    return json;
  }

  return {
    get: <T>(path: string, params?: Record<string, string>) => {
      const searchParams = params ? `?${new URLSearchParams(params)}` : "";
      return request<T>("GET", `${path}${searchParams}`);
    },
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
    del: <T>(path: string) => request<T>("DELETE", path),
  };
}

// ─── Singleton Instance ────────────────────────────────────────────────────

let _client: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    _client = apiClient(url);
  }
  return _client;
}
