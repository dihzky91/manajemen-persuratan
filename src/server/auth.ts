import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "./db";
import {
  users,
  session as sessionTable,
  account as accountTable,
  verification as verificationTable,
} from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
    usePlural: false,
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  // Paksa Better Auth pakai UUID — schema kita pakai kolom uuid bukan text
  generateId: "uuid",

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 hari
    updateAge: 60 * 60 * 24,     // refresh sekali sehari
  },

  user: {
    // Mapping nama kolom Better Auth → nama kolom di schema Drizzle
    // "name" (Better Auth) → "namaLengkap" (kolom kita)
    fields: {
      name: "namaLengkap",
    },
    // Field tambahan di luar standar Better Auth yang ingin bisa diakses dari session
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "staff",
        input: false, // tidak bisa diisi user sendiri saat register
      },
      divisiId: {
        type: "number",
        required: false,
        input: false,
      },
      jabatan: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  plugins: [
    nextCookies(), // Next.js cookie integration
  ],
});

// Type helper — gunakan ini di server actions untuk type session
export type AuthSession = typeof auth.$Infer.Session;

// Type untuk user dari session (includes additionalFields)
export type SessionUser = AuthSession["user"];
