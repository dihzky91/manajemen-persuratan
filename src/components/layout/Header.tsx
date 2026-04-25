"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTanggalLengkapJakarta } from "@/lib/utils";
import { getNavigationItem } from "@/components/layout/navigation";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface HeaderProps {
  userName?: string | null;
  userId?: string;
}

export function Header({ userName, userId }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
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
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </Button>
          {userId && <NotificationBell userId={userId} />}
          <div className="h-6 w-px bg-border mx-1" />
          <p className="text-sm font-medium text-foreground hidden sm:block">{userName || "Pengguna"}</p>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
