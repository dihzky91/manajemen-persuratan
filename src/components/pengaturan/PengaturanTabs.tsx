"use client";

import { Building2, Bell, ServerCog, UserCircle2 } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface PengaturanTabsProps {
  identitas: React.ReactNode;
  profil: React.ReactNode;
  notifikasi: React.ReactNode;
  sistem: React.ReactNode;
}

export function PengaturanTabs({
  identitas,
  profil,
  notifikasi,
  sistem,
}: PengaturanTabsProps) {
  return (
    <Tabs defaultValue="profil" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
        <TabsTrigger value="profil" className="gap-2">
          <UserCircle2 className="h-4 w-4" />
          <span>Profil & Akun</span>
        </TabsTrigger>
        <TabsTrigger value="notifikasi" className="gap-2">
          <Bell className="h-4 w-4" />
          <span>Notifikasi</span>
        </TabsTrigger>
        <TabsTrigger value="identitas" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span>Identitas Sistem</span>
        </TabsTrigger>
        <TabsTrigger value="sistem" className="gap-2">
          <ServerCog className="h-4 w-4" />
          <span>Sistem & Integrasi</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profil" className="mt-6">
        {profil}
      </TabsContent>
      <TabsContent value="notifikasi" className="mt-6">
        {notifikasi}
      </TabsContent>
      <TabsContent value="identitas" className="mt-6">
        {identitas}
      </TabsContent>
      <TabsContent value="sistem" className="mt-6">
        {sistem}
      </TabsContent>
    </Tabs>
  );
}
