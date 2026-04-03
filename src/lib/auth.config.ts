import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");
      const isPublicPage =
        nextUrl.pathname.startsWith("/pricing") ||
        nextUrl.pathname.startsWith("/api/stripe/webhook");

      if (isPublicPage) return true;

      if (isAuthPage) {
        return isLoggedIn ? Response.redirect(new URL("/dashboard", nextUrl)) : true;
      }

      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
