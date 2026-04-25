"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const REMEMBER_KEY = "iaij.login.rememberedEmail";

interface LoginPageClientProps {
  redirectTo: string;
  systemIdentity: {
    namaSistem: string;
    logoUrl: string | null;
  };
}

export function LoginPageClient({
  redirectTo,
  systemIdentity,
}: LoginPageClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {
      // localStorage tidak tersedia (mode privat) — abaikan.
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string })?.message ??
            "Gagal masuk. Periksa email & kata sandi.",
        );
      }
      try {
        if (remember) {
          window.localStorage.setItem(REMEMBER_KEY, email);
        } else {
          window.localStorage.removeItem(REMEMBER_KEY);
        }
      } catch {
        // abaikan kegagalan localStorage
      }
      router.push(redirectTo || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  const appName =
    systemIdentity.namaSistem ||
    process.env.NEXT_PUBLIC_APP_NAME ||
    "Manajemen Surat IAI Jakarta";
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "v1.0.0";
  const year = new Date().getFullYear();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Pattern dot halus */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,_hsl(221_83%_53%_/_0.08)_1px,_transparent_0)] bg-[length:22px_22px]"
      />
      {/* Glow lembut di atas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,_hsl(221_83%_53%_/_0.18),_transparent_70%)]"
      />

      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          {systemIdentity.logoUrl ? (
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-md shadow-primary/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={systemIdentity.logoUrl}
                alt={appName}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-sky-600 text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/20">
              <Building2 className="h-7 w-7" strokeWidth={2.2} />
              <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-success text-success-foreground ring-2 ring-background">
                <ShieldCheck className="h-3 w-3" />
              </span>
            </div>
          )}
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            {appName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            IAI Wilayah DKI Jakarta
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-7 shadow-xl shadow-primary/5 sm:p-8">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Masuk ke akun Anda
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gunakan email kantor untuk mengakses dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@iai-jakarta.or.id"
                  autoComplete="email"
                  aria-invalid={!!error || undefined}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata Sandi</Label>
                <a
                  href="mailto:admin@iai-jakarta.or.id?subject=Permohonan%20Reset%20Kata%20Sandi"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Lupa kata sandi?
                </a>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-invalid={!!error || undefined}
                  className="h-11 pr-10 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center pt-1">
              <Label
                htmlFor="remember"
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                Ingat email saya
              </Label>
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            Belum punya akses?{" "}
            <a
              href="mailto:admin@iai-jakarta.or.id?subject=Permohonan%20Akses%20Sistem"
              className="font-medium text-foreground hover:text-primary hover:underline"
            >
              Hubungi admin sistem
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {year} IAI Wilayah DKI Jakarta</span>
          <span className="font-mono">{appVersion}</span>
        </div>
      </div>
    </main>
  );
}
