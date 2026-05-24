/**
 * Print helpers (BL2.6) — paper size, format helpers, dan trigger `window.print()`.
 *
 * Print stylesheet (`@media print`) ada di `src/app/globals.css`:
 *   - `.print-area` = wrapper konten yang dicetak
 *   - `.no-print`   = elemen toolbar/overlay yang di-hide saat print
 *
 * Paper size diatur via `data-paper="A4"|"A5"` di `.print-area`.
 */

export type PaperSize = "A4" | "A5";

export interface PaperCfg {
  label: string;
  description: string;
  screenWidthPx: number;   // simulated screen preview width
}

export const PAPER_CFG: Record<PaperSize, PaperCfg> = {
  A4: { label: "A4", description: "210 × 297 mm · standar surat resmi", screenWidthPx: 720 },
  A5: { label: "A5", description: "148 × 210 mm · default struk kasir",   screenWidthPx: 520 },
};

export const PAPER_ORDER: PaperSize[] = ["A5", "A4"];

// ── Format helpers (Indonesia) ──────────────────────────

/** "Sabtu, 24 Mei 2026" */
export function fmtTanggalLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

/** "24 Mei 2026" */
export function fmtTanggalShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/** "24 Mei 2026 · 13:45" */
export function fmtTanggalJam(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${date} · ${time}`;
}

/** "13:45 WIB" */
export function fmtJamWib(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} WIB`;
}

// ── Print trigger ───────────────────────────────────────

/**
 * Trigger browser print dengan optional delay untuk render-stabilize.
 *
 * Kenapa delay: framer-motion AnimatePresence kadang masih animating saat
 * `window.print()` dipanggil — preview di printer-dialog jadi blank/partial.
 * 60ms cukup untuk frame settle.
 */
export function triggerPrint(delayMs = 60): void {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    window.print();
  }, delayMs);
}

// ── Re-export terbilang untuk konsumen sheet ───────────

export { terbilang } from "@/lib/billing/terbilang";
