import { redirect } from "next/navigation";
import { getSession } from "@/server/actions/auth";
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

  return (
    <div className="min-h-screen flex bg-muted">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header userName={session.user.name} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
