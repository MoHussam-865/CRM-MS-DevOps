// lib/utils/auth.ts — JWT helpers + current-user extraction

import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { getConfig } from "../config";

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

export function signToken(payload: JwtPayload): string {
  const config = getConfig();
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): JwtPayload {
  const config = getConfig();
  return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
}

/**
 * Extract the current user's id from an incoming request.
 * Returns `null` when the header is missing or the token is invalid.
 */
export function getCurrentUserId(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  try {
    const payload = verifyToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}