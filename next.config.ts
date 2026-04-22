import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer perlu dijalankan di server saja (tidak di-bundle client)
  serverExternalPackages: ["@react-pdf/renderer", "qrcode"],

  // Aktifkan strict mode React
  reactStrictMode: true,
};

export default nextConfig;
