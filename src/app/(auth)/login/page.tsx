import { getSystemSettings } from "@/server/actions/systemSettings";
import { LoginPageClient } from "./LoginPageClient";

type LoginPageProps = {
  searchParams?: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [resolvedSearchParams, settings] = await Promise.all([
    searchParams,
    getSystemSettings(),
  ]);
  const candidate = resolvedSearchParams?.redirect;
  // Hanya izinkan path internal absolut. Tolak protocol-relative URL ("//evil.com")
  // dan trik backslash ("/\\evil.com") yang bisa dipakai untuk open redirect.
  const redirectTo =
    candidate &&
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.startsWith("/\\")
      ? candidate
      : "/dashboard";

  return (
    <LoginPageClient
      redirectTo={redirectTo}
      systemIdentity={{
        namaSistem: settings.namaSistem,
        logoUrl: settings.logoUrl,
      }}
    />
  );
}
