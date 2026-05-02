import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { FormBuatKelasOtomatis } from "@/components/jadwal-otomatis/FormBuatKelasOtomatis";
import { listPrograms } from "@/server/actions/jadwal-otomatis/programs";
import { listClassTypes } from "@/server/actions/jadwal-otomatis/classTypes";

export const metadata: Metadata = {
  title: "Buat Kelas Baru | Jadwal Otomatis | ARKA",
};

export default async function Page() {
  const [programs, classTypeList] = await Promise.all([
    listPrograms(),
    listClassTypes(),
  ]);

  return (
    <PageWrapper
      title="Buat Kelas Baru"
      description="Buat kelas pelatihan baru dan generate jadwal otomatis."
    >
      <FormBuatKelasOtomatis programs={programs} classTypes={classTypeList} />
    </PageWrapper>
  );
}
