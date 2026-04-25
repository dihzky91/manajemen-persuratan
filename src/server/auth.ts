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
import {
  buildInviteEmail,
  buildResetPasswordEmail,
  sendEmail,
} from "@/lib/email/mailjet";

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

  generateId: () => crypto.randomUUID(),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    disableSignUp: true,
    minPasswordLength: 8,
    // Better Auth memanggil callback ini setelah requestPasswordReset.
    // Dipakai untuk dua skenario:
    //  - Undangan aktivasi akun pegawai baru (createPegawai)
    //  - Reset kata sandi user existing (lupa password)
    sendResetPassword: async ({ user, url }) => {
      // Better Auth meneruskan querystring callbackURL via param `url`.
      // Kita arahkan link ke halaman /reset-password agar UX konsisten.
      const isInvite = url.includes("invite=1");
      const template = isInvite
        ? buildInviteEmail({
            namaLengkap: user.name ?? user.email,
            resetUrl: url,
          })
        : buildResetPasswordEmail({
            namaLengkap: user.name ?? user.email,
            resetUrl: url,
          });

      await sendEmail({
        to: user.email,
        toName: user.name ?? undefined,
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
      });
    },
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
