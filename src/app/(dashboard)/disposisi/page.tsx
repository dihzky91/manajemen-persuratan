import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { DisposisiInbox } from "@/components/disposisi/DisposisiInbox";
import { inboxDisposisi } from "@/server/actions/disposisi";

export const metadata: Metadata = {
  title: "Disposisi | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const items = await inboxDisposisi();

  return (
    <PageWrapper title="Disposisi" description="Kotak masuk disposisi Anda.">
      <DisposisiInbox items={items} />
    </PageWrapper>
  );
}
