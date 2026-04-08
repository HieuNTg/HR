import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole } from "@/generated/prisma";

/**
 * Auth config — demo mode: no login required.
 * `auth()` is kept exported so existing API routes don't break,
 * but `authorized()` always returns true (no redirect to login).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // Demo: return a fake admin user
        return {
          id: "demo-admin",
          email: "admin@novagroup.vn",
          name: "Admin NovaGroup",
          role: UserRole.ADMIN,
        };
      },
    }),
  ],
  callbacks: {
    // Allow all pages without login
    authorized() {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role ?? UserRole.CANDIDATE;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole) ?? UserRole.CANDIDATE;
      }
      return session;
    },
  },
});
