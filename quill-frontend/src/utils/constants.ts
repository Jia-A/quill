export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/api/v1";

export const WS_API_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787/api/v1";

export const IS_SSR = typeof window === "undefined";
