/**
 * Helper umum untuk halaman Master Operasional Klinis.
 */

import type { CairanEntry, DietTeksturEntry, BundleHAIEntry, PenyakitIsolasiEntry } from "@/lib/master/operasionalKlinisMock";

export type Sortable = { urutan: number; label: string };

export function sortByUrutan<T extends Sortable>(items: T[]): T[] {
  return [...items].sort((a, b) => a.urutan - b.urutan || a.label.localeCompare(b.label));
}

/** Auto-suggest kode dari label dengan prefix tertentu. */
export function suggestKode(label: string, prefix = ""): string {
  const slug = label
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w.slice(0, 4))
    .join("-");
  return prefix ? `${prefix}-${slug}` : slug;
}

/** Validasi non-empty kode + label. */
export function isEntryValid(e: { kode?: string; label?: string }): boolean {
  return !!e.kode && e.kode.trim().length > 0 && !!e.label && e.label.trim().length > 0;
}

/** Cek duplikat kode (case-insensitive). */
export function isDuplicateKode(kode: string, existing: string[]): boolean {
  return existing.some((k) => k.toLowerCase() === kode.toLowerCase());
}

// Type guards for type narrowing in shared logic
export function entryKey<T extends { id: string }>(e: T): string {
  return e.id;
}

export type AnyOperasionalEntry =
  | CairanEntry
  | DietTeksturEntry
  | BundleHAIEntry
  | PenyakitIsolasiEntry;
