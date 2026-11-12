// src/utils/response.ts — consistent HTTP response helpers

export function ok<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

export function fail(
  message: string,
  status = 400
): { success: false; message: string; status: number } {
  return { success: false, message, status };
}