/**
 * Domain types for health module
 */

export interface HealthCheckResult {
  ok: boolean;
  service: string;
  ts: string;
}
