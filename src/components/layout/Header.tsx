"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNavigationItem } from "@/components/layout/navigation";

export function Header({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const currentItem = getNavigationItem(pathname);
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  async function handleLogout() {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    // Hard redirect — pastikan semua cache server component ter-clear
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-border bg-card/95 px-4 py-4 backdrop-blur lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">Phase 1</Badge>
            <p className="text-xs text-muted-foreground">{todayLabel}</p>
          </div>
          <h1 className="mt-2 text-lg font-semibold text-foreground">
            {currentItem?.label ?? "Workspace"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk sebagai {userName || "Pengguna"}.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-2 text-right">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Sesi Aktif
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {userName || "Pengguna"}
            </p>
          </div>

          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </div>
    </header>
  );
}
