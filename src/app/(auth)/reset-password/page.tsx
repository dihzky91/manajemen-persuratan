import { eq } from "drizzle-orm";
import { getSystemSettings } from "@/server/actions/systemSettings";
import { db } from "@/server/db";
import { verification } from "@/server/db/schema";
import { ResetPasswordClient } from "./ResetPasswordClient";

type ResetPasswordPageProps = {
  searchParams?: Promise<{ token?: string; invite?: string; error?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const [resolvedSearchParams, settings] = await Promise.all([
    searchParams,
    getSystemSettings(),
  ]);

  const token = resolvedSearchParams?.token ?? "";
  const isInvite = resolvedSearchParams?.invite === "1";
  const linkError = resolvedSearchParams?.error ?? null;

  // Untuk invite: ambil email dari verification token agar client bisa
  // memanggil activateInvitedAccount setelah user berhasil set password.
  let inviteEmail: string | null = null;
  if (isInvite && token) {
    const [row] = await db
      .select({ identifier: verification.identifier })
      .from(verification)
      .where(eq(verification.value, token))
      .limit(1);
    inviteEmail = row?.identifier ?? null;
  }

  return (
    <ResetPasswordClient
      token={token}
      isInvite={isInvite}
      linkError={linkError}
      inviteEmail={inviteEmail}
      systemIdentity={{
        namaSistem: settings.namaSistem,
        logoUrl: settings.logoUrl,
      }}
    />
  );
}
