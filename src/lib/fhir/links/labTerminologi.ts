/**
 * L16 — gerbang terminologi lab resmi SatuSehat (Lampiran LOINC Laboratorium, `master.terminologi_lab`). Murni.
 *  - `ServiceRequest.code` → kode harus berkategori **Permintaan** atau **Permintaan & Hasil**.
 *  - `Observation.code`    → kode harus berkategori **Hasil** atau **Permintaan & Hasil**.
 *  - Kode tak ada di lampiran → ditahan (lampiran = daftar resmi; LOINC penuh sengaja tidak dipakai).
 * docs/fhir-mapping/L16-lab-to-diagnostic.md §Terminologi resmi.
 */

import type { Issue } from "./types";

export type PemakaianKodeLab = "permintaan" | "hasil";

/** code → himpunan nilai `permintaan_hasil` (satu kode bisa muncul di beberapa lampiran). */
export type KategoriKodeLab = ReadonlyMap<string, ReadonlySet<string>>;

const BOLEH: Record<PemakaianKodeLab, readonly string[]> = {
  permintaan: ["Permintaan", "Permintaan & Hasil"],
  hasil: ["Hasil", "Permintaan & Hasil"],
};

export function kategoriKodeLabOf(rows: { code: string; permintaanHasil: string | null }[]): KategoriKodeLab {
  const m = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.permintaanHasil) continue;
    const s = m.get(r.code) ?? new Set<string>();
    s.add(r.permintaanHasil);
    m.set(r.code, s);
  }
  return m;
}

/** null = boleh dipakai; selain itu Issue alasan penahanan. */
export function cekKodeLab(
  kategori: KategoriKodeLab,
  code: string,
  pakai: PemakaianKodeLab,
  item: { resourceType: "ServiceRequest" | "Observation"; localId: string; nama: string },
): Issue | null {
  const base = { link: "L16" as const, resourceType: item.resourceType, localId: item.localId };
  const ada = kategori.get(code);
  if (!ada) {
    return { ...base, code: "kode-tidak-valid", message: `"${item.nama}": kode ${code} tidak ada di Lampiran LOINC Laboratorium SatuSehat — ditahan` };
  }
  if (!BOLEH[pakai].some((k) => ada.has(k))) {
    const label = pakai === "permintaan" ? "permintaan (ServiceRequest)" : "hasil (Observation)";
    return { ...base, code: "kategori-salah", message: `"${item.nama}": kode ${code} berkategori ${[...ada].join("/")} — bukan kode ${label}` };
  }
  return null;
}
