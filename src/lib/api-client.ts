import type { ApiError } from "@/types";

/**
 * Typed fetch wrapper for the browser. Unwraps the `{ data }` envelope and
 * throws a structured error on non-2xx responses so React Query can surface it.
 */
export async function apiClient<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const error = (body as ApiError | null)?.error;
    throw new ApiClientError(
      error?.message ?? "Request failed",
      res.status,
      error?.code,
      error?.details,
    );
  }

  return (body as { data: T }).data;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}
