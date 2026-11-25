// Helper modul Monitoring V-Claim (Kunjungan · Klaim · Histori pelayanan · Jasa Raharja): jenis
// pelayanan, status klaim, nominal rupiah, validasi histori (No. kartu 13 digit + periode ≤ 90
// hari), unduh CSV yang aman, dan data uji mock.
// Warna badge mengikuti peta bersama (bpjs/shared/badge): cyan = rawat inap, sky = rawat jalan,
// emerald = klaim layak / dijamin / terkirim, blue = proses verifikasi, amber = pending verifikasi
// (perlu tindak lanjut) & kecelakaan, rose = tidak dijamin / gagal kirim, slate = netral (kelas,
// diagnosa, INA-CBG).

import { KLAIM_MONITORING_STATUS_LABEL, type KlaimMonitoringStatusKode } from "@/lib/bpjs/bpjsShared";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { geserHari, selisihHari } from "@/components/bpjs/shared/tanggal";
import type { OpsiSegmen } from "@/components/bpjs/shared/vclaimUi";

// ── Jenis pelayanan ───────────────────────────────────────

export type KodeJenis = "1" | "2";
export type SaringJenis = "semua" | KodeJenis;

/** Terima kode ("1"/"2") maupun teks tampilan V-Claim ("R.Inap"/"R.Jalan"). */
export function jenisLayanan(v: string): { kode: KodeJenis; label: string; tone: BadgeTone } {
  return v === "1" || v === "R.Inap" ? { kode: "1", label: "Rawat inap", tone: "cyan" } : { kode: "2", label: "Rawat jalan", tone: "sky" };
}

export const OPSI_JENIS: readonly OpsiSegmen<KodeJenis>[] = [
  { value: "1", label: "Rawat inap" },
  { value: "2", label: "Rawat jalan" },
];

export function opsiSaringJenis(ri: number, rj: number): OpsiSegmen<SaringJenis>[] {
  return [
    { value: "semua", label: "Semua", jumlah: ri + rj },
    { value: "1", label: "Rawat inap", jumlah: ri },
    { value: "2", label: "Rawat jalan", jumlah: rj },
  ];
}

/** "3" → "Kelas 3"; teks yang sudah berawalan "Kelas" dibiarkan. */
export function labelKelas(k: string | null | undefined): string | null {
  if (!k) return null;
  return /^kelas/i.test(k) ? k : `Kelas ${k}`;
}

/** Lama rawat inap (hari, minimal 1); null bila tanggal tak valid. */
export function lamaRawat(masuk: string, pulang: string): number | null {
  const n = selisihHari(masuk, pulang);
  return n === null || n < 0 ? null : Math.max(1, n);
}

/** Diagnosa histori V-Claim = "KODE - Nama" → dipisah agar kode bisa jadi badge. */
export function pisahDiagnosa(s: string): { kode: string; nama: string } {
  const i = s.indexOf(" - ");
  if (i <= 0) return { kode: s.trim(), nama: "" };
  const kode = s.slice(0, i).trim();
  const nama = s.slice(i + 3).trim();
  return { kode, nama: nama === kode ? "" : nama };
}

// ── Status klaim ──────────────────────────────────────────

export interface StatusKlaim {
  kode: KlaimMonitoringStatusKode;
  label: string;
  tone: BadgeTone;
  ket: string;
}

export const STATUS_KLAIM: readonly StatusKlaim[] = [
  { kode: "1", label: "Proses verifikasi", tone: "blue", ket: "Sedang diverifikasi BPJS" },
  { kode: "2", label: "Pending verifikasi", tone: "amber", ket: "Ditunda verifikator, perlu tindak lanjut RS" },
  { kode: "3", label: "Klaim", tone: "emerald", ket: "Layak bayar, FPK terbit" },
];

/** Label status V-Claim ("Pending Verifikasi") → konfigurasi tampilan. */
export function statusKlaimDari(label: string): StatusKlaim {
  return (
    STATUS_KLAIM.find((s) => KLAIM_MONITORING_STATUS_LABEL[s.kode] === label) ?? {
      kode: "1",
      label,
      tone: "slate",
      ket: "",
    }
  );
}

// ── Nominal ───────────────────────────────────────────────

const RUPIAH = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

/** Nominal wire-format V-Claim (string) → angka; tak valid → 0. */
export function angka(v: string | number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function rupiah(v: string | number | null | undefined): string {
  return RUPIAH.format(angka(v));
}

export function persen(bagian: number, total: number): number | null {
  return total > 0 ? Math.round((bagian / total) * 100) : null;
}

// ── Validasi histori pelayanan ────────────────────────────

export const PANJANG_KARTU = 13;
export const MAKS_HARI = 90;
export const PRESET_HARI = [30, 60, 90] as const;

export function validasiKartu(k: string): string | null {
  if (!k) return "Isi No. kartu BPJS peserta";
  if (!/^\d+$/.test(k)) return "No. kartu hanya berisi angka";
  if (k.length !== PANJANG_KARTU) return `No. kartu harus ${PANJANG_KARTU} digit, baru ${k.length}`;
  return null;
}

export function validasiPeriode(mulai: string, akhir: string, hariIni: string): string | null {
  if (!mulai || !akhir) return "Pilih tanggal awal dan akhir periode";
  const n = selisihHari(mulai, akhir);
  if (n === null) return "Tanggal periode tidak valid";
  if (n < 0) return "Tanggal akhir harus sama dengan atau sesudah tanggal awal";
  if (akhir > hariIni) return "Tanggal akhir tidak boleh melewati hari ini";
  if (n > MAKS_HARI) return `Periode paling lama ${MAKS_HARI} hari, sekarang ${n} hari. Majukan tanggal awal.`;
  return null;
}

/** Periode `n` hari ke belakang sampai hari ini. */
export function periodeMundur(hariIni: string, n: number): { mulai: string; akhir: string } {
  return { mulai: geserHari(hariIni, -n), akhir: hariIni };
}

/**
 * Periode 90 hari di sekitar satu kunjungan (dibuka dari tab lain): berakhir 30 hari sesudah
 * tanggal acuan (dijepit ke hari ini) → riwayat sebelum & sesudah kunjungan itu ikut tampil.
 */
export function periodeSekitar(acuan: string, hariIni: string): { mulai: string; akhir: string } {
  const akhirMaks = geserHari(acuan, 30);
  const akhir = akhirMaks > hariIni ? hariIni : akhirMaks;
  return { mulai: geserHari(akhir, -MAKS_HARI), akhir };
}

/** Buka tab Histori pelayanan untuk satu peserta, dengan tanggal acuan kunjungan. */
export type BukaHistori = (kartu: string, acuan: string) => void;

// ── Unduh CSV ─────────────────────────────────────────────

/**
 * Sel CSV: diapit kutip ganda. Isi yang diawali = + - @ tab/CR diberi awalan ' agar tidak
 * dijalankan sebagai rumus saat dibuka di spreadsheet (CSV/formula injection — OWASP).
 */
function selCsv(v: string | number | null | undefined): string {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Unduh CSV UTF-8 (BOM agar Excel membaca huruf non-ASCII). */
export function unduhCsv(baris: readonly (readonly (string | number | null | undefined)[])[], namaBerkas: string): void {
  const isi = "﻿" + baris.map((r) => r.map(selCsv).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([isi], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = namaBerkas;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  // Dicabut sesudah unduhan dimulai (mencabut seketika bisa membatalkannya di sebagian peramban).
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Data uji (mock) ───────────────────────────────────────

/** Tanggal SEP yang punya data di mock kunjungan. */
export const UJI_KUNJUNGAN = [
  { tgl: "2026-05-10", ket: "inap + jalan" },
  { tgl: "2026-05-01", ket: "2 rawat inap" },
] as const;

/** Tanggal pulang + jenis yang punya data di mock klaim (satu status per tanggal). */
export const UJI_KLAIM = [
  { tgl: "2026-04-16", jenis: "1", ket: "Klaim" },
  { tgl: "2026-05-02", jenis: "1", ket: "Proses" },
  { tgl: "2026-05-10", jenis: "2", ket: "Pending" },
] as const satisfies readonly { tgl: string; jenis: KodeJenis; ket: string }[];

export const UJI_HISTORI = [
  { kartu: "0001234567891", nama: "Joko Prasetyo", ket: "2 rawat inap" },
  { kartu: "0001234567894", nama: "Endang Pertiwi", ket: "2 rawat jalan" },
  { kartu: "0001234567899", nama: "Hendra Pratama", ket: "inap + suplesi" },
] as const;

/** Periode histori yang mencakup seluruh mock (60 hari). */
export const PERIODE_UJI_HISTORI = { mulai: "2026-04-01", akhir: "2026-05-31" } as const;

/** Periode yang punya data di mock Jasa Raharja. */
export const PERIODE_UJI_JR = { bulan: 5, tahun: 2026 } as const;
