/**
 * Berkas Checker — validasi kelengkapan berkas klaim sebelum submit.
 *
 * Pakai template dari `berkasTemplatesMock.ts` (BPJS-RI / BPJS-RJ / BPJS-IGD /
 * Asuransi) lalu compare dengan berkas instance per-klaim. Hasil checklist
 * dipakai EK3 (Klaim Detail tab Berkas) + EK6 (Berkas Susulan flow).
 *
 * Convention:
 * - Berkas `wajib` yang status "Belum" / "Reject Verifikator" → masuk `missing`.
 * - Berkas optional (wajib=false) → masuk `optional` (display only, tidak block).
 * - "Siap" + "Tidak Berlaku" dianggap satisfied untuk wajib.
 *
 * Referensi: TODO-EKLAIM.md § EK0.3 · PMK 26/2021.
 */

import { getBerkasTemplate, type BerkasTemplate } from "./berkasTemplatesMock";
import type { BerkasKlaim, ClaimRecord } from "./eklaimShared";

// ── Result Types ───────────────────────────────────────

export interface BerkasChecklistItem {
  template: BerkasTemplate;
  instance?: BerkasKlaim;
  /** "Belum" / "Reject Verifikator" untuk wajib → false. */
  satisfied: boolean;
}

export interface BerkasCheckResult {
  ready: boolean;
  missing: ReadonlyArray<BerkasChecklistItem>;
  optional: ReadonlyArray<BerkasChecklistItem>;
  /** 0-100 — % wajib yang sudah satisfied. */
  progressPercent: number;
  /** Detail per template + instance untuk render UI. */
  items: ReadonlyArray<BerkasChecklistItem>;
}

// ── Core Checker ───────────────────────────────────────

/**
 * Validasi kelengkapan berkas terhadap template (penjamin × tipePelayanan).
 *
 * Returns:
 * - `ready`: true kalau semua berkas wajib sudah "Siap" atau "Tidak Berlaku".
 * - `missing`: berkas wajib yang belum satisfied.
 * - `optional`: berkas non-wajib (display untuk completeness scoring).
 * - `progressPercent`: rounded 0-100 dari wajib satisfied / wajib total.
 *
 * Mismatched template vs instance (e.g. berkas instance ada tapi tidak ada
 * di template) di-IGNORE — kemungkinan template berubah versi.
 */
export function checkBerkas(claim: ClaimRecord): BerkasCheckResult {
  const template = getBerkasTemplate(claim.penjamin.tipe, claim.tipePelayanan);
  const items = buildChecklist(template, claim.berkas);

  const wajibItems = items.filter((it) => it.template.wajib);
  const optionalItems = items.filter((it) => !it.template.wajib);
  const missing = wajibItems.filter((it) => !it.satisfied);

  const progressPercent =
    wajibItems.length === 0
      ? 100
      : Math.round(((wajibItems.length - missing.length) / wajibItems.length) * 100);

  return {
    ready: missing.length === 0,
    missing,
    optional: optionalItems,
    progressPercent,
    items,
  };
}

// ── Internal ───────────────────────────────────────────

/**
 * Match template ↔ instance by (kategori, nama). Tidak pakai id karena
 * instance generate id dari template index (lihat `instansiBerkasFromTemplate`).
 */
function buildChecklist(
  template: ReadonlyArray<BerkasTemplate>,
  instances: ReadonlyArray<BerkasKlaim>,
): BerkasChecklistItem[] {
  return template.map((tpl) => {
    const instance = instances.find(
      (b) => b.kategori === tpl.kategori && b.nama === tpl.nama,
    );
    return {
      template: tpl,
      instance,
      satisfied: isSatisfied(tpl, instance),
    };
  });
}

function isSatisfied(template: BerkasTemplate, instance?: BerkasKlaim): boolean {
  if (!template.wajib) return true; // optional → satisfied by default
  if (!instance) return false;
  return instance.status === "Siap" || instance.status === "Tidak Berlaku";
}

// ── Convenience ────────────────────────────────────────

/**
 * Quick predicate untuk filter klaim "siap submit" di Board (EK2).
 * Equivalent dengan `checkBerkas(claim).ready` tapi lebih hemat (early exit).
 */
export function isBerkasReady(claim: ClaimRecord): boolean {
  const template = getBerkasTemplate(claim.penjamin.tipe, claim.tipePelayanan);
  for (const tpl of template) {
    if (!tpl.wajib) continue;
    const instance = claim.berkas.find(
      (b) => b.kategori === tpl.kategori && b.nama === tpl.nama,
    );
    if (!isSatisfied(tpl, instance)) return false;
  }
  return true;
}

/** Return only category names of berkas wajib yang missing — buat banner ringkas. */
export function missingBerkasCategories(claim: ClaimRecord): ReadonlyArray<string> {
  const { missing } = checkBerkas(claim);
  return missing.map((it) => it.template.nama);
}
