/**
 * Global shared types
 */

/** Standard API error response */
export interface ApiError {
  success?: false;
  error: string;
}

/** Standard API success wrapper */
export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
}
