import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/server/errors";

/** Wrap a successful payload in the standard API envelope. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

/** Convert thrown errors into a consistent JSON error envelope. */
export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.flatten(),
        },
      },
      { status: 422 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          ...("details" in error ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    );
  }

  console.error("[API] Unhandled error:", error);
  return NextResponse.json(
    { error: { message: "Internal server error", code: "INTERNAL_ERROR" } },
    { status: 500 },
  );
}

/**
 * Thin wrapper that runs a route handler and routes thrown errors through
 * `handleError`, keeping individual route files free of try/catch boilerplate.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
