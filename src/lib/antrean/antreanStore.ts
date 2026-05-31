// ANT1.2 + ANT1.3 — antreanStore: owner antrean + TaskID engine.
// Pola useSyncExternalStore + sessionStorage (sama seperti registrationStore).
// emitTask = state machine: idempoten + guard urutan (Baru/Lama) + clamp monoton + outbox (stub).

"use client";

import { useSyncExternalStore } from "react";
import {
  type AntreanRecord,
  type AntreanOnlineRef,
  type AntreanStatus,
  type CreateAntreanInput,
  type TaskId,
  type TaskLog,
  TASK_SEQUENCE,
} from "./types";

// v2: seed diperluas (pasien tahap farmasi SEED-FAR-101/102 + repoint SEED-MAT-002).
// Bump key → sesi lama yang ter-seed versi awal di-reset agar seed baru ter-load.
const STORAGE_KEY = "ehis.antrean.v2";

interface StoreState {
  byKode: Record<string, AntreanRecord>;
  counters: Record<string, number>; // nomor antrean per prefix poli
  seq: number;                       // urutan kodebooking harian
}

const EMPTY: StoreState = { byKode: {}, counters: {}, seq: 0 };

let state: StoreState = load();
let snapshot: StoreState = state;
const listeners = new Set<() => void>();

// ── Persistence ────────────────────────────────────────────

function load(): StoreState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<StoreState>;
      return { byKode: p.byKode ?? {}, counters: p.counters ?? {}, seq: p.seq ?? 0 };
    }
  } catch {
    /* ignore */
  }
  return { byKode: {}, counters: {}, seq: 0 };
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

function patchRecord(kodebooking: string, patch: Partial<AntreanRecord>) {
  const rec = state.byKode[kodebooking];
  if (!rec) return;
  commit({
    ...state,
    byKode: { ...state.byKode, [kodebooking]: { ...rec, ...patch } },
  });
}

// ── Helpers ────────────────────────────────────────────────

function todayID(): string {
  return new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function poliPrefix(input: CreateAntreanInput): string {
  const src = input.kodepoli || input.poli;
  const ch = src.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();
  return ch || "A";
}

function generateKodebooking(prefix: string, seq: number): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${ymd}${prefix}${String(seq).padStart(3, "0")}`;
}

// ── Create ─────────────────────────────────────────────────

export function createAntrean(input: CreateAntreanInput): AntreanRecord {
  const prefix = poliPrefix(input);
  const angka = (state.counters[prefix] ?? 0) + 1;
  const seq = state.seq + 1;
  const rec: AntreanRecord = {
    kodebooking: generateKodebooking(prefix, seq),
    tanggal: todayID(),
    jenisPasien: input.jenisPasien,
    sumber: input.sumber ?? "Onsite",
    caraBayar: input.caraBayar,
    pasien: input.pasien,
    noKartu: input.noKartu,
    noRujukan: input.noRujukan,
    kodepoli: input.kodepoli,
    poli: input.poli,
    kodedokter: input.kodedokter,
    dokter: input.dokter,
    nomorAntrean: `${prefix}-${angka}`,
    angkaAntrean: angka,
    estimasiDilayani: input.estimasiDilayani,
    status: "Booked",
    tasks: [],
    createdAt: Date.now(),
  };
  commit({
    byKode: { ...state.byKode, [rec.kodebooking]: rec },
    counters: { ...state.counters, [prefix]: angka },
    seq,
  });
  return rec;
}

/**
 * Seed antrean contoh — hanya bila store kosong (tak menimpa data nyata dari kiosk).
 * Dipakai board untuk menampilkan layout saat belum ada antrean. Idempoten.
 */
export function seedAntrean(records: AntreanRecord[]) {
  if (typeof window === "undefined") return;
  if (Object.keys(state.byKode).length > 0) return;
  const byKode: Record<string, AntreanRecord> = {};
  const counters: Record<string, number> = {};
  for (const r of records) {
    byKode[r.kodebooking] = r;
    const prefix = r.nomorAntrean.split("-")[0];
    counters[prefix] = Math.max(counters[prefix] ?? 0, r.angkaAntrean);
  }
  commit({ byKode, counters, seq: records.length });
}

// ── TaskID engine ──────────────────────────────────────────

/** TaskID berikutnya yang sah untuk record ini (null bila sudah selesai semua). */
export function nextExpectedTask(rec: AntreanRecord): TaskId | null {
  const emitted = new Set(rec.tasks.map((t) => t.taskid));
  const seq = TASK_SEQUENCE[rec.jenisPasien];
  return seq.find((id) => !emitted.has(id)) ?? null;
}

/**
 * Emit TaskID → outbox (push updatewaktu BPJS).
 * Guard: idempoten · urutan sah (Baru 1→7, Lama 3→7; 99 kapan saja) · monoton (clamp).
 * Mengembalikan TaskLog yang dibuat, atau null bila ditolak/skip.
 */
export function emitTask(kodebooking: string, taskid: TaskId, waktu: number = Date.now()): TaskLog | null {
  const rec = state.byKode[kodebooking];
  if (!rec) {
    console.warn(`[antrean] emitTask: kodebooking ${kodebooking} tidak ditemukan`);
    return null;
  }
  // Idempoten
  if (rec.tasks.some((t) => t.taskid === taskid)) return null;

  // Guard urutan (99 = terminal, boleh kapan saja)
  if (taskid !== 99) {
    const expected = nextExpectedTask(rec);
    if (taskid !== expected) {
      console.warn(`[antrean] emitTask: task ${taskid} out-of-order untuk ${kodebooking} (harusnya ${expected})`);
      return null;
    }
  }

  // Clamp monoton: waktu(Tn) ≥ waktu task terakhir + 1ms
  const last = rec.tasks.reduce((m, t) => Math.max(m, t.waktu), 0);
  const w = Math.max(waktu, last + 1);

  const task: TaskLog = { taskid, waktu: w, kirim: "pending", attempts: 0 };
  patchRecord(kodebooking, { tasks: [...rec.tasks, task] });

  // Outbox (stub) — backend: POST /antrean/task → updatewaktu (cons-id/secret).
  void sendToOutbox(kodebooking, taskid);
  return task;
}

/** Stub outbox: mock WS selalu sukses. Monitoring (ANT5) akan simulasikan gagal/retry. */
function sendToOutbox(kodebooking: string, taskid: TaskId) {
  const rec = state.byKode[kodebooking];
  if (!rec) return;
  patchRecord(kodebooking, {
    tasks: rec.tasks.map((t) =>
      t.taskid === taskid ? { ...t, kirim: "terkirim" as const, attempts: t.attempts + 1 } : t,
    ),
  });
}

// ── Convenience transitions ────────────────────────────────

export function setStatus(kodebooking: string, status: AntreanStatus) {
  patchRecord(kodebooking, { status });
}

/** Check-in (pasien hadir): Baru → T1 + MenungguAdmisi · Lama → T3 + MenungguPoli. */
export function checkin(kodebooking: string, waktu: number = Date.now()) {
  const rec = state.byKode[kodebooking];
  if (!rec) return;
  if (rec.jenisPasien === "Baru") {
    emitTask(kodebooking, 1, waktu);
    setStatus(kodebooking, "MenungguAdmisi");
  } else {
    emitTask(kodebooking, 3, waktu);
    setStatus(kodebooking, "MenungguPoli");
  }
}

/** Batal / no-show → T99. */
export function batalAntrean(kodebooking: string, alasan: "Batal" | "TidakHadir" = "Batal") {
  emitTask(kodebooking, 99);
  setStatus(kodebooking, alasan);
}

// ── Monitoring (ANT5) ──────────────────────────────────────

/**
 * Kirim ulang task ke outbox BPJS (perbaiki compliance bila WS sempat gagal).
 * Mock: selalu sukses → kirim "terkirim", attempts+1, error dibersihkan.
 */
export function resendTask(kodebooking: string, taskid: TaskId): boolean {
  const rec = state.byKode[kodebooking];
  if (!rec) return false;
  if (!rec.tasks.some((t) => t.taskid === taskid)) return false;
  patchRecord(kodebooking, {
    tasks: rec.tasks.map((t) =>
      t.taskid === taskid
        ? { ...t, kirim: "terkirim" as const, attempts: t.attempts + 1, error: undefined }
        : t,
    ),
  });
  return true;
}

/**
 * Koreksi waktu sebuah task secara manual. Validasi monoton: waktu harus ≥ task
 * sebelumnya & ≤ task berikutnya (urutan TASK_SEQUENCE). Mengembalikan error bila gagal.
 */
export function editTaskWaktu(
  kodebooking: string,
  taskid: TaskId,
  waktu: number,
): { ok: boolean; error?: string } {
  const rec = state.byKode[kodebooking];
  if (!rec) return { ok: false, error: "Antrean tidak ditemukan" };
  const seq = TASK_SEQUENCE[rec.jenisPasien];
  const pos = (id: TaskId) => (id === 99 ? 999 : seq.indexOf(id));
  const others = rec.tasks.filter((t) => t.taskid !== taskid);
  const lower = others.filter((t) => pos(t.taskid) < pos(taskid)).map((t) => t.waktu);
  const upper = others.filter((t) => pos(t.taskid) > pos(taskid)).map((t) => t.waktu);
  const lowerMax = lower.length ? Math.max(...lower) : -Infinity;
  const upperMin = upper.length ? Math.min(...upper) : Infinity;
  if (waktu < lowerMax) return { ok: false, error: "Waktu lebih awal dari task sebelumnya" };
  if (waktu > upperMin) return { ok: false, error: "Waktu melampaui task berikutnya" };
  patchRecord(kodebooking, {
    tasks: rec.tasks.map((t) => (t.taskid === taskid ? { ...t, waktu } : t)),
  });
  return { ok: true };
}

// ── Reads ──────────────────────────────────────────────────

export function getAntrean(kodebooking: string): AntreanRecord | undefined {
  return state.byKode[kodebooking];
}

export function getAllAntrean(): AntreanRecord[] {
  return Object.values(state.byKode).sort((a, b) => b.createdAt - a.createdAt);
}

export function getAntreanByPasien(noRM: string): AntreanRecord[] {
  return getAllAntrean().filter((a) => a.pasien.noRM === noRM);
}

export function toOnlineRef(rec: AntreanRecord): AntreanOnlineRef {
  const last = rec.tasks[rec.tasks.length - 1];
  return {
    kodebooking: rec.kodebooking,
    nomorAntrean: rec.nomorAntrean,
    jamEstimasi: rec.estimasiDilayani
      ? new Date(rec.estimasiDilayani).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : undefined,
    taskTerakhir: last?.taskid,
    status: rec.status,
  };
}

// ── Subscription / hook ────────────────────────────────────

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

export function useAntreanStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
