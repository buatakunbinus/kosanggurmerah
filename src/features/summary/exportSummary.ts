import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import type { MonthlySummaryRow } from "../../types/models";

const headers = [
  "month",
  "rent_invoiced",
  "rent_collected",
  "penalties_incurred",
  "penalties_collected",
  "expenses_total",
  "net_realized",
  "net_gross",
];

export function buildCsvLines(rows: MonthlySummaryRow[]): string[] {
  if (!rows.length) return [];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.month,
        r.rent_invoiced,
        r.rent_collected,
        r.penalties_incurred,
        r.penalties_collected,
        r.expenses_total,
        r.net_realized,
        r.net_gross,
      ].join(",")
    );
  }
  return lines;
}

export function exportSummaryToCSV(
  rows: MonthlySummaryRow[],
  filename = "monthly_summary.csv"
) {
  const lines = buildCsvLines(rows);
  if (!lines.length) return;
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function buildWorksheetData(rows: MonthlySummaryRow[]) {
  return rows.map((r) => ({
    month: r.month,
    rent_invoiced: r.rent_invoiced,
    rent_collected: r.rent_collected,
    penalties_incurred: r.penalties_incurred,
    penalties_collected: r.penalties_collected,
    expenses_total: r.expenses_total,
    net_realized: r.net_realized,
    net_gross: r.net_gross,
  }));
}

export function exportSummaryToExcel(
  rows: MonthlySummaryRow[],
  filename = "monthly_summary.xlsx"
) {
  if (!rows.length) return;
  const worksheetData = buildWorksheetData(rows);
  const ws = utils.json_to_sheet(worksheetData, { header: headers });
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Summary");
  writeFile(wb, filename);
}

export function exportSummaryToPDF(
  rows: MonthlySummaryRow[],
  filename = "monthly_summary.pdf"
) {
  if (!rows.length) return;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 40;
  doc.setFontSize(14);
  doc.text("Monthly Financial Summary", marginX, y);
  y += 20;
  doc.setFontSize(9);
  const headersRow = headers;
  const colWidths = [60, 70, 70, 70, 70, 70, 70, 60];
  function drawRow(cells: (string | number)[], bold = false) {
    let x = marginX;
    if (bold) doc.setFont("helvetica", "bold");
    else doc.setFont("helvetica", "normal");
    cells.forEach((c, i) => {
      const text = String(c);
      doc.text(text, x, y, { baseline: "top" });
      x += colWidths[i];
    });
    y += 14;
  }
  drawRow(headersRow, true);
  rows.forEach((r) => {
    if (y > 760) {
      // new page
      doc.addPage();
      y = 40;
      drawRow(headersRow, true);
    }
    drawRow([
      r.month,
      r.rent_invoiced,
      r.rent_collected,
      r.penalties_incurred,
      r.penalties_collected,
      r.expenses_total,
      r.net_realized,
      r.net_gross,
    ]);
  });
  doc.save(filename);
}
