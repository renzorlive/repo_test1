import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-safe auth middleware. Uses only `authConfig` (no Prisma/bcrypt) so it
// can run on the Edge runtime. The `authorized` callback gates every route.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run on everything except static assets, the Next internals, and the
  // Auth.js API routes (which must remain publicly reachable).
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
