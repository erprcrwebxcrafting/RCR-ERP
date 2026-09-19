import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.passwordVersion = (user as any).passwordVersion;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).passwordVersion = token.passwordVersion;
      }
      return session;
    },
  },
  providers: [], // Added in auth.ts
} satisfies NextAuthConfig;
