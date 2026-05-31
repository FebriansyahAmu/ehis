// Master — Jadwal Dokter: SINGLE SOURCE jadwal praktik + kapasitas/kuota per hari.
// Mock-first (tarik via HFIS = simulasi). Pola useSyncExternalStore + sessionStorage.
// Consumer: Antrean (estimasi jam + kuota kiosk) & RJ. Saat backend ready → swap seed
// ke WS HFIS (referensi jadwal) + tabel `jadwal_dokter` / `jadwal_slot`.
//
// Kode dokter/poli sengaja selaras dengan antrean (`onsiteMock`) agar consume 1:1,
// tetapi seed didefinisikan di sini (master = hulu; tidak mengimpor modul antrean).

"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ehis.master.jadwalDokter.v1";

export type Hari = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu";

export const HARI_ALL: Hari[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export type JadwalStatus = "Aktif" | "Cuti" | "Nonaktif";
export type JadwalSumber = "HFIS" | "Manual";

export interface JadwalSlot {
  id: string;
  hari: Hari;
  jamMulai: string; // "08:00"
  jamSelesai: string; // "12:00"
  kuotaJKN: number;
  kuotaNonJKN: number;
  menitPerPasien: number;
}

export interface JadwalDokter {
  dokterKode: string;
  dokterNama: string;
  poliKode: string;
  poliNama: string;
  spesialis: string;
  status: JadwalStatus;
  sumber: JadwalSumber;
  syncedAt?: number;
  slots: JadwalSlot[];
}

// ── Seed ───────────────────────────────────────────────────

interface SeedSpec {
  dokterKode: string;
  dokterNama: string;
  poliKode: string;
  poliNama: string;
  spesialis: string;
  jamMulai: string;
  jamSelesai: string;
  kuotaJKN: number;
  kuotaNonJKN: number;
  menitPerPasien: number;
  hari: Hari[];
}

const SEED_SPECS: SeedSpec[] = [
  { dokterKode: "D-UMU-1", dokterNama: "dr. Rini Kusuma", poliKode: "UMU", poliNama: "Poli Umum", spesialis: "Umum", jamMulai: "08:00", jamSelesai: "14:00", kuotaJKN: 40, kuotaNonJKN: 20, menitPerPasien: 8, hari: ["Senin", "Rabu", "Jumat"] },
  { dokterKode: "D-UMU-2", dokterNama: "dr. Tono Wijaya", poliKode: "UMU", poliNama: "Poli Umum", spesialis: "Umum", jamMulai: "13:00", jamSelesai: "19:00", kuotaJKN: 40, kuotaNonJKN: 20, menitPerPasien: 8, hari: ["Selasa", "Kamis", "Sabtu"] },
  { dokterKode: "D-INT-1", dokterNama: "dr. Anisa Putri, Sp.PD", poliKode: "INT", poliNama: "Penyakit Dalam", spesialis: "Sp.PD", jamMulai: "08:00", jamSelesai: "12:00", kuotaJKN: 25, kuotaNonJKN: 10, menitPerPasien: 12, hari: ["Senin", "Selasa", "Kamis"] },
  { dokterKode: "D-INT-2", dokterNama: "dr. Yudi Santosa, Sp.PD", poliKode: "INT", poliNama: "Penyakit Dalam", spesialis: "Sp.PD", jamMulai: "10:00", jamSelesai: "15:00", kuotaJKN: 25, kuotaNonJKN: 10, menitPerPasien: 12, hari: ["Rabu", "Jumat"] },
  { dokterKode: "D-JAN-1", dokterNama: "dr. Dewi Kusuma, Sp.JP", poliKode: "JAN", poliNama: "Jantung", spesialis: "Sp.JP", jamMulai: "08:00", jamSelesai: "12:00", kuotaJKN: 20, kuotaNonJKN: 8, menitPerPasien: 15, hari: ["Senin", "Rabu"] },
  { dokterKode: "D-JAN-2", dokterNama: "dr. Ahmad Fauzi, Sp.JP", poliKode: "JAN", poliNama: "Jantung", spesialis: "Sp.JP", jamMulai: "13:00", jamSelesai: "17:00", kuotaJKN: 20, kuotaNonJKN: 8, menitPerPasien: 15, hari: ["Selasa", "Kamis"] },
  { dokterKode: "D-PAR-1", dokterNama: "dr. Susanto, Sp.P", poliKode: "PAR", poliNama: "Paru", spesialis: "Sp.P", jamMulai: "09:00", jamSelesai: "14:00", kuotaJKN: 20, kuotaNonJKN: 8, menitPerPasien: 12, hari: ["Senin", "Kamis"] },
  { dokterKode: "D-BED-1", dokterNama: "dr. Indra Kurniawan, Sp.B", poliKode: "BED", poliNama: "Bedah", spesialis: "Sp.B", jamMulai: "08:00", jamSelesai: "12:00", kuotaJKN: 18, kuotaNonJKN: 8, menitPerPasien: 14, hari: ["Selasa", "Jumat"] },
  { dokterKode: "D-SAR-1", dokterNama: "dr. Budi Hartono, Sp.S", poliKode: "SAR", poliNama: "Saraf", spesialis: "Sp.S", jamMulai: "10:00", jamSelesai: "15:00", kuotaJKN: 18, kuotaNonJKN: 6, menitPerPasien: 14, hari: ["Rabu", "Sabtu"] },
  { dokterKode: "D-ANA-1", dokterNama: "dr. Maya Sari, Sp.A", poliKode: "ANA", poliNama: "Anak", spesialis: "Sp.A", jamMulai: "08:00", jamSelesai: "13:00", kuotaJKN: 30, kuotaNonJKN: 15, menitPerPasien: 10, hari: ["Selasa", "Kamis", "Sabtu"] },
  { dokterKode: "D-THT-1", dokterNama: "dr. Reza Pratama, Sp.THT-KL", poliKode: "THT", poliNama: "THT-KL", spesialis: "Sp.THT-KL", jamMulai: "09:00", jamSelesai: "13:00", kuotaJKN: 18, kuotaNonJKN: 8, menitPerPasien: 12, hari: ["Senin", "Rabu"] },
  { dokterKode: "D-MAT-1", dokterNama: "dr. Lestari Wulandari, Sp.M", poliKode: "MAT", poliNama: "Mata", spesialis: "Sp.M", jamMulai: "08:00", jamSelesai: "12:00", kuotaJKN: 20, kuotaNonJKN: 8, menitPerPasien: 12, hari: ["Selasa", "Jumat"] },
  { dokterKode: "D-ORT-1", dokterNama: "dr. Galih Permana, Sp.OT", poliKode: "ORT", poliNama: "Ortopedi", spesialis: "Sp.OT", jamMulai: "13:00", jamSelesai: "17:00", kuotaJKN: 16, kuotaNonJKN: 6, menitPerPasien: 15, hari: ["Rabu", "Jumat"] },
  { dokterKode: "D-GIG-1", dokterNama: "drg. Putri Andini", poliKode: "GIG", poliNama: "Gigi & Mulut", spesialis: "drg.", jamMulai: "08:00", jamSelesai: "14:00", kuotaJKN: 16, kuotaNonJKN: 10, menitPerPasien: 20, hari: ["Senin", "Kamis"] },
  { dokterKode: "D-OBG-1", dokterNama: "dr. Sinta Maharani, Sp.OG", poliKode: "OBG", poliNama: "Obstetri & Ginekologi", spesialis: "Sp.OG", jamMulai: "09:00", jamSelesai: "14:00", kuotaJKN: 18, kuotaNonJKN: 8, menitPerPasien: 15, hari: ["Selasa", "Jumat"] },
];

function slotId(dokterKode: string, hari: Hari): string {
  return `${dokterKode}-${hari}`;
}

function seed(): JadwalDokter[] {
  const now = Date.now();
  return SEED_SPECS.map((s) => ({
    dokterKode: s.dokterKode,
    dokterNama: s.dokterNama,
    poliKode: s.poliKode,
    poliNama: s.poliNama,
    spesialis: s.spesialis,
    status: "Aktif" as JadwalStatus,
    sumber: "HFIS" as JadwalSumber,
    syncedAt: now,
    slots: s.hari.map((hari) => ({
      id: slotId(s.dokterKode, hari),
      hari,
      jamMulai: s.jamMulai,
      jamSelesai: s.jamSelesai,
      kuotaJKN: s.kuotaJKN,
      kuotaNonJKN: s.kuotaNonJKN,
      menitPerPasien: s.menitPerPasien,
    })),
  }));
}

// ── Store ──────────────────────────────────────────────────

interface StoreState {
  jadwal: JadwalDokter[];
}

let state: StoreState = load();
let snapshot: StoreState = state;
const listeners = new Set<() => void>();

function load(): StoreState {
  if (typeof window === "undefined") return { jadwal: seed() };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<StoreState>;
      if (p.jadwal && p.jadwal.length > 0) return { jadwal: p.jadwal };
    }
  } catch {
    /* ignore */
  }
  return { jadwal: seed() };
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function commit(next: StoreState) {
  state = next;
  snapshot = next;
  persist();
  listeners.forEach((l) => l());
}

function patchDokter(dokterKode: string, fn: (d: JadwalDokter) => JadwalDokter) {
  commit({ jadwal: state.jadwal.map((d) => (d.dokterKode === dokterKode ? fn(d) : d)) });
}

// ── CRUD slot ──────────────────────────────────────────────

export interface SlotInput {
  jamMulai: string;
  jamSelesai: string;
  kuotaJKN: number;
  kuotaNonJKN: number;
  menitPerPasien: number;
}

/** Tambah/ubah slot satu hari untuk seorang dokter (upsert, 1 slot per hari). */
export function upsertSlot(dokterKode: string, hari: Hari, input: SlotInput) {
  patchDokter(dokterKode, (d) => {
    const exist = d.slots.find((s) => s.hari === hari);
    const slot: JadwalSlot = { id: exist?.id ?? slotId(dokterKode, hari), hari, ...input };
    const slots = exist
      ? d.slots.map((s) => (s.hari === hari ? slot : s))
      : [...d.slots, slot];
    return { ...d, slots, sumber: "Manual" };
  });
}

export function removeSlot(dokterKode: string, hari: Hari) {
  patchDokter(dokterKode, (d) => ({
    ...d,
    slots: d.slots.filter((s) => s.hari !== hari),
    sumber: "Manual",
  }));
}

export function setDokterStatus(dokterKode: string, status: JadwalStatus) {
  patchDokter(dokterKode, (d) => ({ ...d, status }));
}

/** Simulasi tarik ulang dari HFIS → reset ke seed + cap waktu sync. */
export function syncFromHFIS() {
  const now = Date.now();
  commit({ jadwal: seed().map((d) => ({ ...d, sumber: "HFIS", syncedAt: now })) });
}

export function resetJadwal() {
  commit({ jadwal: seed() });
}

// ── API consume (Antrean / RJ) ─────────────────────────────

const HARI_BY_INDEX: Hari[] = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** Nama hari dari tanggal ISO/Date-parsable. */
export function hariFromTanggal(tanggal: string | Date): Hari {
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  return HARI_BY_INDEX[d.getDay()];
}

export function getJadwalDokter(dokterKode: string): JadwalDokter | undefined {
  return state.jadwal.find((d) => d.dokterKode === dokterKode);
}

/** Slot seorang dokter pada hari tertentu (untuk estimasi jam antrean). */
export function getSlotFor(dokterKode: string, hari: Hari): JadwalSlot | undefined {
  return getJadwalDokter(dokterKode)?.slots.find((s) => s.hari === hari);
}

/**
 * Jadwal yang praktik pada tanggal tertentu, opsional filter poli/dokter.
 * Dipakai Antrean (daftar dokter tersedia + estimasi) & RJ.
 */
export function getJadwalDokterFor(opts: { tanggal?: string | Date; poliKode?: string; dokterKode?: string } = {}): {
  dokter: JadwalDokter;
  slot: JadwalSlot;
}[] {
  const hari = opts.tanggal ? hariFromTanggal(opts.tanggal) : undefined;
  const out: { dokter: JadwalDokter; slot: JadwalSlot }[] = [];
  for (const d of state.jadwal) {
    if (d.status !== "Aktif") continue;
    if (opts.poliKode && d.poliKode !== opts.poliKode) continue;
    if (opts.dokterKode && d.dokterKode !== opts.dokterKode) continue;
    for (const s of d.slots) {
      if (hari && s.hari !== hari) continue;
      out.push({ dokter: d, slot: s });
    }
  }
  return out;
}

// ── Subscription / hook ────────────────────────────────────

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): StoreState {
  return snapshot;
}

export function useJadwalDokter(): JadwalDokter[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).jadwal;
}
