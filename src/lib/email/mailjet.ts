import Mailjet from "node-mailjet";
import { APP_BRAND_FULL_NAME } from "@/lib/branding";
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
  attachments?: {
    contentType: string;
    filename: string;
    base64Content: string;
  }[];
};

// Kirim email via Mailjet. Saat env kosong → log warning, tidak throw.
// Dipanggil dari server function (misal: saat disposisi dibuat).
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const mj = getClient();
  if (!mj) {
    console.warn(
      "[mailjet] Env kosong — email tidak dikirim:",
      payload.subject,
    );
    return;
  }
  await mj.post("send", { version: "v3.1" }).request({
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
        Attachments: payload.attachments?.map((attachment) => ({
          ContentType: attachment.contentType,
          Filename: attachment.filename,
          Base64Content: attachment.base64Content,
        })),
      },
    ],
  });
}

// Template: undangan aktivasi akun untuk pegawai baru (set kata sandi pertama).
export function buildInviteEmail(args: {
  namaLengkap: string;
  resetUrl: string;
  inviterName?: string | null;
}): Pick<EmailPayload, "subject" | "htmlBody" | "textBody"> {
  const subject = `Undangan Aktivasi Akun - ${APP_BRAND_FULL_NAME}`;
  const inviterLine = args.inviterName
    ? `<p>Akun Anda dibuat oleh <strong>${args.inviterName}</strong>.</p>`
    : "";
  const htmlBody = `
    <p>Yth. ${args.namaLengkap},</p>
    <p>Selamat datang di ${APP_BRAND_FULL_NAME}.</p>
    ${inviterLine}
    <p>Silakan klik tombol di bawah untuk membuat kata sandi dan mengaktifkan akun Anda. Tautan ini berlaku terbatas (default 1 jam).</p>
    <p><a href="${args.resetUrl}" style="display:inline-block;padding:10px 16px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none">Aktivasi Akun</a></p>
    <p>Jika tombol tidak berfungsi, salin URL berikut: <br/><a href="${args.resetUrl}">${args.resetUrl}</a></p>
    <p>Jika Anda tidak meminta akses ini, abaikan email ini.</p>
    <p>- ${APP_BRAND_FULL_NAME}</p>
  `;
  const textBody = [
    `Yth. ${args.namaLengkap},`,
    `Selamat datang di ${APP_BRAND_FULL_NAME}.`,
    args.inviterName ? `Akun Anda dibuat oleh ${args.inviterName}.` : "",
    `Aktivasi akun: ${args.resetUrl}`,
    `Jika Anda tidak meminta akses, abaikan email ini.`,
  ]
    .filter(Boolean)
    .join("\n");
  return { subject, htmlBody, textBody };
}

// Template: permintaan reset kata sandi (untuk user existing).
export function buildResetPasswordEmail(args: {
  namaLengkap: string;
  resetUrl: string;
}): Pick<EmailPayload, "subject" | "htmlBody" | "textBody"> {
  const subject = `Reset Kata Sandi - ${APP_BRAND_FULL_NAME}`;
  const htmlBody = `
    <p>Yth. ${args.namaLengkap},</p>
    <p>Kami menerima permintaan reset kata sandi untuk akun Anda.</p>
    <p>Klik tombol di bawah untuk mengatur kata sandi baru. Tautan ini berlaku terbatas (default 1 jam).</p>
    <p><a href="${args.resetUrl}" style="display:inline-block;padding:10px 16px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none">Reset Kata Sandi</a></p>
    <p>Jika tombol tidak berfungsi, salin URL berikut: <br/><a href="${args.resetUrl}">${args.resetUrl}</a></p>
    <p>Jika Anda tidak meminta reset, abaikan email ini — kata sandi Anda tetap aman.</p>
    <p>- ${APP_BRAND_FULL_NAME}</p>
  `;
  const textBody = [
    `Yth. ${args.namaLengkap},`,
    `Kami menerima permintaan reset kata sandi untuk akun Anda.`,
    `Reset: ${args.resetUrl}`,
    `Jika Anda tidak meminta reset, abaikan email ini.`,
  ].join("\n");
  return { subject, htmlBody, textBody };
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
    <p>- ${APP_BRAND_FULL_NAME}</p>
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
