import {
  Award,
  BadgeCheck,
  BarChart2,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  FileSignature,
  FileImage,
  FileText,
  Hash,
  Inbox,
  LayoutDashboard,
  Mail,
  ScrollText,
  Send,
  Settings,
  Trash2,
  ShieldCheck,
  UserCheck,
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
      {
        href: "/kalender",
        label: "Kalender",
        icon: CalendarDays,
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
    title: "Sertifikat & Kegiatan",
    items: [
      {
        href: "/sertifikat/kegiatan",
        label: "Kegiatan",
        icon: Award,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/sertifikat/nomor",
        label: "Penomoran Sertifikat",
        icon: Hash,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/sertifikat/nomor/rekap",
        label: "Rekap Tahunan",
        icon: BarChart2,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/sertifikat/peserta",
        label: "Cari Peserta",
        icon: Users,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/sertifikat/penandatangan",
        label: "Penandatangan",
        icon: BadgeCheck,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/sertifikat/template",
        label: "Template Sertifikat",
        icon: FileImage,
        active: true,
        allowedRoles: ["admin"],
      },
      {
        href: "/sertifikat/analytics",
        label: "Analytics",
        icon: BarChart3,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/sertifikat/audit-log",
        label: "Audit Log",
        icon: ScrollText,
        active: true,
        allowedRoles: ["staff"],
      },
      {
        href: "/sertifikat/sampah",
        label: "Sampah",
        icon: Trash2,
        active: true,
        allowedRoles: ["admin"],
      },
    ],
  },
  {
    title: "Jadwal Ujian",
    items: [
      {
        href: "/jadwal-ujian",
        label: "Jadwal Ujian",
        icon: ClipboardList,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/jadwal-ujian/admin-jaga",
        label: "Admin Jaga",
        icon: ShieldCheck,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/jadwal-ujian/penugasan",
        label: "Jadwal Pengawas",
        icon: UserCheck,
        active: true,
      },
      {
        href: "/jadwal-ujian/beban-kerja",
        label: "Beban Kerja",
        icon: BarChart2,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/jadwal-ujian/pengawas",
        label: "Pengawas",
        icon: Users,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/jadwal-ujian/kelas",
        label: "Kelas",
        icon: BookOpen,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/jadwal-ujian/materi",
        label: "Materi Ujian",
        icon: ClipboardList,
        active: true,
        allowedRoles: ["admin", "staff"],
      },
      {
        href: "/jadwal-ujian/pengaturan",
        label: "Pengaturan",
        icon: Settings,
        active: true,
        allowedRoles: ["admin"],
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
