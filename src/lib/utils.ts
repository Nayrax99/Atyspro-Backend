/**
 * Shared utilities
 */

/**
 * Formats an E.164 phone number to a human-readable French format.
 * +33616388356 → "06 16 38 83 56"
 * Returns the original string unchanged for non-French numbers.
 * Returns "—" if the input is null or empty.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const m = phone.match(/^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (m) return `0${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}`;
  return phone;
}

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
