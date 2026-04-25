import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { getSession } from "@/server/actions/auth";

export const runtime = "nodejs";

// Mime type ringan tanpa dependency tambahan.
const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain; charset=utf-8",
};

function resolveBaseDir() {
  // Turbopack NFT tidak bisa statically analyze path.resolve dengan env dinamis;
  // tandai ignore agar trace tidak ikut menyertakan seluruh project.
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    env.STORAGE_LOCAL_DIR,
  );
}

// Pastikan target tetap berada di dalam baseDir (anti path traversal).
function resolveSafePath(segments: string[]): string | null {
  if (!segments.length) return null;

  // Tolak segment kosong atau yang berisi traversal eksplisit.
  for (const segment of segments) {
    if (!segment) return null;
    if (segment === "." || segment === "..") return null;
    if (segment.includes("\0")) return null;
  }

  const baseDir = resolveBaseDir();
  const decoded = segments.map((segment) => decodeURIComponent(segment));
  const candidate = path.resolve(baseDir, ...decoded);
  const baseWithSep = baseDir.endsWith(path.sep) ? baseDir : baseDir + path.sep;
  if (candidate !== baseDir && !candidate.startsWith(baseWithSep)) {
    return null;
  }
  return candidate;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { path: segments } = await context.params;
  const safePath = resolveSafePath(segments);
  if (!safePath) {
    return NextResponse.json(
      { error: "Bad request" },
      { status: 400 },
    );
  }

  let stats;
  try {
    stats = await stat(safePath);
  } catch {
    return NextResponse.json(
      { error: "File tidak ditemukan." },
      { status: 404 },
    );
  }

  if (!stats.isFile()) {
    return NextResponse.json(
      { error: "Bukan berkas yang valid." },
      { status: 404 },
    );
  }

  const ext = path.extname(safePath).toLowerCase();
  const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
  const fileName = path.basename(safePath);

  // Gunakan stream agar tidak load file besar ke memori.
  const nodeStream = createReadStream(safePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  // Inline untuk mime yang aman dipreview di browser, attachment untuk lainnya.
  const safePreview =
    contentType.startsWith("image/") || contentType === "application/pdf";
  const dispositionType = safePreview ? "inline" : "attachment";

  // Cegah caching publik — file sensitif.
  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Length": String(stats.size),
    "Content-Disposition": `${dispositionType}; filename="${encodeURIComponent(fileName)}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });

  // Hint ke ESLint bahwa request memang sengaja tidak dipakai (tanda tangan handler Next.js).
  void request;

  return new Response(webStream, {
    status: 200,
    headers,
  });
}
