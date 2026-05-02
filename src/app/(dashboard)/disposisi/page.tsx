import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { DisposisiInbox } from "@/components/disposisi/DisposisiInbox";
import { inboxDisposisi } from "@/server/actions/disposisi";
import { getSession } from "@/server/actions/auth";

export const metadata: Metadata = {
  title: "Disposisi | ARKA",
};

export default async function Page() {
  const [items, session] = await Promise.all([inboxDisposisi(), getSession()]);
  const role = (session?.user as { role?: string } | undefined)?.role ?? null;
  const canCreateDisposisi = role === "admin" || role === "pejabat";

  return (
    <PageWrapper title="Disposisi" description="Kotak masuk disposisi Anda.">
      <DisposisiInbox items={items} canCreateDisposisi={canCreateDisposisi} />
    </PageWrapper>
  );
}
