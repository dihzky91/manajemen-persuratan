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

export interface PhaseMeta {
  badge: string;
  title: string;
  description: string;
}

type PhaseKey = "Phase 1" | "Phase 2" | "Phase 3" | "Phase 4" | "Phase 5";

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
        phase: "Phase 1",
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
        phase: "Phase 1",
      },
      {
        href: "/divisi",
        label: "Divisi",
        icon: Building2,
        active: true,
        phase: "Phase 1",
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
    ],
  },
  {
    title: "Roadmap",
    items: [
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

const phaseMetaMap: Record<PhaseKey, PhaseMeta> = {
  "Phase 1": {
    badge: "Phase 1",
    title: "Foundation",
    description:
      "Fokus saat ini: shell aplikasi, dashboard, login, Divisi, dan Pegawai.",
  },
  "Phase 2": {
    badge: "Phase 2",
    title: "Core Surat Keluar",
    description:
      "Fokus saat ini: surat keluar, workflow 5 tahap, dan penomoran surat otomatis.",
  },
  "Phase 3": {
    badge: "Phase 3",
    title: "Surat Masuk dan Disposisi",
    description:
      "Menunggu aktivasi modul surat masuk, disposisi, inbox, dan notifikasi terkait.",
  },
  "Phase 4": {
    badge: "Phase 4",
    title: "QR dan Fitur Lanjutan",
    description:
      "Menunggu aktivasi QR, file lanjutan, SK, MOU, nomor surat, dan pejabat.",
  },
  "Phase 5": {
    badge: "Phase 5",
    title: "Polish dan Deploy",
    description:
      "Menunggu tahap akhir untuk RBAC menyeluruh, audit log, deploy, dan uji E2E.",
  },
};

export function getPhaseMeta(pathname: string): PhaseMeta {
  const item = getNavigationItem(pathname);
  const phase = (item?.phase as PhaseKey | undefined) ?? "Phase 1";
  return phaseMetaMap[phase];
}
