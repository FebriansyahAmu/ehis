/**
 * UI helpers + table column config khusus untuk halaman Master Status Enum.
 */

import type { LucideIcon } from "lucide-react";
import { ICON_REGISTRY, type EnumEntry } from "@/lib/master/statusEnumMock";

/** Render LucideIcon dari string key. Returns undefined kalau key tidak terdaftar. */
export function resolveIcon(key: string | undefined): LucideIcon | undefined {
  if (!key) return undefined;
  return ICON_REGISTRY[key];
}

/** Sort entries by urutan ascending, with fallback alphabetical. */
export function sortEntries(entries: EnumEntry[]): EnumEntry[] {
  return [...entries].sort((a, b) => {
    if (a.urutan !== b.urutan) return a.urutan - b.urutan;
    return a.label.localeCompare(b.label);
  });
}

/** Generate kode otomatis dari label (uppercase + underscore). */
export function suggestKode(label: string): string {
  return label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}
