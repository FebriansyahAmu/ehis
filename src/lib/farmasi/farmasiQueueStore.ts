// T6/T7 — farmasiQueueStore: sumbu Antrean-Farmasi (proyeksi dari antreanStore).
// Pola: membership + penyelesaian task = state ASLI di antreanStore (T5 done → masuk
// antrean farmasi; T6 mulai siapkan; T7 obat selesai/diserahkan). Hanya sub-state
// "panggil/recall" (tanpa TaskID) yang disimpan lokal — analog Dipanggil di ANT-RJ.
//
//   Menunggu_Farmasi ─(Panggil)→ Dipanggil ─(Mulai Siapkan⇒T6)→ Disiapkan ─(Serahkan⇒T7)→ Selesai
//
// Emit T6/T7 lewat antreanStore.emitTask(kodebooking, …) — guard urutan menjamin
// T5 harus sudah ada (dipenuhi oleh syarat membership).

"use client";

import { useSyncExternalStore } from "react";
import {
  useAntreanStore,
  emitTask,
  setStatus,
  getAntreanByPasien,
} from "@/lib/antrean/antreanStore";
import type { AntreanRecord, CaraBayar, TaskId } from "@/lib/antrean/types";

const STORAGE_KEY = "ehis.farmasi.queue.v1";

export type FarmasiQueueStatus =
  | "Menunggu_Farmasi"
  | "Dipanggil"
  | "Disiapkan"
  | "Selesai";

export interface FarmasiQueueEntry {
  kodebooking: string;
  noRM?: string;
  nama: string;
  poli: string;
  dokter: string;
  nomorAntrean: string;
  caraBayar: CaraBayar;
  status: FarmasiQueueStatus;
  recalls: number;
  t5At?: number;
  t6At?: number;
  t7At?: number;
}

export interface QueueDef {
  label: string;
  badge: string;
  dot: string;
  border: string;
  active: string;
}

export const FARMASI_QUEUE_CFG: Record<FarmasiQueueStatus, QueueDef> = {
  Menunggu_Farmasi: {
    label: "Menunggu Farmasi",
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    border: "border-l-slate-300",
    active: "bg-slate-700 text-white border-slate-700",
  },
  Dipanggil: {
    label: "Dipanggil",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
    border: "border-l-amber-400",
    active: "bg-amber-500 text-white border-amber-500",
  },
  Disiapkan: {
    label: "Sedang Disiapkan",
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-400",
    border: "border-l-sky-400",
    active: "bg-sky-600 text-white border-sky-600",
  },
  Selesai: {
    label: "Obat Diserahkan",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    active: "bg-emerald-600 text-white border-emerald-600",
  },
};

export const FARMASI_QUEUE_SEQUENCE: FarmasiQueueStatus[] = [
  "Menunggu_Farmasi",
  "Dipanggil",
  "Disiapkan",
  "Selesai",
];

// ── Sub-state panggil/recall (lokal, tanpa TaskID) ─────────

interface CallEntry {
  dipanggil: boolean;
  recalls: number;
}
interface CallState {
  byKode: Record<string, CallEntry>;
}

const EMPTY: CallState = { byKode: {} };

let state: CallState = load();
let snapshot: CallState = state;
const listeners = new Set<() => void>();

function load(): CallState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<CallState>;
      if (p.byKode) return { byKode: p.byKode };
    }
  } catch {
    /* ignore */
  }
  return { byKode: {} };
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function commit(next: CallState) {
  state = next;
  snapshot = next;
  persist();
  listeners.forEach((l) => l());
}

function setCall(kodebooking: string, fn: (c: CallEntry | undefined) => CallEntry) {
  const next = fn(state.byKode[kodebooking]);
  commit({ byKode: { ...state.byKode, [kodebooking]: next } });
}

// ── Helpers ────────────────────────────────────────────────

function hasTask(rec: AntreanRecord, id: TaskId): boolean {
  return rec.tasks.some((t) => t.taskid === id);
}

function taskWaktu(rec: AntreanRecord, id: TaskId): number | undefined {
  return rec.tasks.find((t) => t.taskid === id)?.waktu;
}

function deriveStatus(rec: AntreanRecord, call?: CallEntry): FarmasiQueueStatus {
  if (hasTask(rec, 7)) return "Selesai";
  if (hasTask(rec, 6)) return "Disiapkan";
  if (call?.dipanggil) return "Dipanggil";
  return "Menunggu_Farmasi";
}

/**
 * Apakah record ini MASUK antrean farmasi. Syarat: pasien benar-benar memasuki tahap
 * farmasi — status `MenungguFarmasi` (selesai poli + ada resep) ATAU sudah menerima
 * task farmasi (T6/T7). Pasien yang selesai poli TANPA resep (T5 → langsung `Selesai`,
 * tanpa T6/T7) TIDAK masuk antrean farmasi.
 */
function inFarmasiQueue(rec: AntreanRecord): boolean {
  if (rec.status === "Batal" || rec.status === "TidakHadir") return false;
  return rec.status === "MenungguFarmasi" || hasTask(rec, 6) || hasTask(rec, 7);
}

function toEntry(rec: AntreanRecord, call?: CallEntry): FarmasiQueueEntry {
  return {
    kodebooking: rec.kodebooking,
    noRM: rec.pasien.noRM,
    nama: rec.pasien.nama,
    poli: rec.poli,
    dokter: rec.dokter,
    nomorAntrean: rec.nomorAntrean,
    caraBayar: rec.caraBayar,
    status: deriveStatus(rec, call),
    recalls: call?.recalls ?? 0,
    t5At: taskWaktu(rec, 5),
    t6At: taskWaktu(rec, 6),
    t7At: taskWaktu(rec, 7),
  };
}

// ── Aksi worklist ──────────────────────────────────────────

/** Panggil pasien ke loket farmasi (tanpa TaskID; recall reset). */
export function panggilFarmasi(kodebooking: string) {
  setCall(kodebooking, () => ({ dipanggil: true, recalls: 0 }));
}

/** Panggil ulang (pasien belum hadir di loket farmasi). Naikkan counter. */
export function panggilUlangFarmasi(kodebooking: string): number {
  let n = 0;
  setCall(kodebooking, (c) => {
    n = (c?.recalls ?? 0) + 1;
    return { dipanggil: true, recalls: n };
  });
  return n;
}

/**
 * Emit T6/T7 dari WORKLIST farmasi (telaah/serah terima) ke antrean — by No. RM.
 * T6 = telaah disetujui (mulai layan farmasi) · T7 = obat diserahkan (serah terima).
 * Best-effort: hanya untuk pasien yang punya antrean di tahap farmasi (T5 done, T7 belum).
 * Order IGD/RI tanpa antrean RJ → no-op. Guard urutan dijamin engine emitTask.
 */
export function emitFarmasiTask(noRM: string | undefined, taskid: 6 | 7): boolean {
  if (!noRM) return false;
  const rec = getAntreanByPasien(noRM).find(
    (r) =>
      hasTask(r, 5) &&
      !hasTask(r, 7) &&
      r.status !== "Batal" &&
      r.status !== "TidakHadir",
  );
  if (!rec) return false;
  const log = emitTask(rec.kodebooking, taskid);
  if (taskid === 7 && log) setStatus(rec.kodebooking, "Selesai");
  return !!log;
}

// ── Subscription / hook ────────────────────────────────────

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): CallState {
  return snapshot;
}

function getServerSnapshot(): CallState {
  return EMPTY;
}

function useCallState(): CallState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Antrean farmasi reaktif — proyeksi antreanStore + sub-state panggil lokal. */
export function useFarmasiQueue(): FarmasiQueueEntry[] {
  const ant = useAntreanStore();
  const calls = useCallState();
  return Object.values(ant.byKode)
    .filter(inFarmasiQueue)
    .map((rec) => toEntry(rec, calls.byKode[rec.kodebooking]))
    .sort((a, b) => (a.t5At ?? 0) - (b.t5At ?? 0));
}
