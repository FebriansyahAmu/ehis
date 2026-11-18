/**
 * S5a — L07 riwayat pengobatan → MedicationStatement (fungsi murni; aman diimpor client — impor lain type-only).
 * Playbook RJ/RI Tabel 3 · IGD Tabel 4 item 6 + skenario Tabel 4/5 (verbatim 2026-11-18):
 *   obat BUKAN dari fasyankes ini → `medicationCodeableConcept` KFA —
 *   "92…" Kode Produk Obat Template (merek tidak diketahui) · "93…" Kode Produk Obat Aktual (merek diketahui).
 * Riwayat dituturkan pasien; obat dipilih dari rekomendasi formularium RS = penanda ZAT/KEKUATAN/BENTUK, bukan
 * bukti merek yang dikonsumsi → template 92 diutamakan, aktual 93 cadangan bila master hanya punya 93 (FG-135).
 * Sumber "latest wins" → localId tingkat kunjungan per obat katalog; obat yang dihapus → entered-in-error.
 */

import type { Issue } from "./types";
import type { Rencana } from "./anamnesis";

/** Subset blok `master.Obat.kfa` (JSONB) yang relevan untuk kode produk. */
export interface KfaProduk {
  povKode?: string;
  povNama?: string;
  poaKode?: string;
  poaNama?: string;
}

export interface KfaRiwayat {
  kode: string;
  nama: string;
  /** Jenis kode produk KFA (label playbook). */
  jenis: "template" | "aktual";
}

const KFA_TEMPLATE = /^92\d+$/;
const KFA_AKTUAL = /^93\d+$/;

/** Kode KFA yang dikirim untuk riwayat obat: template 92 diutamakan, aktual 93 cadangan; format salah = null. */
export function kfaRiwayatOf(kfa: KfaProduk | null | undefined): KfaRiwayat | null {
  const pov = kfa?.povKode?.trim();
  const poa = kfa?.poaKode?.trim();
  if (pov && KFA_TEMPLATE.test(pov)) return { kode: pov, nama: kfa?.povNama?.trim() ?? "", jenis: "template" };
  if (poa && KFA_AKTUAL.test(poa)) return { kode: poa, nama: kfa?.poaNama?.trim() ?? "", jenis: "aktual" };
  return null;
}

export type StatusRiwayatObat = "aktif" | "berhenti";

/** Status lokal → MedicationStatement.status (contoh resmi RI: `completed`). */
export const STATUS_RIWAYAT_OBAT: Record<StatusRiwayatObat, "active" | "completed"> = {
  aktif: "active",
  berhenti: "completed",
};

export const riwayatObatLocalId = (kunjunganId: string, obatId: string) => `${kunjunganId}:riwayat-obat:${obatId}`;

export interface RiwayatObatRow {
  createdAt: Date;
  items: {
    nama: string;
    obatId: string | null;
    status: string | null;
    dosis: string | null;
    frekuensi: string | null;
    rute: string | null;
    sejak: string | null;
    indikasi: string | null;
  }[];
}

export interface RiwayatObatItem {
  localId: string;
  nama: string;
  kfa: KfaRiwayat;
  status: "active" | "completed";
  /** Gabungan dosis · frekuensi · rute → `dosage.text`. */
  dosis: string | null;
  /** "Sejak …" · "Indikasi …" → `note`. */
  catatan: string[];
  dateAsserted: Date;
}

const isStatus = (s: string | null): s is StatusRiwayatObat => s === "aktif" || s === "berhenti";
const gabung = (parts: (string | null)[], sep: string) => parts.map((p) => p?.trim()).filter(Boolean).join(sep) || null;

/** `rows` urut createdAt naik; baris terakhir = yang berlaku. `kfaByObat` = blok KFA master per obatId (saat kirim). */
export function riwayatObatRencana(
  kunjunganId: string,
  rows: RiwayatObatRow[],
  kfaByObat: Map<string, KfaProduk | null>,
): Rencana<RiwayatObatItem> {
  const out: Rencana<RiwayatObatItem> = { kirim: [], tarik: [], issues: [] };
  const latest = rows.at(-1);
  if (!latest) return out;

  const issue = (localId: string, message: string): Issue =>
    ({ link: "L07", resourceType: "MedicationStatement", localId, code: "kode-kosong", message });
  const item = (row: RiwayatObatRow, it: RiwayatObatRow["items"][number], kfa: KfaRiwayat, status: "active" | "completed"): RiwayatObatItem => ({
    localId: riwayatObatLocalId(kunjunganId, it.obatId!),
    nama: it.nama.trim(),
    kfa,
    status,
    dosis: gabung([it.dosis, it.frekuensi, it.rute], " · "),
    catatan: [it.sejak?.trim() ? `Sejak: ${it.sejak.trim()}` : "", it.indikasi?.trim() ? `Indikasi: ${it.indikasi.trim()}` : ""].filter(Boolean),
    dateAsserted: row.createdAt,
  });

  const aktif = new Set<string>();
  for (const it of latest.items) {
    if (!it.nama.trim()) continue;
    if (!it.obatId) {
      out.issues.push(issue(`${kunjunganId}:riwayat-obat:nama:${it.nama.trim()}`,
        `Riwayat obat "${it.nama.trim()}" diketik bebas — belum dipilih dari rekomendasi obat ber-KFA, ditahan`));
      continue;
    }
    if (aktif.has(it.obatId)) continue; // obat sama dua kali dalam satu simpanan
    aktif.add(it.obatId);
    const localId = riwayatObatLocalId(kunjunganId, it.obatId);
    const kfa = kfaRiwayatOf(kfaByObat.get(it.obatId));
    if (!kfa) {
      out.issues.push(issue(localId, `Riwayat obat "${it.nama.trim()}" — obat katalog belum dipetakan KFA 92/93 (Master Katalog Obat › Mapping KFA), ditahan`));
      continue;
    }
    if (!isStatus(it.status)) {
      out.issues.push(issue(localId, `Riwayat obat "${it.nama.trim()}" — status (masih diminum / berhenti) belum diisi, ditahan`));
      continue;
    }
    out.kirim.push(item(latest, it, kfa, STATUS_RIWAYAT_OBAT[it.status]));
  }

  // Tarik: obat katalog di simpanan lama yang tidak ada lagi di simpanan terbaru.
  const sudah = new Set(aktif);
  for (const row of rows.slice(0, -1).reverse()) {
    for (const it of row.items) {
      if (!it.obatId || sudah.has(it.obatId)) continue;
      sudah.add(it.obatId);
      const kfa = kfaRiwayatOf(kfaByObat.get(it.obatId));
      if (kfa) out.tarik.push(item(row, it, kfa, isStatus(it.status) ? STATUS_RIWAYAT_OBAT[it.status] : "completed"));
    }
  }
  return out;
}
