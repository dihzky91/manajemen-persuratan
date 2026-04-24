import { LoginPageClient } from "./LoginPageClient";

type LoginPageProps = {
  searchParams?: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectTo =
    resolvedSearchParams?.redirect &&
    resolvedSearchParams.redirect.startsWith("/")
      ? resolvedSearchParams.redirect
      : "/dashboard";

  return <LoginPageClient redirectTo={redirectTo} />;
}
