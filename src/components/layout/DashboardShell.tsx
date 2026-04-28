"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import type { NavRole } from "@/components/layout/navigation";
import type { Capability } from "@/lib/rbac/capabilities";

interface DashboardShellProps {
  children: React.ReactNode;
  unreadDisposisiCount: number;
  unreadAnnouncementCount: number;
  systemIdentity: { namaSistem: string; logoUrl: string | null };
  userRole: NavRole | null;
  userCapabilities: Capability[];
  isSuperAdmin: boolean;
  userName?: string | null;
  userId?: string;
  pathname?: string;
}

export function DashboardShell({
  children,
  unreadDisposisiCount,
  unreadAnnouncementCount,
  systemIdentity,
  userRole,
  userCapabilities,
  isSuperAdmin,
  userName,
  userId,
  pathname,
}: DashboardShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <Sidebar
        unreadDisposisiCount={unreadDisposisiCount}
        unreadAnnouncementCount={unreadAnnouncementCount}
        systemIdentity={systemIdentity}
        userRole={userRole}
        userCapabilities={userCapabilities}
        isSuperAdmin={isSuperAdmin}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        pathname={pathname}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header
          userName={userName}
          userId={userId}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 bg-linear-to-b from-background via-muted/30 to-background px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
