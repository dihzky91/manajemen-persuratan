import { redirect } from "next/navigation";
import { getSession } from "@/server/actions/auth";
import { countUnreadDisposisi } from "@/server/actions/disposisi";
import { getSystemSettings } from "@/server/actions/systemSettings";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

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

  const [unreadDisposisiCount, systemIdentity] = await Promise.all([
    countUnreadDisposisi(),
    getSystemSettings(),
  ]);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <Sidebar unreadDisposisiCount={unreadDisposisiCount} systemIdentity={systemIdentity} userRole={userRole as "admin" | "staff" | "pejabat" | "viewer" | null} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header userName={session.user.name} />
        <main className="flex-1 bg-linear-to-b from-background via-muted/30 to-background px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
