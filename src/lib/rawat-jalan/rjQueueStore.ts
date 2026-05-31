// ANT-RJ — rjQueueStore: sumbu Antrean-Poli (terpisah dari RJStatus klinis) + lock encounter.
// Pola useSyncExternalStore + sessionStorage (seed-if-empty, deterministik → SSR-safe).
//
//   Order_Masuk ─(Panggil⇒T4)→ Dipanggil ─(Terima)→ Dilayani ─(Selesai⇒T5)→ Selesai
//        └─(Batal Kunjungan)→ Dikembalikan_Admisi
//
// Emit T4/T5 best-effort ke antreanStore via No. RM (lintas modul; antrean = hilir).

"use client";

import { useSyncExternalStore } from "react";
import { rjPatients } from "@/lib/data";
import { getAntreanByPasien, emitTask, setStatus } from "@/lib/antrean/antreanStore";

const STORAGE_KEY = "ehis.rj.queue.v1";

export type RJOrderStatus =
  | "Order_Masuk"
  | "Dipanggil"
  | "Dilayani"
  | "Selesai"
  | "Dikembalikan_Admisi";

export interface RJQueueEntry {
  id: string;
  noRM: string;
  order: RJOrderStatus;
  locked: boolean;
  selesaiAt?: number; // timestamp finalize pertama (immutable)
  recalls: number;
}

export interface OrderDef {
  label: string;
  badge: string;
  dot: string;
  border: string;
  active: string;
}

export const ORDER_CFG: Record<RJOrderStatus, OrderDef> = {
  Order_Masuk: {
    label: "Order Masuk",
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
  Dilayani: {
    label: "Dilayani",
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-400",
    border: "border-l-sky-400",
    active: "bg-sky-600 text-white border-sky-600",
  },
  Selesai: {
    label: "Selesai",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    active: "bg-emerald-600 text-white border-emerald-600",
  },
  Dikembalikan_Admisi: {
    label: "Dikembalikan ke Admisi",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-400",
    border: "border-l-rose-400",
    active: "bg-rose-500 text-white border-rose-500",
  },
};

export const ORDER_SEQUENCE: RJOrderStatus[] = [
  "Order_Masuk",
  "Dipanggil",
  "Dilayani",
  "Selesai",
  "Dikembalikan_Admisi",
];

// ── Seed (deterministik) ───────────────────────────────────

// Demo: sebagian pasien sengaja "belum dipanggil"/"belum diterima" agar board
// menampilkan tombol aksi. Sisanya dianggap sudah dilayani / selesai.
const SEED_ORDER: Record<string, RJOrderStatus> = {
  "rj-3": "Order_Masuk",
  "rj-10": "Order_Masuk",
  "rj-8": "Dipanggil",
};

function seed(): Record<string, RJQueueEntry> {
  const out: Record<string, RJQueueEntry> = {};
  for (const p of rjPatients) {
    const order: RJOrderStatus =
      SEED_ORDER[p.id] ?? (p.status === "Selesai" ? "Selesai" : "Dilayani");
    out[p.id] = {
      id: p.id,
      noRM: p.noRM,
      order,
      locked: order === "Selesai",
      recalls: 0,
    };
  }
  return out;
}

// ── Store ──────────────────────────────────────────────────

interface StoreState {
  byId: Record<string, RJQueueEntry>;
}

let state: StoreState = load();
let snapshot: StoreState = state;
const listeners = new Set<() => void>();

function load(): StoreState {
  if (typeof window === "undefined") return { byId: seed() };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<StoreState>;
      if (p.byId && Object.keys(p.byId).length > 0) return { byId: p.byId };
    }
  } catch {
    /* ignore */
  }
  return { byId: seed() };
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

function patch(id: string, fn: (e: RJQueueEntry) => RJQueueEntry) {
  const e = state.byId[id];
  if (!e) return;
  commit({ byId: { ...state.byId, [id]: fn(e) } });
}

/** Emit task ke antrean pasien (best-effort, by No. RM). Idempoten di engine. */
function emitToAntrean(noRM: string, taskid: 4 | 5) {
  const recs = getAntreanByPasien(noRM);
  if (!recs[0]) return;
  emitTask(recs[0].kodebooking, taskid);
  // T5 = selesai poli / mulai tunggu farmasi → pindahkan antrean ke loket farmasi.
  if (taskid === 5) setStatus(recs[0].kodebooking, "MenungguFarmasi");
}

// ── Aksi worklist ──────────────────────────────────────────

/** Panggil pasien ke poli → Dipanggil + emit T4. */
export function panggilPoli(id: string) {
  patch(id, (e) => {
    emitToAntrean(e.noRM, 4);
    return { ...e, order: "Dipanggil", recalls: 0 };
  });
}

/** Panggil ulang (pasien belum hadir di poli). Naikkan counter. */
export function panggilUlangPoli(id: string): number {
  let n = 0;
  patch(id, (e) => {
    n = e.recalls + 1;
    return { ...e, recalls: n };
  });
  return n;
}

/** Terima → Dilayani (masuk alur klinis). Hanya sah bila status Dipanggil. */
export function terimaPoli(id: string) {
  patch(id, (e) => (e.order === "Dipanggil" ? { ...e, order: "Dilayani" } : e));
}

/** Batal kunjungan → dikembalikan ke admisi (T99 ditunda). */
export function batalKunjungan(id: string) {
  patch(id, (e) => ({ ...e, order: "Dikembalikan_Admisi" }));
}

/**
 * Selesaikan pelayanan poli → Selesai + lock + emit T5.
 * `selesaiAt` di-set sekali (immutable walau di-reopen).
 */
export function selesaikanPoli(id: string) {
  patch(id, (e) => {
    emitToAntrean(e.noRM, 5);
    return { ...e, order: "Selesai", locked: true, selesaiAt: e.selesaiAt ?? Date.now() };
  });
}

/** Batalkan Selesai (re-open) → unlock, kembali Dilayani. `selesaiAt` dipertahankan. */
export function bukaKembaliPoli(id: string) {
  patch(id, (e) => ({ ...e, order: "Dilayani", locked: false }));
}

// ── Reads ──────────────────────────────────────────────────

export function getRJEntry(id: string): RJQueueEntry | undefined {
  return state.byId[id];
}

// ── Subscription / hook ────────────────────────────────────

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): StoreState {
  return snapshot;
}

// Snapshot deterministik untuk SSR + hidrasi (TIDAK baca sessionStorage) → cegah
// mismatch saat client punya state tersimpan. Setelah hidrasi, getSnapshot ambil alih.
const SEED_SNAPSHOT: StoreState = { byId: seed() };
function getServerSnapshot(): StoreState {
  return SEED_SNAPSHOT;
}

export function useRJQueue(): Record<string, RJQueueEntry> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).byId;
}
