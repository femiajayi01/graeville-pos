import { HttpErrorResponse } from '@angular/common/http';

/** Turns a NestJS error response into a human-readable message. */
export function errorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0) return 'Cannot reach the server. Is the API running?';

  const body = error.error as { message?: string | string[]; errors?: string[] } | null;
  const parts: string[] = [];
  if (Array.isArray(body?.message)) parts.push(...body.message);
  else if (body?.message) parts.push(body.message);
  if (Array.isArray(body?.errors)) parts.push(...body.errors);
  return parts.length ? parts.join(' • ') : fallback;
}
