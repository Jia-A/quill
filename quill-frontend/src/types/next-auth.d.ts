import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in Session type with our custom fields.
   * Whatever you put here is what useSession() / auth() returns.
   */
  interface Session {
    backendToken?: string;
    user: {
      id?: string;
    } & DefaultSession["user"];
  }

  /**
   * Extends the User type returned from authorize() and OAuth providers.
   */
  interface User {
    backendToken?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the JWT type — the shape of the token inside the cookie.
   */
  interface JWT {
    id?: string;
    backendToken?: string;
  }
}
