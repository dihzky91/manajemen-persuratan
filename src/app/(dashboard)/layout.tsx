import { redirect } from "next/navigation";
import { getSession } from "@/server/actions/auth";
import { countUnreadAnnouncements } from "@/server/actions/announcements";
import { countUnreadDisposisi } from "@/server/actions/disposisi";
import { getSystemSettings } from "@/server/actions/systemSettings";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AnnouncementToastNotifier } from "@/components/announcements/AnnouncementToastNotifier";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: proxy.ts sudah handle redirect berdasarkan cookie,
  // tapi layout tetap validasi session ke DB untuk memastikan cookie tidak expired/invalid.
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const userRole =
    (session.user as { role?: string } | undefined)?.role ?? null;

  const [unreadDisposisiCount, unreadAnnouncementCount, systemIdentity] = await Promise.all([
    countUnreadDisposisi(),
    countUnreadAnnouncements(),
    getSystemSettings(),
  ]);

  return (
    <DashboardShell
      unreadDisposisiCount={unreadDisposisiCount}
      unreadAnnouncementCount={unreadAnnouncementCount}
      systemIdentity={systemIdentity}
      userRole={userRole as "admin" | "staff" | "pejabat" | "viewer" | null}
      userName={session.user.name}
      userId={session.user.id}
    >
      <AnnouncementToastNotifier unreadCount={unreadAnnouncementCount} />
      {children}
    </DashboardShell>
  );
}
