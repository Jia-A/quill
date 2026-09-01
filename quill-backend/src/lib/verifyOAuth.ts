// Server-side verification of OAuth provider identity.
//
// The frontend performs the real OAuth handshake, but we must not trust the
// *conclusion* it sends us ("this user is alice@example.com") — that claim
// crosses the public internet as plain JSON and anyone can forge it. Instead we
// take the provider's signed *evidence* and verify it here, so the email we act
// on comes from a document we have proven the provider issued.
//
// Google and LinkedIn are OIDC providers: they issue an ID token (a JWT signed
// with their private key) whose signature we check against their published
// public keys (JWKS). GitHub is plain OAuth with no ID token, so instead we
// spend the access token against GitHub's API — a successful response is itself
// proof the token is genuine.

import { createRemoteJWKSet, jwtVerify } from "jose";

// Module scope on purpose: createRemoteJWKSet caches the fetched signing keys on
// the object it returns, and Workers reuse module scope across requests within
// an isolate. Building these per-request would mean a round-trip to the provider
// on every single login.
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const LINKEDIN_JWKS = createRemoteJWKSet(new URL("https://www.linkedin.com/oauth/openid/jwks"));

export const SUPPORTED_PROVIDERS = ["google", "github", "linkedin"] as const;
export type OAuthProvider = (typeof SUPPORTED_PROVIDERS)[number];

export function isSupportedProvider(p: unknown): p is OAuthProvider {
  return typeof p === "string" && (SUPPORTED_PROVIDERS as readonly string[]).includes(p);
}

type VerifyEnv = {
  GOOGLE_CLIENT_ID: string;
  LINKEDIN_CLIENT_ID: string;
};

// Issuer strings are taken from the installed @auth/core provider definitions so
// they match exactly what the frontend negotiated with. Google's issuer is the
// full https:// form here; some Google docs show the bare host, which will not
// match and would reject every login.
const OIDC_CONFIG = {
  google: {
    issuer: "https://accounts.google.com",
    jwks: GOOGLE_JWKS,
    clientIdKey: "GOOGLE_CLIENT_ID",
  },
  linkedin: {
    issuer: "https://www.linkedin.com/oauth",
    jwks: LINKEDIN_JWKS,
    clientIdKey: "LINKEDIN_CLIENT_ID",
  },
} as const;

// Verifies an OIDC ID token and returns the verified email, or null.
//
// Passing `audience` is what binds the token to *our* application. Without it a
// token Google legitimately issued for some other app would still carry a valid
// Google signature and would verify here — reintroducing the account-takeover
// this whole module exists to prevent. It is not optional.
async function verifyOidcToken(
  provider: "google" | "linkedin",
  idToken: string,
  env: VerifyEnv
): Promise<string | null> {
  const config = OIDC_CONFIG[provider];
  const audience = env[config.clientIdKey];

  if (!audience) {
    console.error(`[verifyOAuth] ${config.clientIdKey} is not configured`);
    return null;
  }

  // jwtVerify checks the signature against the JWKS and validates iss, aud and
  // exp for us; it throws on any failure.
  const { payload } = await jwtVerify(idToken, config.jwks, {
    issuer: config.issuer,
    audience,
  });

  // An unverified address is a claim, not evidence — accepting it would let a
  // user attach someone else's email to their provider account and take it over.
  // Providers disagree on how they encode this claim: Google sends a real
  // boolean, LinkedIn sends the string "true". Accept both spellings of true and
  // nothing else — false, "false", a missing claim and any other value are all
  // still rejected, so this tolerates an encoding quirk without weakening the
  // check itself.
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";
  if (!emailVerified) {
    console.error(`[verifyOAuth] ${provider} token has unverified email`);
    return null;
  }

  const email = payload.email;
  if (typeof email !== "string" || !email) {
    console.error(`[verifyOAuth] ${provider} token carried no email claim`);
    return null;
  }

  return email;
}

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

// GitHub issues no ID token, so there is nothing to check a signature on.
// Spending the access token against the API *is* the verification: only a
// genuine token returns this user's email list.
async function verifyGitHubToken(accessToken: string): Promise<string | null> {
  const res = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // GitHub rejects API requests that omit a User-Agent.
      "User-Agent": "quill-backend",
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    console.error(`[verifyOAuth] github /user/emails returned ${res.status}`);
    return null;
  }

  const emails = (await res.json()) as GitHubEmail[];
  if (!Array.isArray(emails)) {
    console.error("[verifyOAuth] github /user/emails returned an unexpected shape");
    return null;
  }

  // Both flags matter. GitHub lets a user attach an arbitrary address to their
  // account without proving ownership, so `primary` alone would let an attacker
  // claim a victim's email; only `verified` shows GitHub confirmed it.
  const primary = emails.find((e) => e?.primary && e?.verified);
  if (!primary?.email) {
    console.error("[verifyOAuth] github account has no verified primary email");
    return null;
  }

  return primary.email;
}

/**
 * Verifies a provider credential and returns the email address it proves
 * ownership of, or null if verification fails for any reason.
 *
 * Never throws: callers turn a null into a 401. Letting an error escape would
 * surface as an unhandled 500 (there is still no app.onError).
 */
export async function verifyOAuthToken(
  provider: OAuthProvider,
  token: unknown,
  env: VerifyEnv
): Promise<string | null> {
  if (typeof token !== "string" || !token) return null;

  try {
    if (provider === "github") {
      return await verifyGitHubToken(token);
    }
    return await verifyOidcToken(provider, token, env);
  } catch (error) {
    // Expected on a forged, expired, or malformed token; also covers JWKS fetch
    // failures. Logged server-side only — never echoed to the client.
    console.error(`[verifyOAuth] ${provider} verification failed:`, error);
    return null;
  }
}
