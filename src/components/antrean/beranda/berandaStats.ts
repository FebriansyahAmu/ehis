// Turunan data Beranda Antrean — murni (tanpa React), dihitung dari antreanStore.
// "Hari ini" = record yang `tanggal`-nya sama dengan tanggal lokal sekarang (format sama
// dengan todayID di antreanStore), bukan seluruh isi sesi.

import type { AntreanRecord, AntreanStatus, SumberAntrean } from "@/lib/antrean/types";

export function tanggalHariIni(): string {
  return new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function antreanHariIni(byKode: Record<string, AntreanRecord>): AntreanRecord[] {
  const hariIni = tanggalHariIni();
  return Object.values(byKode)
    .filter((a) => a.tanggal === hariIni)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ── Alur pasien ────────────────────────────────────────────

export type TahapKey = "belumHadir" | "admisi" | "poli" | "farmasi" | "selesai";

export interface Tahap {
  key: TahapKey;
  label: string;
  count: number;
  /** Rincian sub-status, mis. "1 menunggu · 1 dipanggil". */
  rincian: string;
}

function rincian(parts: [number, string][], kosong = "kosong"): string {
  const s = parts.filter(([n]) => n > 0).map(([n, l]) => `${n} ${l}`);
  return s.length ? s.join(" · ") : kosong;
}

/** Tahap tempat pasien benar-benar menunggu di RS — kandidat "terpadat". */
const TAHAP_DI_RS: TahapKey[] = ["admisi", "poli", "farmasi"];

export function hitungAlur(list: AntreanRecord[]) {
  const n = (s: AntreanStatus) => list.filter((a) => a.status === s).length;

  const tahap: Tahap[] = [
    { key: "belumHadir", label: "Belum hadir", count: n("Booked"), rincian: "booking belum check-in" },
    {
      key: "admisi",
      label: "Admisi",
      count: n("MenungguAdmisi") + n("DipanggilAdmisi") + n("DilayaniAdmisi"),
      rincian: rincian([[n("MenungguAdmisi"), "menunggu"], [n("DipanggilAdmisi"), "dipanggil"], [n("DilayaniAdmisi"), "dilayani"]]),
    },
    {
      key: "poli",
      label: "Poli",
      count: n("MenungguPoli") + n("DilayaniPoli"),
      rincian: rincian([[n("MenungguPoli"), "menunggu"], [n("DilayaniPoli"), "dilayani"]]),
    },
    { key: "farmasi", label: "Farmasi", count: n("MenungguFarmasi"), rincian: rincian([[n("MenungguFarmasi"), "menunggu obat"]]) },
    { key: "selesai", label: "Selesai", count: n("Selesai"), rincian: "pelayanan tuntas" },
  ];

  // Terpadat hanya bila satu tahap unggul jelas; seri di puncak = tidak ada yang ditandai.
  const diRs = tahap.filter((t) => TAHAP_DI_RS.includes(t.key) && t.count > 0).sort((a, b) => b.count - a.count);
  const terpadat = diRs.length > 0 && (diRs.length === 1 || diRs[0].count > diRs[1].count) ? diRs[0].key : null;

  return { tahap, batal: n("Batal") + n("TidakHadir"), terpadat };
}

// ── Sumber ─────────────────────────────────────────────────

export const SUMBER: { key: SumberAntrean; label: string }[] = [
  { key: "Onsite", label: "Kiosk APM (onsite)" },
  { key: "MJKN", label: "Mobile JKN" },
  { key: "Website", label: "Website RS" },
];

export function hitungSumber(list: AntreanRecord[]) {
  return SUMBER.map((s) => ({ ...s, count: list.filter((a) => a.sumber === s.key).length }));
}

// ── Ringkasan untuk navigasi cepat ─────────────────────────

/** Nomor terakhir yang diambil pasien di kiosk (sumber Onsite). */
export function strukTerakhir(list: AntreanRecord[]): AntreanRecord | null {
  return list.find((a) => a.sumber === "Onsite") ?? null;
}

export function ringkasNavigasi(list: AntreanRecord[]) {
  const dipanggil = list.filter((a) => a.status === "DipanggilAdmisi");
  return {
    menungguLoket: list.filter((a) => a.status === "MenungguAdmisi").length,
    taskBelumTerkirim: list.reduce((n, a) => n + a.tasks.filter((t) => t.kirim !== "terkirim").length, 0),
    dipanggil: dipanggil.map((a) => a.nomorAntrean),
  };
}
