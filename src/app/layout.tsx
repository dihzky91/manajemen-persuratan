import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { getSystemSettings } from "@/server/actions/systemSettings";
import "@/styles/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();
  return {
    title: settings.namaSistem,
    description: "Sistem Manajemen Surat & Kepegawaian IAI Wilayah DKI Jakarta",
    ...(settings.faviconUrl && {
      icons: { icon: settings.faviconUrl },
    }),
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
