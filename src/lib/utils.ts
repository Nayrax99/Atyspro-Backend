/**
 * Shared utilities
 */

/** Regex for UUID validation */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate UUID format */
export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

/** API error with HTTP status for route handlers */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500
  ) {
    super(message);
    this.name = "ApiError";
  }
}
