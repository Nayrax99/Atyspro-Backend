/**
 * Health domain service - business logic for health endpoints
 */

import { seedHealthDb } from "@/modules/dev";
import type { HealthCheckResult } from "./health.types";

/** Returns health check payload */
export function healthCheck(): HealthCheckResult {
  return {
    ok: true,
    service: "atyspro-backend",
    ts: new Date().toISOString(),
  };
}

/** Seed DB for health/db endpoint - uses maybeSingle for account lookup */
export async function seedDb() {
  return seedHealthDb();
}
