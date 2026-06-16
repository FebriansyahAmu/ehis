/**
 * UI helpers + tipe payload khusus halaman Master Status Enum.
 */

import type { EnumEntry, EnumTone } from "@/lib/master/statusEnumMock";

/** Sort entries by urutan ascending, with fallback alphabetical. */
export function sortEntries(entries: EnumEntry[]): EnumEntry[] {
  return [...entries].sort((a, b) => {
    if (a.urutan !== b.urutan) return a.urutan - b.urutan;
    return a.label.localeCompare(b.label);
  });
}

/** Payload create/update entri (TANPA kode — auto-gen server, immutable). Dikirim ke /api. */
export interface EntryDraft {
  label: string;
  deskripsi: string;
  tone: EnumTone;
  icon?: string;
  urutan: number;
  status: "Aktif" | "NonAktif";
}

/** EnumEntry (draft form) → EntryDraft payload (buang id/kode/groupKey). */
export function toDraft(e: EnumEntry): EntryDraft {
  return {
    label: e.label,
    deskripsi: e.deskripsi ?? "",
    tone: e.tone,
    icon: e.icon,
    urutan: e.urutan,
    status: e.status,
  };
}
