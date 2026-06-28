import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration.
 *
 * Contains only logic that can run in the Edge runtime (used by middleware).
 * The database adapter and the Credentials provider's `authorize` callback —
 * which need Prisma + bcrypt (Node APIs) — live in `src/lib/auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isOnAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/command-center", nextUrl));
        }
        return true;
      }

      // Everything else under the app requires authentication.
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
