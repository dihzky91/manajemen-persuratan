"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getNavigationItem,
  navigationSections,
  type NavRole,
} from "@/components/layout/navigation";

interface SidebarProps {
  unreadDisposisiCount?: number;
  systemIdentity?: { namaSistem: string; logoUrl: string | null };
  userRole?: NavRole | null;
}

export function Sidebar({ unreadDisposisiCount = 0, systemIdentity, userRole }: SidebarProps) {
  const pathname = usePathname();
  const appName = systemIdentity?.namaSistem ?? process.env.NEXT_PUBLIC_APP_NAME ?? "IAI Jakarta";
  const activeItem = getNavigationItem(pathname);

  // Filter section + item berdasarkan role
  const visibleSections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !item.allowedRoles ||
          (userRole && item.allowedRoles.includes(userRole)),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="w-full border-b border-border bg-card lg:min-h-screen lg:w-80 lg:border-r lg:border-b-0">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-sm">
            {systemIdentity?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={systemIdentity.logoUrl}
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

      <nav className="overflow-x-auto px-3 py-4 lg:flex-1 lg:overflow-y-auto lg:overflow-x-hidden">
        <div className="flex gap-4 lg:block lg:space-y-6">
          {visibleSections.map((section) => (
            <section key={section.title} className="min-w-64 lg:min-w-0">
              <p className="px-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {section.title}
              </p>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                  if (!item.active) {
                    return (
                      <li key={item.href}>
                        <div className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm text-muted-foreground opacity-90">
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1">{item.label}</span>
                          <Badge variant="outline" className="rounded-full text-xs">
                            {item.statusLabel ?? "Nonaktif"}
                          </Badge>
                          <LockKeyhole className="h-3.5 w-3.5" />
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {item.href === "/disposisi" && unreadDisposisiCount > 0 ? (
                          <Badge variant="secondary" className="rounded-full">
                            {unreadDisposisiCount}
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

      <div className="border-t border-border px-5 py-4">
        <p className="text-xs font-medium text-foreground">
          {activeItem?.label ?? "Aplikasi Internal"}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Akses terbatas untuk pegawai internal IAI Wilayah DKI Jakarta.
        </p>
      </div>
    </aside>
  );
}
