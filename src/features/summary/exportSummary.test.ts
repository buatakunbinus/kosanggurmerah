import { describe, it, expect } from "vitest";
import { buildCsvLines, buildWorksheetData } from "./exportSummary";
import type { MonthlySummaryRow } from "../../types/models";

const sample: MonthlySummaryRow[] = [
  {
    month: "2025-01",
    rent_invoiced: 1000,
    rent_collected: 900,
    penalties_incurred: 50,
    penalties_collected: 40,
    expenses_total: 300,
    net_realized: 640,
    net_gross: 650,
  },
];

describe("exportSummary helpers", () => {
  it("buildCsvLines returns header + row", () => {
    const lines = buildCsvLines(sample);
    expect(lines.length).toBe(2);
    expect(lines[0].split(",")[0]).toBe("month");
    expect(lines[1]).toContain("2025-01");
  });
  it("buildWorksheetData maps properties", () => {
    const ws = buildWorksheetData(sample);
    expect(ws[0].month).toBe("2025-01");
    expect(ws[0].rent_invoiced).toBe(1000);
    expect(Object.keys(ws[0]).length).toBe(8);
  });
});
