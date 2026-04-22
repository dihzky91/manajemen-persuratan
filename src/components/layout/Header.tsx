"use client";

import { LogOut } from "lucide-react";

export function Header({ userName }: { userName?: string | null }) {

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
    <header className="h-16 bg-card border-b flex items-center justify-between px-6">
      <div>
        <p className="text-xs text-muted-foreground">Selamat datang</p>
        <p className="text-sm font-medium text-foreground">
          {userName || "Pengguna"}
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-foreground hover:text-destructive transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Keluar
      </button>
    </header>
  );
}
