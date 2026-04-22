"use server";

import { headers } from "next/headers";
import { auth, type AuthSession } from "@/server/auth";

export type Role = "admin" | "staff" | "pejabat" | "viewer";

// Guard helper: pastikan user sudah login.
// Throw "Unauthorized" jika tidak ada session.
export async function requireSession(): Promise<AuthSession> {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  if (!session) throw new Error("Unauthorized");
  return session;
}

// Guard helper: pastikan user login DAN memiliki role yang diizinkan.
// Throw "Forbidden" jika role tidak sesuai.
export async function requireRole(allowed: Role[]): Promise<AuthSession> {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role as Role | undefined;
  if (!role || !allowed.includes(role)) {
    throw new Error("Forbidden");
  }
  return session;
}

// Ambil session tanpa throw — dipakai di layout/middleware untuk cek login state.
export async function getSession(): Promise<AuthSession | null> {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  return session ?? null;
}
