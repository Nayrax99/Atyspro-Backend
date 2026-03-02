import { healthCheck } from "@/modules/health";

/**
 * GET /health - Health check
 */
export async function GET(_request: Request) {
  const body = healthCheck();
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
