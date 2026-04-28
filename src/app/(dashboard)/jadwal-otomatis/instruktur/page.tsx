import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { InstrukturTable } from "@/components/jadwal-otomatis/InstrukturTable";
import { listInstructors } from "@/server/actions/jadwal-otomatis/instructors";
import { getSession } from "@/server/actions/auth";

export const metadata: Metadata = {
  title: "Instruktur | Jadwal Otomatis | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const [session, data] = await Promise.all([
    getSession(),
    listInstructors(),
  ]);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const canManage = role === "admin" || role === "staff";

  return (
    <PageWrapper
      title="Master Instruktur"
      description="Kelola data instruktur, keahlian, dan ketidaktersediaan."
      action={
        canManage ? (
          <Link href="/jadwal-otomatis/instruktur/buat">
            <Button>
              <Plus className="h-4 w-4" />
              Tambah Instruktur
            </Button>
          </Link>
        ) : undefined
      }
    >
      <InstrukturTable initialData={data} canManage={canManage} />
    </PageWrapper>
  );
}
