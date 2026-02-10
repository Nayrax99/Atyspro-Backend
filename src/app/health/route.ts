export async function GET(_request: Request) {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "atyspro-backend",
      ts: new Date().toISOString(),
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

