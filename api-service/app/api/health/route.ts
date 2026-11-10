// app/api/health/route.ts — GET /api/health (no auth required)

export async function GET() {
  return Response.json({ status: "ok" });
}