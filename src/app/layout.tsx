import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? "Manajemen Surat IAI Jakarta",
  description: "Sistem Manajemen Surat & Kepegawaian IAI Wilayah DKI Jakarta",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
