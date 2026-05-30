// REG0.2 — registrationStore: lapisan persistensi client untuk pasien & kunjungan
// baru tanpa backend. Pola useSyncExternalStore + sessionStorage (sama seperti
// billingStore). Resolver (REG0.3) me-merge store ini dengan patientMasterData statis.

"use client";

import { useSyncExternalStore } from "react";
import type { PatientMaster, KunjunganRecord } from "@/lib/data";
import { patientMasterData } from "@/lib/data";
import type { NewPatientInput, PendaftaranKunjunganInput } from "./types";

const STORAGE_KEY = "ehis.registration.v1";

interface StoreState {
  // Pasien baru (tidak ada di seed patientMasterData), keyed by noRM.
  patients: Record<string, PatientMaster>;
  // Kunjungan baru — overlay untuk pasien seed MAUPUN baru, keyed by noRM.
  kunjungan: Record<string, KunjunganRecord[]>;
}

const EMPTY: StoreState = { patients: {}, kunjungan: {} };

let state: StoreState = load();
let snapshot: StoreState = state;
const listeners = new Set<() => void>();

// ── Persistence ────────────────────────────────────────────

function load(): StoreState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { patients: {}, kunjungan: {} };
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return { patients: parsed.patients ?? {}, kunjungan: parsed.kunjungan ?? {} };
  } catch {
    return { patients: {}, kunjungan: {} };
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage penuh / diblokir — abaikan, state tetap di memori */
  }
}

function commit(next: StoreState) {
  state = next;
  snapshot = next; // referensi baru → useSyncExternalStore re-render
  persist();
  listeners.forEach((l) => l());
}

// ── Helpers ────────────────────────────────────────────────

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** ISO yyyy-mm-dd → "DD Month YYYY" (id). Non-ISO dikembalikan apa adanya. */
function formatTanggalID(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${parseInt(d, 10)} ${MONTHS_ID[parseInt(mo, 10) - 1]} ${y}`;
}

function ageFromISO(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const md = now.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < d.getDate())) age--;
  return Math.max(0, age);
}

function todayID(): string {
  return new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/** noRM unik: RM-<tahun>-<seq 3 digit>, max+1 dari seed + store. */
function generateNoRM(): string {
  const year = new Date().getFullYear();
  const prefix = `RM-${year}-`;
  const keys = [...Object.keys(patientMasterData), ...Object.keys(state.patients)];
  let max = 0;
  for (const k of keys) {
    if (k.startsWith(prefix)) {
      const n = parseInt(k.slice(prefix.length), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function generateNoPendaftaran(): string {
  const now = new Date();
  const ym = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const seq = String(Math.floor(Math.random() * 90000) + 10000);
  return `REG-${ym.replace("/", "-")}-${seq}`;
}

const UNIT_PREFIX: Record<PendaftaranKunjunganInput["unit"], string> = {
  "IGD": "IGD",
  "Rawat Jalan": "RJ",
  "Rawat Inap": "RI",
};

function generateNoKunjungan(unit: PendaftaranKunjunganInput["unit"]): string {
  const now = new Date();
  const ym = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `${UNIT_PREFIX[unit]}/${ym}/${seq}`;
}

// ── Mutations ──────────────────────────────────────────────

/** Buat pasien baru → simpan ke store → kembalikan PatientMaster lengkap. */
export function addPatient(input: NewPatientInput): PatientMaster {
  const noRM = generateNoRM();
  const patient: PatientMaster = {
    id: noRM,
    noRM,
    nik: input.nik,
    name: input.name,
    age: ageFromISO(input.tanggalLahir),
    gender: input.gender,
    golonganDarah: input.golonganDarah ?? "-",
    tempatLahir: input.tempatLahir,
    tanggalLahir: formatTanggalID(input.tanggalLahir),
    statusPerkawinan: input.statusPerkawinan ?? "Belum Menikah",
    agama: input.agama ?? "",
    pekerjaan: input.pekerjaan ?? "",
    pendidikan: input.pendidikan ?? "",
    suku: input.suku ?? "",
    kewarganegaraan: input.kewarganegaraan ?? "WNI",
    alamat: input.alamat,
    kelurahan: input.kelurahan ?? "",
    kecamatan: input.kecamatan ?? "",
    kota: input.kota,
    provinsi: input.provinsi,
    kodePos: input.kodePos ?? "",
    noHp: input.noHp,
    email: input.email,
    alergi: input.alergi ?? [],
    penjamin: input.penjamin ?? { tipe: "Umum", nama: "Umum / Mandiri" },
    kontakDarurat: input.kontakDarurat,
    riwayatKunjungan: [],
    billing: [],
    terdaftar: todayID(),
  };
  commit({ ...state, patients: { ...state.patients, [noRM]: patient } });
  return patient;
}

/** Buat kunjungan baru untuk pasien (seed maupun baru) → overlay di store. */
export function addKunjungan(noRM: string, input: PendaftaranKunjunganInput): KunjunganRecord {
  const id = `kreg-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const kunjungan: KunjunganRecord = {
    id,
    noPendaftaran: generateNoPendaftaran(),
    noKunjungan: generateNoKunjungan(input.unit),
    tanggal: input.tanggal ?? todayID(),
    unit: input.unit,
    dokter: input.dokter,
    keluhan: input.keluhan,
    diagnosa: input.diagnosa ?? "",
    penjamin: input.penjamin,
    noPenjamin: input.noPenjamin,
    noSEP: input.noSEP,
    kodeICD: input.kodeICD,
    caraMasuk: input.caraMasuk,
    status: "Aktif",
    detailPath: `/ehis-registration/pasien/${encodeURIComponent(noRM)}/kunjungan/${id}`,
  };
  const list = state.kunjungan[noRM] ?? [];
  commit({ ...state, kunjungan: { ...state.kunjungan, [noRM]: [kunjungan, ...list] } });
  return kunjungan;
}

// ── Reads (resolver dipakai REG0.3) ────────────────────────

/** PatientMaster ter-merge: base (store-baru atau seed) + kunjungan overlay. */
export function getMergedPatient(noRM: string): PatientMaster | undefined {
  const base = state.patients[noRM] ?? patientMasterData[noRM];
  if (!base) return undefined;
  const overlay = state.kunjungan[noRM];
  if (!overlay?.length) return base;
  return { ...base, riwayatKunjungan: [...overlay, ...base.riwayatKunjungan] };
}

export function getMergedKunjungan(noRM: string, kunjunganId: string): KunjunganRecord | undefined {
  return getMergedPatient(noRM)?.riwayatKunjungan.find((k) => k.id === kunjunganId);
}

/** Semua pasien (seed + baru) — untuk daftar/board. Pasien baru di depan. */
export function getAllMergedPatients(): PatientMaster[] {
  const newOnes = Object.keys(state.patients).map((rm) => getMergedPatient(rm)!);
  const seeds = Object.keys(patientMasterData)
    .filter((rm) => !state.patients[rm])
    .map((rm) => getMergedPatient(rm)!);
  return [...newOnes, ...seeds];
}

// ── Subscription / hooks ───────────────────────────────────

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): StoreState {
  return snapshot;
}

function getServerSnapshot(): StoreState {
  return EMPTY;
}

/** Hook reaktif — re-render saat store berubah. */
export function useRegistrationStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
