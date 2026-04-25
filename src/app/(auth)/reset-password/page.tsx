import { getSystemSettings } from "@/server/actions/systemSettings";
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

  return (
    <ResetPasswordClient
      token={token}
      isInvite={isInvite}
      linkError={linkError}
      systemIdentity={{
        namaSistem: settings.namaSistem,
        logoUrl: settings.logoUrl,
      }}
    />
  );
}
