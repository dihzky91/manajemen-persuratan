import Mailjet from "node-mailjet";
import { env } from "@/lib/env";

let client: ReturnType<typeof Mailjet.apiConnect> | null = null;

function getClient() {
  if (client) return client;
  if (!env.MAILJET_API_KEY || !env.MAILJET_API_SECRET) {
    return null;
  }
  client = Mailjet.apiConnect(env.MAILJET_API_KEY, env.MAILJET_API_SECRET);
  return client;
}

export type EmailPayload = {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
};

// Kirim email via Mailjet. Saat env kosong → log warning, tidak throw.
// Dipanggil dari server function (misal: saat disposisi dibuat).
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const mj = getClient();
  if (!mj) {
    console.warn("[mailjet] Env kosong — email tidak dikirim:", payload.subject);
    return;
  }
  await mj
    .post("send", { version: "v3.1" })
    .request({
      Messages: [
        {
          From: {
            Email: env.MAILJET_FROM_EMAIL,
            Name: env.MAILJET_FROM_NAME,
          },
          To: [{ Email: payload.to, Name: payload.toName ?? payload.to }],
          Subject: payload.subject,
          HTMLPart: payload.htmlBody,
          TextPart: payload.textBody,
        },
      ],
    });
}

// Template: notifikasi disposisi baru ke penerima.
export function buildDisposisiEmail(args: {
  penerimaNama: string;
  pengirimNama: string;
  perihalSurat: string;
  instruksi?: string | null;
  batasWaktu?: string | null;
  inboxUrl: string;
}): Pick<EmailPayload, "subject" | "htmlBody" | "textBody"> {
  const subject = `Disposisi Baru: ${args.perihalSurat}`;
  const batasWaktuLine = args.batasWaktu
    ? `<p><strong>Batas waktu:</strong> ${args.batasWaktu}</p>`
    : "";
  const instruksiLine = args.instruksi
    ? `<p><strong>Instruksi:</strong> ${args.instruksi}</p>`
    : "";
  const htmlBody = `
    <p>Yth. ${args.penerimaNama},</p>
    <p>Anda menerima disposisi baru dari <strong>${args.pengirimNama}</strong>.</p>
    <p><strong>Perihal:</strong> ${args.perihalSurat}</p>
    ${instruksiLine}
    ${batasWaktuLine}
    <p><a href="${args.inboxUrl}">Buka Inbox Disposisi</a></p>
    <p>— Sistem Manajemen Surat IAI Wilayah DKI Jakarta</p>
  `;
  const textBody = [
    `Yth. ${args.penerimaNama},`,
    `Anda menerima disposisi baru dari ${args.pengirimNama}.`,
    `Perihal: ${args.perihalSurat}`,
    args.instruksi ? `Instruksi: ${args.instruksi}` : "",
    args.batasWaktu ? `Batas waktu: ${args.batasWaktu}` : "",
    `Buka: ${args.inboxUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
  return { subject, htmlBody, textBody };
}
