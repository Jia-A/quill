import { isAxiosError } from "axios";

type ApiErrorBody = { error?: { message?: string } };

/** Status code of a failed API response, or undefined for non-HTTP errors. */
export const getApiErrorStatus = (err: unknown): number | undefined =>
  isAxiosError(err) ? err.response?.status : undefined;

/** Server-supplied error message, falling back to `fallback`. */
export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  const message = isAxiosError(err)
    ? (err.response?.data as ApiErrorBody | undefined)?.error?.message
    : undefined;
  return message ?? fallback;
};
