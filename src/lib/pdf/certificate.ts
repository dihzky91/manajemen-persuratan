import {
  PDFDocument,
  rgb,
  StandardFonts,
  degrees,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type {
  TemplateFieldKey,
  TemplateFieldMap,
  TemplateFieldPosition,
} from "@/server/db/schema";

type CertificateData = {
  namaPeserta: string;
  noSertifikat: string;
  namaKegiatan: string;
  kategori: string;
  tanggalKegiatan: string;
  lokasi: string | null;
  skp: string | null;
  qrCodeDataUrl: string;
  signatures: Array<{ nama: string; jabatan: string }>;
};

const signatureFieldMap: Partial<Record<TemplateFieldKey, (data: CertificateData) => string>> = {
  signature1Nama: (data) => data.signatures[0]?.nama ?? "",
  signature1Jabatan: (data) => data.signatures[0]?.jabatan ?? "",
  signature2Nama: (data) => data.signatures[1]?.nama ?? "",
  signature2Jabatan: (data) => data.signatures[1]?.jabatan ?? "",
  signature3Nama: (data) => data.signatures[2]?.nama ?? "",
  signature3Jabatan: (data) => data.signatures[2]?.jabatan ?? "",
};

function resolveText(field: TemplateFieldKey, data: CertificateData) {
  const values: Partial<Record<TemplateFieldKey, string>> = {
    namaPeserta: data.namaPeserta,
    noSertifikat: data.noSertifikat,
    namaKegiatan: data.namaKegiatan,
    kategori: data.kategori,
    tanggalKegiatan: data.tanggalKegiatan,
    lokasi: data.lokasi ?? "",
    skp: data.skp ?? "",
  };
  return signatureFieldMap[field]?.(data) ?? values[field] ?? "";
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const red = Number.parseInt(clean.slice(0, 2), 16) / 255;
  const green = Number.parseInt(clean.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(red, green, blue);
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function fontNameFor(position: TemplateFieldPosition) {
  if (position.fontFamily === "Courier") {
    if (position.fontWeight === "bold" && position.fontStyle === "italic") {
      return StandardFonts.CourierBoldOblique;
    }
    if (position.fontWeight === "bold") return StandardFonts.CourierBold;
    if (position.fontStyle === "italic") return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }

  if (position.fontFamily === "Times-Roman") {
    if (position.fontWeight === "bold" && position.fontStyle === "italic") {
      return StandardFonts.TimesRomanBoldItalic;
    }
    if (position.fontWeight === "bold") return StandardFonts.TimesRomanBold;
    if (position.fontStyle === "italic") return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }

  if (position.fontWeight === "bold" && position.fontStyle === "italic") {
    return StandardFonts.HelveticaBoldOblique;
  }
  if (position.fontWeight === "bold") return StandardFonts.HelveticaBold;
  if (position.fontStyle === "italic") return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth?: number) {
  if (!maxWidth) return [text];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

function drawTextField(args: {
  page: PDFPage;
  field: TemplateFieldKey;
  position: TemplateFieldPosition;
  font: PDFFont;
  pageWidth: number;
  pageHeight: number;
  data: CertificateData;
}) {
  const text = resolveText(args.field, args.data);
  if (!text) return;

  const anchorX = (args.position.x / 100) * args.pageWidth;
  const anchorY = args.pageHeight - (args.position.y / 100) * args.pageHeight;
  const maxWidth = args.position.width ? (args.position.width / 100) * args.pageWidth : undefined;
  const lines = wrapText(text, args.font, args.position.fontSize, maxWidth);
  const lineHeight = args.position.fontSize * 1.2;

  lines.forEach((line, index) => {
    const textWidth = args.font.widthOfTextAtSize(line, args.position.fontSize);
    const x =
      args.position.align === "center"
        ? anchorX - textWidth / 2
        : args.position.align === "right"
          ? anchorX - textWidth
          : anchorX;
    args.page.drawText(line, {
      x,
      y: anchorY - index * lineHeight,
      size: args.position.fontSize,
      font: args.font,
      color: hexToRgb(args.position.color),
    });
  });
}

export async function buildCertificatePdf(opts: {
  templateImageBytes: Uint8Array;
  imageMimeType: "image/png" | "image/jpeg";
  imageWidthPx: number;
  imageHeightPx: number;
  fieldPositions: TemplateFieldMap;
  data: CertificateData;
  isRevoked?: boolean;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const templateImage =
    opts.imageMimeType === "image/png"
      ? await pdfDoc.embedPng(opts.templateImageBytes)
      : await pdfDoc.embedJpg(opts.templateImageBytes);

  const page = pdfDoc.addPage([opts.imageWidthPx, opts.imageHeightPx]);
  page.drawImage(templateImage, {
    x: 0,
    y: 0,
    width: opts.imageWidthPx,
    height: opts.imageHeightPx,
  });

  const fontCache = new Map<string, PDFFont>();
  for (const [fieldKey, position] of Object.entries(opts.fieldPositions) as Array<
    [TemplateFieldKey, TemplateFieldPosition]
  >) {
    if (!position.enabled) continue;

    if (fieldKey === "qrCode") {
      const qrBytes = dataUrlToBytes(opts.data.qrCodeDataUrl);
      const qrImage = await pdfDoc.embedPng(qrBytes);
      const size = position.width ? (position.width / 100) * opts.imageWidthPx : 120;
      page.drawImage(qrImage, {
        x: (position.x / 100) * opts.imageWidthPx - size / 2,
        y: opts.imageHeightPx - (position.y / 100) * opts.imageHeightPx - size / 2,
        width: size,
        height: size,
      });
      continue;
    }

    const fontName = fontNameFor(position);
    const font = fontCache.get(fontName) ?? (await pdfDoc.embedFont(fontName));
    fontCache.set(fontName, font);

    drawTextField({
      page,
      field: fieldKey,
      position,
      font,
      pageWidth: opts.imageWidthPx,
      pageHeight: opts.imageHeightPx,
      data: opts.data,
    });
  }

  if (opts.isRevoked) {
    const watermarkFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = Math.min(opts.imageWidthPx, opts.imageHeightPx) * 0.12;
    const text = "DICABUT";
    const textWidth = watermarkFont.widthOfTextAtSize(text, fontSize);
    const centerX = (opts.imageWidthPx - textWidth) / 2;
    const centerY = opts.imageHeightPx / 2;

    page.drawText(text, {
      x: centerX,
      y: centerY,
      size: fontSize,
      font: watermarkFont,
      color: rgb(0.8, 0, 0),
      opacity: 0.35,
      rotate: degrees(-35),
    });
  }

  return pdfDoc.save();
}
