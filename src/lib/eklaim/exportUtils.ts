/**
 * CSV export utility for E-Klaim reports (EK8.5).
 * Browser-only — uses URL.createObjectURL + anchor click pattern.
 * BOM (﻿) included so Excel opens without encoding prompt.
 */

export interface CSVSection {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
}

function escapeCell(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function buildSection(section: CSVSection): string {
  const lines: string[] = [];
  if (section.title) lines.push(section.title);
  lines.push(section.headers.map(escapeCell).join(","));
  for (const row of section.rows) {
    lines.push(row.map((v) => escapeCell(String(v))).join(","));
  }
  return lines.join("\r\n");
}

/**
 * Download a CSV file. Supports multiple sections separated by a blank line.
 * @param filename  e.g. "klaim-approval-rate-2026-05-30.csv"
 * @param sections  One or more data blocks (title + headers + rows)
 */
export function downloadCSV(filename: string, sections: CSVSection[]): void {
  const body = sections.map(buildSection).join("\r\n\r\n");
  const csv = "﻿" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Format today's date as YYYY-MM-DD for filenames */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
