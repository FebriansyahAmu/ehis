// Helper tab Update Tanggal Pulang (V-Claim PUT /SEP/updtglplg + GET list per bulan).
// Tanggal = yyyy-mm-dd LOKAL (bukan toISOString yang UTC → bisa mundur sehari).

import type { SEPRecordExt, StatusPulangKode } from "@/lib/bpjs/bpjsShared";
import { fmtTglPendek, hariIniISO, selisihHari, sepTerbuka, type BadgeTone } from "./sepShared";

// ── Status pulang (kode spec V-Claim) ──────────────────────

export const STATUS_PULANG: { value: StatusPulangKode; label: string; ringkas: string; tone: BadgeTone }[] = [
  { value: "1", label: "Atas persetujuan dokter", ringkas: "Persetujuan dokter", tone: "emerald" },
  { value: "3", label: "Atas permintaan sendiri", ringkas: "APS", tone: "amber" },
  { value: "4", label: "Meninggal", ringkas: "Meninggal", tone: "rose" },
  { value: "5", label: "Lain-lain", ringkas: "Lain-lain", tone: "slate" },
];

export function statusPulangMeta(kode: string | null | undefined) {
  return STATUS_PULANG.find((s) => s.value === kode) ?? null;
}

// ── Tanggal lokal (dipindah ke sepShared; diekspor ulang agar impor lama tetap jalan) ──

export { hariIniISO, selisihHari };

export function labelLamaRawat(hari: number | null): string | null {
  if (hari === null || hari < 0) return null;
  return hari === 0 ? "Pulang di hari SEP terbit" : `${hari} hari sejak SEP terbit`;
}

// ── Kelayakan SEP untuk diperbarui ─────────────────────────

export type Kelayakan = { ok: true } | { ok: false; tone: "amber" | "rose"; judul: string; alasan: string };

export function kelayakanUpdate(sep: SEPRecordExt): Kelayakan {
  if (sep.statusInternal === "Deleted") {
    return { ok: false, tone: "rose", judul: "SEP sudah dihapus", alasan: "SEP yang dihapus tidak bisa diberi tanggal pulang." };
  }
  if (!sepTerbuka(sep.statusInternal)) {
    return {
      ok: false,
      tone: "amber",
      judul: "SEP sudah ditutup",
      alasan: "SEP yang ditutup sudah punya data klaim, jadi tanggal pulangnya tidak bisa diubah dari sini.",
    };
  }
  if (sep.jnsPelayanan !== "1") {
    return {
      ok: false,
      tone: "amber",
      judul: "Bukan SEP rawat inap",
      alasan: "Tanggal pulang hanya diisi untuk SEP rawat inap. SEP rawat jalan selesai di hari kunjungan.",
    };
  }
  return { ok: true };
}

export function sepKll(sep: SEPRecordExt): boolean {
  return Boolean(sep.jaminan && sep.jaminan.lakaLantas !== "0");
}

// ── Validasi isian ─────────────────────────────────────────

export interface IsianPulang {
  tglPulang: string;
  status: StatusPulangKode;
  noSurat: string;
  tglMeninggal: string;
  noLP: string;
}

export type KolomPulang = "tglPulang" | "noSurat" | "tglMeninggal" | "noLP";

/** Pesan galat per kolom (semua; tampil atau tidaknya diatur form). Urutan = urutan fokus. */
export function validasiPulang(isian: IsianPulang, sep: SEPRecordExt): Partial<Record<KolomPulang, string>> {
  const g: Partial<Record<KolomPulang, string>> = {};
  const hariIni = hariIniISO();
  const terbit = sep.tglTerbit;

  if (!isian.tglPulang) g.tglPulang = "Pilih tanggal pulang";
  else if (isian.tglPulang < terbit) g.tglPulang = `Tanggal pulang tidak boleh sebelum SEP terbit (${fmtTglPendek(terbit)})`;
  else if (isian.tglPulang > hariIni) g.tglPulang = "Tanggal pulang tidak boleh melewati hari ini";

  if (isian.status === "4") {
    if (!isian.noSurat.trim()) g.noSurat = "Isi nomor surat keterangan kematian";
    if (!isian.tglMeninggal) g.tglMeninggal = "Pilih tanggal meninggal";
    else if (isian.tglMeninggal < terbit) g.tglMeninggal = "Tanggal meninggal tidak boleh sebelum SEP terbit";
    else if (isian.tglPulang && isian.tglMeninggal > isian.tglPulang)
      g.tglMeninggal = "Tanggal meninggal tidak boleh setelah tanggal pulang";
  }

  if (sepKll(sep) && !isian.noLP.trim()) g.noLP = "Isi nomor laporan polisi (wajib untuk SEP kecelakaan lalu lintas)";

  return g;
}

export const URUTAN_KOLOM: KolomPulang[] = ["tglPulang", "noSurat", "tglMeninggal", "noLP"];

// ── Periode riwayat ────────────────────────────────────────

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export interface Periode {
  bulan: number; // 1–12
  tahun: number;
}

export function periodeIni(): Periode {
  const d = new Date();
  return { bulan: d.getMonth() + 1, tahun: d.getFullYear() };
}

export function geserPeriode(p: Periode, langkah: number): Periode {
  const d = new Date(p.tahun, p.bulan - 1 + langkah, 1);
  return { bulan: d.getMonth() + 1, tahun: d.getFullYear() };
}

export function samaPeriode(a: Periode, b: Periode): boolean {
  return a.bulan === b.bulan && a.tahun === b.tahun;
}

export function labelPeriode(p: Periode): string {
  return `${NAMA_BULAN[p.bulan - 1]} ${p.tahun}`;
}
