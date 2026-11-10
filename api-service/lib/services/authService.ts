// lib/services/authService.ts — login & get-me business logic

import bcrypt from "bcryptjs";
import { findByEmail, findById, getPasswordHashByEmail } from "../repositories/userRepository";
import { signToken } from "../utils/auth";
import type { User } from "../models/user";

export interface LoginResult {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const hash = await getPasswordHashByEmail(email);
  if (!hash) {
    throw new Error("Invalid email or password");
  }

  const match = bcrypt.compareSync(password, hash);
  if (!match) {
    throw new Error("Invalid email or password");
  }

  const user = await findByEmail(email);
  if (!user) {
    // should not happen — hash existed, but guard anyway
    throw new Error("Invalid email or password");
  }

  const token = signToken({ sub: user.id, email: user.email });
  return { token, user };
}

export async function getMe(userId: string): Promise<User> {
  const user = await findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}