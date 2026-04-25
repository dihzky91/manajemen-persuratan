import {
  Building2,
  FileSignature,
  FileText,
  Hash,
  Inbox,
  LayoutDashboard,
  Mail,
  Send,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavRole = "admin" | "staff" | "pejabat" | "viewer";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  statusLabel?: string;
  /** Jika diset, hanya role yang terdaftar di sini yang akan melihat item ini. */
  allowedRoles?: NavRole[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    title: "Utama",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        active: true,
      },
    ],
  },
  {
    title: "Kepegawaian",
    items: [
      {
        href: "/pegawai",
        label: "Pegawai",
        icon: Users,
        active: true,
        allowedRoles: ["admin"],
      },
      {
        href: "/divisi",
        label: "Divisi",
        icon: Building2,
        active: true,
        allowedRoles: ["admin"],
      },
    ],
  },
  {
    title: "Persuratan",
    items: [
      {
        href: "/surat-keluar",
        label: "Surat Keluar",
        icon: Send,
        active: true,
        // semua role yang login bisa lihat arsip
      },
      {
        href: "/surat-masuk",
        label: "Surat Masuk",
        icon: Inbox,
        active: true,
      },
      {
        href: "/disposisi",
        label: "Disposisi",
        icon: Mail,
        active: true,
      },
    ],
  },
  {
    title: "Administrasi",
    items: [
      {
        href: "/surat-keputusan",
        label: "Surat Keputusan",
        icon: FileText,
        active: true,
        allowedRoles: ["admin", "pejabat"],
      },
      {
        href: "/surat-mou",
        label: "Surat MOU",
        icon: FileSignature,
        active: true,
        allowedRoles: ["admin", "pejabat"],
      },
      {
        href: "/nomor-surat",
        label: "Nomor Surat",
        icon: Hash,
        active: true,
        allowedRoles: ["admin", "pejabat"],
      },
      {
        href: "/pejabat",
        label: "Pejabat",
        icon: UserCog,
        active: true,
        allowedRoles: ["admin"],
      },
      {
        href: "/pengaturan",
        label: "Pengaturan",
        icon: Settings,
        active: true,
        allowedRoles: ["admin"],
      },
      {
        href: "/audit-log",
        label: "Audit Log",
        icon: ShieldCheck,
        active: true,
        allowedRoles: ["admin"],
      },
    ],
  },
];

export const navigationItems = navigationSections.flatMap((section) => section.items);

export function getNavigationItem(pathname: string) {
  return navigationItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
