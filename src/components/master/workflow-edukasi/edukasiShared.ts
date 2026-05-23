/**
 * UI helpers + sorter khusus halaman Master Workflow Edukasi.
 */

import type { EdukasiEntry } from "@/lib/master/edukasiMock";

/** Sort entries by urutan ascending, fallback alphabetical. */
export function sortEntries(entries: EdukasiEntry[]): EdukasiEntry[] {
  return [...entries].sort((a, b) => {
    if (a.urutan !== b.urutan) return a.urutan - b.urutan;
    return a.label.localeCompare(b.label);
  });
}

/** Generate kode otomatis dari label — uppercase + underscore, max 24 chars. */
export function suggestKode(label: string): string {
  return label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}
