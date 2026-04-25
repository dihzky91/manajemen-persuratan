"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTanggalLengkapJakarta } from "@/lib/utils";
import { getNavigationItem } from "@/components/layout/navigation";

export function Header({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const currentItem = getNavigationItem(pathname);
  const todayLabel = useMemo(
    () => formatTanggalLengkapJakarta(new Date()),
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {currentItem?.label ?? "Workspace"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-sm font-medium text-foreground">{userName || "Pengguna"}</p>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </div>
    </header>
  );
}
