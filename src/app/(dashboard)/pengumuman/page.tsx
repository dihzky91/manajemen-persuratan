import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AnnouncementManager } from "@/components/announcements/AnnouncementManager";
import { getSession } from "@/server/actions/auth";
import {
  getAnnouncementAudienceOptions,
  listAnnouncementInbox,
  listAnnouncementManage,
} from "@/server/actions/announcements";

export const metadata: Metadata = {
  title: "Pengumuman | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? null;
  const canManage = role === "admin";

  const [inboxRows, manageRows, divisiOptions] = await Promise.all([
    listAnnouncementInbox(),
    canManage ? listAnnouncementManage() : Promise.resolve([]),
    getAnnouncementAudienceOptions(),
  ]);

  return (
    <PageWrapper
      title="Pengumuman"
      description="Pusat komunikasi informasi internal untuk seluruh tim."
    >
      <AnnouncementManager
        canManage={canManage}
        initialInbox={inboxRows}
        initialManage={manageRows}
        divisiOptions={divisiOptions}
      />
    </PageWrapper>
  );
}
