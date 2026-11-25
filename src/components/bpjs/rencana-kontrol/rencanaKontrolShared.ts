// Helper modul Rencana Kontrol (V-Claim): jenis surat, jadwal relatif hari ini, validasi form,
// ringkas poli/diagnosa, dan data uji mock. Kode jenis WIRE V-Claim: "1" = SPRI (surat perintah
// rawat inap, pakai No. kartu), "2" = Rencana kontrol (pakai No. SEP asal + formulir PRB).
// Warna badge mengikuti peta bersama (bpjs/shared/badge): sky = rencana kontrol (rawat jalan),
// cyan = SPRI (rawat inap), amber = jadwal hari ini (perlu perhatian), emerald = masih terjadwal
// / SEP sudah terbit, slate = lewat / netral, rose = dihapus.

import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { geserHari, parseTgl, selisihHari } from "@/components/bpjs/shared/tanggal";
import type { RKListPeriodeItem } from "@/lib/bpjs/bpjsShared";

export type JenisSurat = "kontrol" | "spri";

/** Baris daftar surat: item periode V-Claim (+ status SEP bila dimuat per No. kartu). */
export type BarisSurat = RKListPeriodeItem & { terbitSEP?: "Sudah" | "Belum" };

/** Tanggal dengan nama hari, mis. "Rabu, 10 Juni 2026". */
export function fmtTglHari(iso: string): string {
  const d = parseTgl(iso);
  return d ? d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—";
}
export type KodeJenisKontrol = "1" | "2";

/** `label` untuk awal kalimat/badge, `sebutan` untuk di tengah kalimat (singkatan SPRI tetap kapital). */
export const JENIS_SURAT: Record<JenisSurat, { kode: KodeJenisKontrol; label: string; sebutan: string; tone: BadgeTone; layanan: string }> = {
  kontrol: { kode: "2", label: "Rencana kontrol", sebutan: "rencana kontrol", tone: "sky", layanan: "Rawat jalan" },
  spri: { kode: "1", label: "SPRI", sebutan: "SPRI", tone: "cyan", layanan: "Rawat inap" },
};

export function jenisDariKode(kode: string): JenisSurat {
  return kode === "1" ? "spri" : "kontrol";
}

/** Jadwal relatif hari ini: hari ini (amber), terjadwal (emerald), lewat (slate). */
export function jadwalSurat(tgl: string, hariIni: string): { label: string; tone: BadgeTone } {
  const n = selisihHari(hariIni, tgl);
  if (n === null) return { label: "Tanggal tidak valid", tone: "slate" };
  if (n === 0) return { label: "Hari ini", tone: "amber" };
  if (n === 1) return { label: "Besok", tone: "emerald" };
  if (n > 1) return { label: `${n} hari lagi`, tone: "emerald" };
  return { label: `Lewat ${-n} hari`, tone: "slate" };
}

/** "INT - Penyakit Dalam" → { kode, nama } (format poli/diagnosa V-Claim). */
export function pisahKodeNama(s: string): { kode: string; nama: string } {
  const i = s.indexOf(" - ");
  if (i <= 0) return { kode: s.trim(), nama: "" };
  const kode = s.slice(0, i).trim();
  const nama = s.slice(i + 3).trim();
  return { kode, nama: nama === kode ? "" : nama };
}

// ── Validasi ──────────────────────────────────────────────

export function validasiSep(s: string): string | null {
  if (!s) return "Isi No. SEP asal kunjungan";
  if (s.length < 10) return "No. SEP terlalu pendek, periksa lagi";
  return null;
}

export function validasiTglRencana(tgl: string, hariIni: string): string | null {
  if (!tgl) return "Pilih tanggal rencana";
  if (tgl < hariIni) return "Tanggal rencana tidak boleh sebelum hari ini";
  return null;
}

/** Tanggal rencana awal untuk surat baru: seminggu dari hari ini. */
export function tglRencanaAwal(hariIni: string): string {
  return geserHari(hariIni, 7);
}

// ── Lintas tab ────────────────────────────────────────────

/** Permintaan ubah surat dari daftar: `n` naik tiap klik agar surat yang sama dimuat ulang. */
export interface UbahSurat {
  noSurat: string;
  noKartu: string;
  nama: string;
  n: number;
}

// ── Data uji (mock) ───────────────────────────────────────

/** Periode dengan data terbanyak di mock rencana kontrol + SPRI. */
export const PERIODE_UJI = { bulan: 6, tahun: 2026 } as const;

export const UJI_SEP = [
  { no: "SEP-2026-0510-00033", nama: "Endang Pertiwi", ket: "rawat jalan" },
  { no: "SEP-2026-0512-00040", nama: "Rini Kusumawati", ket: "poli mata" },
  { no: "SEP-2026-0501-00012", nama: "Joko Prasetyo", ket: "rawat inap" },
] as const;

export const UJI_KARTU = [
  { kartu: "0001234567891", nama: "Joko Prasetyo", ket: "aktif" },
  { kartu: "0001234567892", nama: "Siti Rahayu", ket: "aktif" },
  { kartu: "0001234567811", nama: "Ahmad Yusuf", ket: "non-aktif" },
] as const;
