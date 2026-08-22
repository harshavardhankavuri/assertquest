import PDFDocument from "pdfkit";
import { formatCurrency } from "./currency.js";
import type { Invoice, Shipment } from "@assertquest/shared";

// PDF invoice generation (FR-1001). Branded to match SwiftCargo's own product
// identity (indigo mark, near-black type, cool-gray surfaces) rather than
// AssertQuest's teal/coral practice-platform theme — this document is meant to
// look like it came from the fictional company, not the training wrapper
// around it. Colors/type below are drawn with PDFKit's built-in Helvetica
// family (no embedded font files, no network fonts) so a fresh self-hosted
// container renders an identical PDF with zero extra assets.
const INK = "#101418";
const MUTED = "#6b757e";
const FAINT = "#9aa3ab";
const BORDER = "#e2e6ea";
const SURFACE = "#f6f7f9";
const BRAND = "#3550a8";
const SUCCESS = "#1a7f37";
const PENDING = "#b45309";

const PAGE_MARGIN = 50;
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN * 2; // A4 width minus margins

function drawLogo(doc: PDFKit.PDFDocument, x: number, y: number): number {
  const size = 22;
  doc.roundedRect(x, y, size, size, 6).fill(BRAND);
  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("SwiftCargo", x + size + 10, y + 3);
  return x + size + 10 + doc.widthOfString("SwiftCargo");
}

function statusBadge(doc: PDFKit.PDFDocument, status: Invoice["status"], x: number, y: number) {
  const label = status.toUpperCase();
  const color = status === "paid" ? SUCCESS : PENDING;
  doc.font("Helvetica-Bold").fontSize(9);
  const textWidth = doc.widthOfString(label);
  const padX = 8;
  const width = textWidth + padX * 2;
  doc.roundedRect(x, y, width, 16, 8).fill(color === SUCCESS ? "#e6f4ea" : "#fdf1e0");
  doc.fillColor(color).text(label, x + padX, y + 4);
  return width;
}

function rule(doc: PDFKit.PDFDocument, y: number) {
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, y).lineWidth(1).strokeColor(BORDER).stroke();
}

function label(doc: PDFKit.PDFDocument, text: string, x: number, y: number) {
  doc.font("Helvetica").fontSize(8).fillColor(FAINT).text(text.toUpperCase(), x, y, { characterSpacing: 0.6 });
}

function value(doc: PDFKit.PDFDocument, text: string, x: number, y: number, opts?: { bold?: boolean; size?: number; color?: string }) {
  doc
    .font(opts?.bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(opts?.size ?? 11)
    .fillColor(opts?.color ?? INK)
    .text(text, x, y);
}

export function generateInvoicePdf(invoice: Invoice, shipment: Shipment): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header — logo + wordmark left, "INVOICE" + id right.
    drawLogo(doc, PAGE_MARGIN, PAGE_MARGIN);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(INK).text("INVOICE", PAGE_MARGIN, PAGE_MARGIN + 2, {
      width: CONTENT_WIDTH,
      align: "right",
    });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(invoice.id, PAGE_MARGIN, PAGE_MARGIN + 19, { width: CONTENT_WIDTH, align: "right" });

    rule(doc, PAGE_MARGIN + 48);

    // Meta row — issued / status left column, shipment id right column.
    const metaY = PAGE_MARGIN + 66;
    label(doc, "Issued", PAGE_MARGIN, metaY);
    value(doc, new Date(invoice.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), PAGE_MARGIN, metaY + 12);

    label(doc, "Status", PAGE_MARGIN, metaY + 40);
    statusBadge(doc, invoice.status, PAGE_MARGIN, metaY + 52);

    const rightColX = PAGE_MARGIN + CONTENT_WIDTH / 2;
    label(doc, "Shipment", rightColX, metaY);
    value(doc, shipment.id, rightColX, metaY + 12, { size: 10 });
    label(doc, "Route", rightColX, metaY + 40);
    value(doc, `${shipment.origin.label} -> ${shipment.destination.label}`, rightColX, metaY + 52, { size: 10 });

    rule(doc, metaY + 92);

    // Shipment detail table.
    const tableY = metaY + 112;
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text("Shipment details", PAGE_MARGIN, tableY);

    const rows: Array<[string, string]> = [
      ["Origin", shipment.origin.label],
      ["Destination", shipment.destination.label],
      ["Package weight", `${shipment.package.weightKg} kg`],
      ["Distance", `${shipment.distanceKm.toFixed(1)} km`],
    ];
    let rowY = tableY + 26;
    for (const [k, v] of rows) {
      doc.rect(PAGE_MARGIN, rowY - 6, CONTENT_WIDTH, 24).fill(SURFACE);
      value(doc, k, PAGE_MARGIN + 12, rowY, { color: MUTED, size: 10 });
      doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(v, PAGE_MARGIN, rowY, {
        width: CONTENT_WIDTH - 12,
        align: "right",
      });
      rowY += 26;
    }

    // Amount due panel.
    const amountY = rowY + 20;
    doc.roundedRect(PAGE_MARGIN, amountY, CONTENT_WIDTH, 64, 10).fill(INK);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#8fa0ac")
      .text("AMOUNT DUE", PAGE_MARGIN + 20, amountY + 16, { characterSpacing: 0.6 });
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#ffffff")
      .text(formatCurrency(invoice.amountCents, invoice.currency), PAGE_MARGIN + 20, amountY + 30);

    // Footer.
    const footerY = amountY + 100;
    rule(doc, footerY);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(FAINT)
      .text(
        "This is a mock invoice generated by SwiftCargo, a fictional logistics app used for AssertQuest automation-testing practice. No real payment has occurred.",
        PAGE_MARGIN,
        footerY + 12,
        { width: CONTENT_WIDTH },
      );
    doc.text(`Generated ${new Date().toISOString()}`, PAGE_MARGIN, footerY + 32);

    doc.end();
  });
}
