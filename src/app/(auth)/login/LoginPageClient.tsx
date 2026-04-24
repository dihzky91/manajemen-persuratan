"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Landmark, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginPageClientProps {
  redirectTo: string;
}

export function LoginPageClient({ redirectTo }: LoginPageClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push(redirectTo || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  const appName =
    process.env.NEXT_PUBLIC_APP_NAME || "Manajemen Surat IAI Jakarta";

  return (
    <main className="min-h-screen px-4 py-10 lg:px-6 lg:py-14">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[32px] border border-border bg-card shadow-xl shadow-primary/5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden border-r border-border bg-linear-to-br from-primary/95 via-primary to-sky-700 px-8 py-10 text-primary-foreground lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">{appName}</p>
              <p className="text-sm text-primary-foreground/75">
                IAI Wilayah DKI Jakarta
              </p>
            </div>
          </div>

          <div className="mt-16 max-w-xl">
            <Badge className="bg-white/14 text-primary-foreground hover:bg-white/14">
              Phase 1 Foundation
            </Badge>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Sistem persuratan internal dengan fondasi kerja yang rapi dan
              terkontrol.
            </h1>
            <p className="mt-5 text-base leading-7 text-primary-foreground/80">
              Masuk untuk mengakses dashboard, data divisi, dan modul
              kepegawaian awal. Modul roadmap tetap terlihat agar arah
              pengembangan produk jelas sejak awal.
            </p>
          </div>

          <div className="mt-auto grid gap-4">
            <div className="rounded-3xl border border-white/14 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-sm font-medium">
                <ShieldCheck className="h-4 w-4" />
                Akses Internal
              </div>
              <p className="mt-2 text-sm leading-6 text-primary-foreground/78">
                Seluruh route dilindungi autentikasi dan ditujukan khusus untuk
                pegawai internal.
              </p>
            </div>
            <div className="rounded-3xl border border-white/14 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-sm font-medium">
                <LockKeyhole className="h-4 w-4" />
                Roadmap Bertahap
              </div>
              <p className="mt-2 text-sm leading-6 text-primary-foreground/78">
                Modul di luar scope aktif ditandai jelas per phase agar tidak
                menimbulkan ekspektasi keliru.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {appName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    IAI Wilayah DKI Jakarta
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Badge variant="outline">Masuk Sistem</Badge>
              <h2 className="mt-4 text-3xl font-semibold text-foreground">
                Autentikasi pegawai
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Gunakan email kantor dan kata sandi akun internal Anda untuk
                melanjutkan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Email Kantor
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@iai-jakarta.or.id"
                  autoComplete="email"
                  className="h-11 rounded-xl bg-background"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Kata Sandi
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 rounded-xl bg-background"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl"
              >
                {loading ? "Memproses..." : "Masuk ke Dashboard"}
                {!loading ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </form>

            <div className="mt-8 rounded-2xl border border-border bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
              Akses terbatas hanya untuk pegawai internal IAI Wilayah DKI
              Jakarta.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
