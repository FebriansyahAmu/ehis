/**
 * UI helpers + sorter khusus halaman Master Discharge Klasifikasi.
 */

import type { DischargeListEntry } from "@/lib/master/dischargeKlasifikasiMock";

export function sortListEntries(entries: DischargeListEntry[]): DischargeListEntry[] {
  return [...entries].sort((a, b) => {
    if (a.urutan !== b.urutan) return a.urutan - b.urutan;
    return a.label.localeCompare(b.label);
  });
}

export function suggestKode(label: string): string {
  return label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}
