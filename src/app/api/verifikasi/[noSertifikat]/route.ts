import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyByNoSertifikat } from "@/server/actions/sertifikat/verifikasi";

const WINDOW_MS = 60_000;
const LIMIT = 30;
const buckets = new Map<string, { count: number; resetAt: number }>();

type RouteContext = {
  params: Promise<{ noSertifikat: string }>;
};

function getClientIp(headersList: Headers) {
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headersList.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const existing = buckets.get(ip);

  if (!existing || existing.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (existing.count >= LIMIT) return true;
  existing.count += 1;
  return false;
}

export async function GET(_request: Request, context: RouteContext) {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak request. Coba lagi dalam beberapa saat." },
      { status: 429 },
    );
  }

  const { noSertifikat } = await context.params;
  const result = await verifyByNoSertifikat(noSertifikat);
  return NextResponse.json(result);
}
