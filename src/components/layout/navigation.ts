import {
  Building2,
  FileSignature,
  FileText,
  Hash,
  Inbox,
  LayoutDashboard,
  Mail,
  Send,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  phase?: string;
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
    title: "Phase 1",
    items: [
      {
        href: "/pegawai",
        label: "Pegawai",
        icon: Users,
        active: true,
      },
      {
        href: "/divisi",
        label: "Divisi",
        icon: Building2,
        active: true,
      },
    ],
  },
  {
    title: "Roadmap",
    items: [
      {
        href: "/surat-keluar",
        label: "Surat Keluar",
        icon: Send,
        active: false,
        phase: "Phase 2",
      },
      {
        href: "/surat-masuk",
        label: "Surat Masuk",
        icon: Inbox,
        active: false,
        phase: "Phase 3",
      },
      {
        href: "/disposisi",
        label: "Disposisi",
        icon: Mail,
        active: false,
        phase: "Phase 3",
      },
      {
        href: "/surat-keputusan",
        label: "Surat Keputusan",
        icon: FileText,
        active: false,
        phase: "Phase 4",
      },
      {
        href: "/surat-mou",
        label: "Surat MOU",
        icon: FileSignature,
        active: false,
        phase: "Phase 4",
      },
      {
        href: "/nomor-surat",
        label: "Nomor Surat",
        icon: Hash,
        active: false,
        phase: "Phase 4",
      },
      {
        href: "/pejabat",
        label: "Pejabat",
        icon: UserCog,
        active: false,
        phase: "Phase 4",
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
