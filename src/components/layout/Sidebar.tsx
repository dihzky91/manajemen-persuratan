"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getNavigationItem,
  getPhaseMeta,
  navigationSections,
} from "@/components/layout/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "IAI Jakarta";
  const activeItem = getNavigationItem(pathname);
  const phaseMeta = getPhaseMeta(pathname);

  return (
    <aside className="w-full border-b border-border bg-card lg:min-h-screen lg:w-80 lg:border-r lg:border-b-0">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{appName}</p>
            <p className="text-xs text-muted-foreground">
              Manajemen surat internal
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Phase Aktif
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{phaseMeta.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {phaseMeta.description}
          </p>
        </div>
      </div>

      <nav className="overflow-x-auto px-3 py-4 lg:flex-1 lg:overflow-y-auto lg:overflow-x-hidden">
        <div className="flex gap-4 lg:block lg:space-y-6">
          {navigationSections.map((section) => (
            <section key={section.title} className="min-w-64 lg:min-w-0">
              <p className="px-3 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
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
                          <Badge variant="outline" className="rounded-full text-[10px]">
                            {item.phase}
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
