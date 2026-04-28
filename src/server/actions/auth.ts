"use server";

import { headers } from "next/headers";
import { auth, type AuthSession } from "@/server/auth";

export type Role = "admin" | "staff" | "pejabat" | "viewer";

export type PermissionModule =
  | "announcement"
  | "suratKeluar"
  | "suratMasuk"
  | "disposisi"
  | "pegawai"
  | "divisi"
  | "pejabat"
  | "nomor"
  | "suratKeputusan"
  | "suratMou"
  | "sertifikat"
  | "jadwalUjian"
  | "pengaturan"
  | "auditLog"
  | "notification"
  | "calendar"
  | "search"
  | "profile"
  | "manajemenUser";

export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "manage"
  | "approve"
  | "configure"
  | "generate"
  | "assign"
  | "export";

type PermissionMatrix = Record<
  PermissionModule,
  Partial<Record<PermissionAction, Role[]>>
>;

const PERMISSION_MATRIX: PermissionMatrix = {
  announcement: {
    view: ["admin", "staff", "pejabat", "viewer"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
    manage: ["admin"],
  },
  suratKeluar: {
    view: ["admin", "staff", "pejabat", "viewer"],
    create: ["admin", "staff", "pejabat"],
    update: ["admin", "staff", "pejabat"],
    delete: ["admin"],
    approve: ["admin", "pejabat"],
    generate: ["admin", "pejabat"],
    assign: ["admin", "pejabat"],
    manage: ["admin", "staff", "pejabat"],
  },
  suratMasuk: {
    view: ["admin", "staff", "pejabat", "viewer"],
    create: ["admin", "staff"],
    update: ["admin", "staff", "pejabat"],
    delete: ["admin"],
    manage: ["admin", "staff"],
  },
  disposisi: {
    view: ["admin", "staff", "pejabat", "viewer"],
    create: ["admin", "pejabat"],
    update: ["admin", "staff", "pejabat"],
    manage: ["admin", "staff", "pejabat"],
  },
  pegawai: {
    view: ["admin", "staff", "pejabat", "viewer"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
    manage: ["admin"],
  },
  divisi: {
    view: ["admin", "staff", "pejabat", "viewer"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
    manage: ["admin"],
  },
  pejabat: {
    view: ["admin", "staff", "pejabat", "viewer"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
    manage: ["admin"],
  },
  nomor: {
    view: ["admin", "staff", "pejabat", "viewer"],
    generate: ["admin", "pejabat"],
    update: ["admin"],
    manage: ["admin", "pejabat"],
  },
  suratKeputusan: {
    view: ["admin", "staff", "pejabat", "viewer"],
    create: ["admin", "pejabat"],
    update: ["admin", "pejabat"],
    delete: ["admin"],
    generate: ["admin", "pejabat"],
    manage: ["admin", "pejabat"],
  },
  suratMou: {
    view: ["admin", "staff", "pejabat", "viewer"],
    create: ["admin", "pejabat"],
    update: ["admin", "pejabat"],
    delete: ["admin"],
    generate: ["admin", "pejabat"],
    manage: ["admin", "pejabat"],
  },
  sertifikat: {
    view: ["admin", "staff", "viewer"],
    create: ["admin", "staff"],
    update: ["admin", "staff"],
    delete: ["admin"],
    generate: ["admin", "staff"],
    export: ["admin", "staff"],
    configure: ["admin"],
    manage: ["admin", "staff"],
  },
  jadwalUjian: {
    view: ["admin", "staff", "viewer"],
    create: ["admin", "staff"],
    update: ["admin", "staff"],
    delete: ["admin"],
    configure: ["admin"],
    export: ["admin", "staff"],
    manage: ["admin", "staff"],
  },
  pengaturan: {
    view: ["admin"],
    update: ["admin"],
    configure: ["admin"],
    manage: ["admin"],
  },
  auditLog: {
    view: ["admin"],
    export: ["admin", "staff"],
    manage: ["admin", "staff"],
  },
  notification: {
    view: ["admin", "staff", "pejabat", "viewer"],
    update: ["admin", "staff", "pejabat", "viewer"],
    manage: ["admin", "staff", "pejabat", "viewer"],
  },
  calendar: {
    view: ["admin", "staff", "pejabat", "viewer"],
    manage: ["admin", "staff", "pejabat", "viewer"],
  },
  search: {
    view: ["admin", "staff", "pejabat", "viewer"],
    manage: ["admin", "staff", "pejabat", "viewer"],
  },
  profile: {
    view: ["admin", "staff", "pejabat", "viewer"],
    update: ["admin", "staff", "pejabat", "viewer"],
    manage: ["admin", "staff", "pejabat", "viewer"],
  },
  manajemenUser: {
    view: ["admin"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
    manage: ["admin"],
  },
};

function getSessionRoleValue(session: AuthSession): Role | null {
  const role = (session.user as { role?: string }).role as Role | undefined;
  return role ?? null;
}

function hasPermission(
  role: Role | null | undefined,
  module: PermissionModule,
  action: PermissionAction,
): boolean {
  if (!role) return false;
  if (role === "admin") return true;

  const actions = PERMISSION_MATRIX[module];
  if (!actions) return false;

  const allowed = actions[action];
  return Array.isArray(allowed) ? allowed.includes(role) : false;
}

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
  const role = getSessionRoleValue(session);
  if (!role || !allowed.includes(role)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requirePermission(
  module: PermissionModule,
  action: PermissionAction,
  _scope?: string,
): Promise<AuthSession> {
  const session = await requireSession();
  const role = getSessionRoleValue(session);

  if (!hasPermission(role, module, action)) {
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
