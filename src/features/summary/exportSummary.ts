import jsPDF from "jspdf";
// Logo di folder public (Vite akan serve di root path)
const LOGO_URL = "/grape.svg";
import { formatCurrency } from "../../utils/format";
import type { MonthlySummaryRow } from "../../types/models";

// CSV & Excel export dihapus sesuai permintaan – hanya PDF.

// Map nomor bulan ke nama Indonesia
const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

async function svgToPngDataUrl(url: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = (e) => rej(e);
    });
    const canvas = document.createElement("canvas");
    const size = 64; // fixed size for consistent output
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Center contain into square canvas
    const scale = Math.min(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function exportSummaryToPDF(
  rows: MonthlySummaryRow[],
  filename = "ringkasan.pdf"
) {
  if (!rows.length) return;

  // Aggregate across provided rows (assume filtered range)
  const totals = rows.reduce(
    (acc, r) => {
      acc.rent_collected += r.rent_collected;
      acc.penalties_collected += r.penalties_collected;
      acc.expenses_total += r.expenses_total;
      return acc;
    },
    { rent_collected: 0, penalties_collected: 0, expenses_total: 0 }
  );
  const gross = totals.rent_collected + totals.penalties_collected;
  const net = gross - totals.expenses_total;

  // Derive month label: if single month use its name, else range
  let periodLabel: string;
  if (rows.length === 1) {
    const [y] = rows[0].month.split("-");
    const monthIdx = Number(rows[0].month.slice(5, 7)) - 1;
    periodLabel = `${MONTH_NAMES_ID[monthIdx]} ${y}`;
  } else {
    const first = rows[0].month;
    const last = rows[rows.length - 1].month;
    const fy = first.slice(0, 4);
    const fm = Number(first.slice(5, 7)) - 1;
    const ly = last.slice(0, 4);
    const lm = Number(last.slice(5, 7)) - 1;
    periodLabel = `${MONTH_NAMES_ID[fm]} ${fy} - ${MONTH_NAMES_ID[lm]} ${ly}`;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  let y = 56;

  // Render logo (SVG converted to PNG) if bisa
  const logoDataUrl = await svgToPngDataUrl(LOGO_URL);
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", marginX, y - 32, 48, 48);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const headerOffset = logoDataUrl ? 60 : 0;
  // Tampilkan hanya nama periode; logo sudah ada di kiri
  doc.text(`${periodLabel}`, marginX + headerOffset, y);
  y += 40;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  // Small vertical table
  const labelWidth = 220; // align colons
  function row(label: string, value: string, color?: [number, number, number]) {
    if (color) doc.setTextColor(...color);
    else doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", label.includes("Pendapatan") ? "bold" : "normal");
    doc.text(label, marginX, y);
    doc.text(":", marginX + labelWidth, y);
    doc.text(value, marginX + labelWidth + 10, y);
    y += 22;
  }

  row("Total Keuntungan Kotor", formatCurrency(gross), [34, 139, 34]);
  row(
    "Total Pengeluaran",
    totals.expenses_total ? `-${formatCurrency(totals.expenses_total)}` : "0",
    [178, 34, 34]
  );
  row("Total Pendapatan Bersih Net", formatCurrency(net), [48, 48, 150]);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text("Dihasilkan otomatis oleh aplikasi Kos Anggur Merah", marginX, 812);

  doc.save(filename);
}
