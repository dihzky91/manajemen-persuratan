import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { IdentitasSistemCard } from "@/components/pengaturan/IdentitasSistemCard";
import { ProfilAkunCard } from "@/components/pengaturan/ProfilAkunCard";
import { NotifikasiPreferencesCard } from "@/components/pengaturan/NotifikasiPreferencesCard";
import { SistemStatusSection } from "@/components/pengaturan/SistemStatusSection";
import { PengaturanTabs } from "@/components/pengaturan/PengaturanTabs";
import { getSystemSettings, getSessionRole } from "@/server/actions/systemSettings";
import { getMyProfile } from "@/server/actions/profile";
import { getMyNotificationPreferences } from "@/server/actions/notificationPreferences";

export const metadata: Metadata = {
  title: "Pengaturan | Manajemen Surat IAI Jakarta",
};

export default async function PengaturanPage() {
  const [systemSettingsData, role, profile, notifPrefs] = await Promise.all([
    getSystemSettings(),
    getSessionRole(),
    getMyProfile(),
    getMyNotificationPreferences(),
  ]);

  if (!profile) {
    redirect("/login");
  }

  return (
    <PageWrapper
      title="Pengaturan"
      description="Kelola profil pribadi, preferensi notifikasi, identitas sistem, dan status integrasi."
    >
      <PengaturanTabs
        profil={<ProfilAkunCard initial={profile} />}
        notifikasi={<NotifikasiPreferencesCard initial={notifPrefs} />}
        identitas={
          <IdentitasSistemCard
            initial={systemSettingsData}
            isAdmin={role === "admin"}
          />
        }
        sistem={
          <SistemStatusSection
            systemSettings={systemSettingsData}
            isAdmin={role === "admin"}
          />
        }
      />
    </PageWrapper>
  );
}
