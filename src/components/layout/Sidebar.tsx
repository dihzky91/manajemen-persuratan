"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Send,
  FileText,
  FileSignature,
  Inbox,
  Hash,
  Users,
  Building2,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/surat-masuk", label: "Surat Masuk", icon: Inbox },
  { href: "/surat-keluar", label: "Surat Keluar", icon: Send },
  { href: "/disposisi", label: "Disposisi", icon: Mail },
  { href: "/surat-keputusan", label: "Surat Keputusan", icon: FileText },
  { href: "/surat-mou", label: "Surat MOU", icon: FileSignature },
  { href: "/nomor-surat", label: "Nomor Surat", icon: Hash },
  { href: "/pegawai", label: "Pegawai", icon: Users },
  { href: "/divisi", label: "Divisi", icon: Building2 },
  { href: "/pejabat", label: "Pejabat", icon: UserCog },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "IAI Jakarta";

  return (
    <aside className="w-64 bg-card border-r flex flex-col">
      <div className="h-16 flex items-center px-5 border-b">
        <span className="font-semibold text-foreground truncate">{appName}</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-2">
          {menu.map((m) => {
            const isActive = pathname === m.href || pathname.startsWith(m.href + "/");
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors",
                    isActive && "bg-muted font-medium text-primary",
                  )}
                >
                  <m.icon className="h-4 w-4" />
                  <span>{m.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t text-xs text-muted-foreground">
        Internal only — IAI Wilayah DKI Jakarta
      </div>
    </aside>
  );
}
