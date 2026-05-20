import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import LinkedIn from "next-auth/providers/linkedin";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/auth" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID!,
      clientSecret: process.env.AUTH_LINKEDIN_SECRET!,
    }),
    Credentials({
      credentials: { //these are the main fields that will be passed to the authorize function as credentials
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const res = await fetch(`${process.env.AUTH_BACKEND_URL}/user/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        if (!res.ok) return null;

        const data = await res.json();
        const user = data.user;
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar ?? null,
          backendToken: data.token,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
    // Only run for OAuth — Credentials already gets its backendToken from authorize()
    if (
      account?.provider === "google" ||
      account?.provider === "github" ||
      account?.provider === "linkedin"
    ) {
      try {
        const res = await fetch(
          `${process.env.AUTH_BACKEND_URL}/user/oauth-sync`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              avatar: user.image,
            }),
          }
        );
        if (!res.ok) {
          console.error("[signIn] oauth-sync failed:", await res.text());
          return false; // blocks the sign-in
        }
        const data = await res.json();
        // Stash backend data onto the user object — jwt callback will pick it up
        user.id = data.user.id;
        user.backendToken = data.token;
      } catch (err) {
        console.error("[signIn] oauth-sync error:", err);
        return false;
      }
    }
    return true; // allow sign-in to proceed
  },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.backendToken = (user as { backendToken?: string }).backendToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      session.backendToken = token.backendToken as string | undefined;
      return session;
    },
  
  },
});