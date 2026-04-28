"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, LockKeyhole, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getNavigationItem,
  navigationSections,
  type NavRole,
} from "@/components/layout/navigation";
import type { Capability } from "@/lib/rbac/capabilities";

interface SidebarProps {
  unreadDisposisiCount?: number;
  unreadAnnouncementCount?: number;
  systemIdentity?: { namaSistem: string; logoUrl: string | null };
  userRole?: NavRole | null;
  userCapabilities?: Capability[];
  isSuperAdmin?: boolean;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  pathname?: string;
}

export function Sidebar({
  unreadDisposisiCount = 0,
  unreadAnnouncementCount = 0,
  systemIdentity,
  userRole,
  userCapabilities = [],
  isSuperAdmin = false,
  mobileOpen = false,
  onMobileOpenChange,
  pathname: pathnameProp,
}: SidebarProps) {
  const pathnameFromHook = usePathname();
  const pathname = pathnameProp ?? pathnameFromHook;
  const appName = systemIdentity?.namaSistem ?? process.env.NEXT_PUBLIC_APP_NAME ?? "IAI Jakarta";
  const logoUrl = systemIdentity?.logoUrl ?? "/iai-logo.png";
  const activeItem = getNavigationItem(pathname);
  const capabilitySet = new Set(userCapabilities);

  // Filter section + item berdasarkan role
  const visibleSections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          isSuperAdmin ||
          (item.requiredCapability
            ? capabilitySet.has(item.requiredCapability)
            : !item.allowedRoles ||
              (userRole && item.allowedRoles.includes(userRole))),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <SidebarContent
          pathname={pathname}
          visibleSections={visibleSections}
          appName={appName}
          logoUrl={logoUrl}
          activeItemLabel={activeItem?.label}
          unreadDisposisiCount={unreadDisposisiCount}
          unreadAnnouncementCount={unreadAnnouncementCount}
        />
      </aside>

      <Dialog open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="left-0 top-0 h-dvh w-[min(22rem,100vw-1rem)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-y-0 border-l-0 p-0 sm:max-w-none"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Navigasi utama</DialogTitle>
          <div className="flex h-full min-h-0 flex-col bg-card">
            <div className="flex items-center justify-end border-b border-border px-3 py-3">
              <button
                type="button"
                onClick={() => onMobileOpenChange?.(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Tutup navigasi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              pathname={pathname}
              visibleSections={visibleSections}
              appName={appName}
              logoUrl={logoUrl}
              activeItemLabel={activeItem?.label}
              unreadDisposisiCount={unreadDisposisiCount}
              unreadAnnouncementCount={unreadAnnouncementCount}
              mobile
              onNavigate={() => onMobileOpenChange?.(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SidebarContent({
  pathname,
  visibleSections,
  appName,
  logoUrl,
  activeItemLabel,
  unreadDisposisiCount,
  unreadAnnouncementCount,
  mobile = false,
  onNavigate,
}: {
  pathname: string;
  visibleSections: typeof navigationSections;
  appName: string;
  logoUrl: string;
  activeItemLabel?: string;
  unreadDisposisiCount: number;
  unreadAnnouncementCount: number;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="border-b border-border px-4 py-4 lg:px-5 lg:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-sm">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={appName}
                className="h-full w-full object-contain"
              />
            ) : (
              <Landmark className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{appName}</p>
            <p className="text-xs text-muted-foreground">
              Manajemen surat internal
            </p>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        <div className="space-y-5">
          {visibleSections.map((section) => (
            <section key={section.title} className="min-w-0">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {section.title}
              </p>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                  if (!item.active) {
                    return (
                      <li key={item.href}>
                        <div className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm text-muted-foreground opacity-90">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          <Badge variant="outline" className="rounded-full text-xs">
                            {item.statusLabel ?? "Nonaktif"}
                          </Badge>
                          <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.href === "/disposisi" && unreadDisposisiCount > 0 ? (
                          <Badge
                            variant={isActive ? "secondary" : "outline"}
                            className="rounded-full"
                          >
                            {unreadDisposisiCount}
                          </Badge>
                        ) : null}
                        {item.href === "/pengumuman" && unreadAnnouncementCount > 0 ? (
                          <Badge
                            variant={isActive ? "secondary" : "outline"}
                            className="rounded-full"
                          >
                            {unreadAnnouncementCount}
                          </Badge>
                        ) : null}
                        {isActive ? (
                          <Badge
                            variant="secondary"
                            className="border-0 bg-white/15 text-primary-foreground"
                          >
                            Aktif
                          </Badge>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </nav>

      <div
        className={cn(
          "border-t border-border px-4 py-4 lg:px-5",
          mobile && "pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        <p className="text-xs font-medium text-foreground">
          {activeItemLabel ?? "Aplikasi Internal"}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Akses terbatas untuk pegawai internal IAI Wilayah DKI Jakarta.
        </p>
      </div>
    </>
  );
}
