import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-safe auth middleware. Uses only `authConfig` (no Prisma/bcrypt) so it
// can run on the Edge runtime. The `authorized` callback gates every route.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run on everything except static assets, Next internals, the Auth.js API
  // routes, and the runtime agent protocol (machines authenticate with a
  // session token, not a user session — see `requireRuntimeSession`).
  matcher: [
    "/((?!api/auth|api/runtime/agent|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
