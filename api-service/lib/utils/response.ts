// lib/utils/response.ts — consistent HTTP response helpers

export function ok<T>(data: T): Response {
  return Response.json({ success: true, data });
}

export function okMessage(message: string): Response {
  return Response.json({ success: true, message });
}

export function fail(message: string, status = 400): Response {
  return Response.json({ success: false, message }, { status });
}