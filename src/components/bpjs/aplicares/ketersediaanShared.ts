// Helper halaman Ketersediaan Kamar (Aplicares POST /bed/update): baris ruang rawat + perubahan
// sesi, kesegaran laporan per ruangan (kapan terakhir DIKIRIM ke Aplicares, bukan kapan halaman
// dimuat), komposisi tempat tidur, validasi form laporan, dan jam yang berdetak untuk teks relatif.

import { useEffect, useState } from "react";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import type { AplicaresKamarRecord } from "@/lib/bpjs/bpjsShared";

/** Catatan tutup sementara yang dibuat di sesi ini (mock tidak menyimpan perubahan). */
export interface CatatanTutup {
  alasan: string;
  /** Instan ISO saat ruangan ditutup. */
  sejak: string;
  /** Tempat tidur tersedia sebelum ditutup — dipakai lagi saat dibuka kembali. */
  tersediaSebelum: number;
}

export type BarisRuang = AplicaresKamarRecord & { tutup?: CatatanTutup };

/** Nilai yang dilaporkan ke Aplicares (kapasitas tetap dari master ruangan). */
export interface NilaiLaporan {
  tersedia: number;
  tersediaPria?: number;
  tersediaWanita?: number;
  tersediaPriaWanita?: number;
}

export function nilaiSaatIni(r: BarisRuang): NilaiLaporan {
  return {
    tersedia: r.tersedia,
    tersediaPria: r.tersediaPria,
    tersediaWanita: r.tersediaWanita,
    tersediaPriaWanita: r.tersediaPriaWanita,
  };
}

// ── Komposisi tempat tidur ─────────────────────────────

/** Tempat tidur yang paling banyak bisa dilaporkan kosong: kapasitas dikurangi yang terisi. */
export function maksTersedia(r: AplicaresKamarRecord): number {
  return Math.max(r.kapasitas - r.terisi, 0);
}

/** Bagian kapasitas yang tidak terisi dan tidak dilaporkan tersedia (bed nonaktif/perawatan). */
export function tidakSiap(r: AplicaresKamarRecord): number {
  return Math.max(r.kapasitas - r.terisi - r.tersedia, 0);
}

/** Perkiraan tersedia saat ruangan dibuka kembali tanpa catatan sebelumnya. */
export function perkiraanTersedia(r: AplicaresKamarRecord): number {
  return Math.max(r.kapasitas - r.terisi - r.kosong, 0);
}

export type StatusRuang = "tutup" | "penuh" | "buka";

export function statusRuang(r: AplicaresKamarRecord): StatusRuang {
  if (r.flagMaintenance) return "tutup";
  return r.tersedia === 0 ? "penuh" : "buka";
}

/** Badge status (arti tetap): rose = tidak aktif, amber = perlu perhatian. */
export const LABEL_STATUS: Record<Exclude<StatusRuang, "buka">, { label: string; tone: BadgeTone }> = {
  tutup: { label: "Ditutup sementara", tone: "rose" },
  penuh: { label: "Penuh", tone: "amber" },
};

// ── Kesegaran laporan ──────────────────────────────────

/** Laporan dianggap terkini bila dikirim dalam 15 menit terakhir. */
export const BATAS_TERKINI_MENIT = 15;

export interface Kesegaran {
  terkini: boolean;
  tone: BadgeTone;
  label: string;
}

export function kesegaran(iso: string, sekarang: number): Kesegaran {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return { terkini: false, tone: "slate", label: "Belum pernah dikirim" };
  const menit = (sekarang - t) / 60_000;
  if (menit <= BATAS_TERKINI_MENIT) return { terkini: true, tone: "emerald", label: "Terkini" };
  if (menit <= 24 * 60) return { terkini: false, tone: "amber", label: "Perlu dikirim ulang" };
  return { terkini: false, tone: "rose", label: "Lebih dari sehari" };
}

const RELATIF = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });

/** Instan ISO → teks relatif terhadap `sekarang`, mis. "5 menit yang lalu", "kemarin". */
export function waktuRelatif(iso: string, sekarang: number): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const detik = Math.round((t - sekarang) / 1000);
  const abs = Math.abs(detik);
  if (abs < 60) return "baru saja";
  if (abs < 3_600) return RELATIF.format(Math.round(detik / 60), "minute");
  if (abs < 86_400) return RELATIF.format(Math.round(detik / 3_600), "hour");
  if (abs < 86_400 * 30) return RELATIF.format(Math.round(detik / 86_400), "day");
  if (abs < 86_400 * 365) return RELATIF.format(Math.round(detik / (86_400 * 30)), "month");
  return RELATIF.format(Math.round(detik / (86_400 * 365)), "year");
}

function jamSekarang(): number {
  return Date.now();
}

/** Jam yang berdetak (default 30 detik) agar teks relatif & kesegaran tetap benar. */
export function useSekarang(intervalMs = 30_000): number {
  const [t, setT] = useState(jamSekarang);
  useEffect(() => {
    const id = window.setInterval(() => setT(jamSekarang()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return t;
}

// ── Form laporan ───────────────────────────────────────

export type KolomLaporan = "tersedia" | "pria" | "wanita" | "campur";
export type TeksLaporan = Record<KolomLaporan, string>;
export const KOLOM_RINCI: readonly Exclude<KolomLaporan, "tersedia">[] = ["pria", "wanita", "campur"];

export const LABEL_RINCI: Record<Exclude<KolomLaporan, "tersedia">, string> = {
  pria: "Khusus laki-laki",
  wanita: "Khusus perempuan",
  campur: "Laki-laki atau perempuan",
};

export function teksAwal(r: BarisRuang): TeksLaporan {
  return {
    tersedia: String(r.tersedia),
    pria: r.tersediaPria?.toString() ?? "",
    wanita: r.tersediaWanita?.toString() ?? "",
    campur: r.tersediaPriaWanita?.toString() ?? "",
  };
}

const BILANGAN = /^\d+$/;

/** Galat per kolom; `rinci` = galat jumlah rincian (melekat ke ketiga kolom rincian). */
export function validasiLaporan(t: TeksLaporan, r: AplicaresKamarRecord): Partial<Record<KolomLaporan | "rinci", string>> {
  const g: Partial<Record<KolomLaporan | "rinci", string>> = {};
  const maks = maksTersedia(r);
  const s = t.tersedia.trim();
  if (!s) g.tersedia = "Isi jumlah tempat tidur tersedia";
  else if (!BILANGAN.test(s)) g.tersedia = "Isi dengan bilangan bulat, mis. 3";
  else if (Number(s) > maks) g.tersedia = `Paling banyak ${maks}: kapasitas ${r.kapasitas} dikurangi ${r.terisi} terisi`;

  const terisi = KOLOM_RINCI.filter((k) => t[k].trim() !== "");
  for (const k of terisi) {
    if (!BILANGAN.test(t[k].trim())) g[k] = "Isi dengan bilangan bulat";
  }
  if (terisi.length > 0 && !g.tersedia && terisi.every((k) => !g[k])) {
    const jumlah = terisi.reduce((n, k) => n + Number(t[k].trim()), 0);
    if (jumlah !== Number(s)) g.rinci = `Jumlah rincian (${jumlah}) harus sama dengan tempat tidur tersedia (${Number(s)})`;
  }
  return g;
}

/** Teks form yang sudah valid → nilai laporan (rincian kosong = tidak dikirim). */
export function keNilai(t: TeksLaporan): NilaiLaporan {
  const angka = (v: string) => (v.trim() === "" ? undefined : Number(v.trim()));
  const adaRinci = KOLOM_RINCI.some((k) => t[k].trim() !== "");
  return {
    tersedia: Number(t.tersedia.trim()),
    ...(adaRinci && {
      tersediaPria: angka(t.pria) ?? 0,
      tersediaWanita: angka(t.wanita) ?? 0,
      tersediaPriaWanita: angka(t.campur) ?? 0,
    }),
  };
}
