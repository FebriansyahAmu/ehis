// ANT2.1 — loketStore: sesi loket aktif + shift log (audit) + map panggilan.
// Pola useSyncExternalStore + sessionStorage (sama seperti antreanStore).
// Sesi loket aktif mengikat aksi petugas (panggil/respon/batal) → tercatat di shiftLog.

"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ehis.loket.v1";

export type JenisFilter = "Semua" | "Baru" | "Lama";

export interface LoketSession {
  pos: string;
  loket: string;
  tanggal: string; // yyyy-mm-dd
  jenisPasien: JenisFilter;
  petugas: string;
  openedAt: number;
}

export type ShiftAction = "buka" | "tutup" | "panggil" | "respon" | "batal";

export interface ShiftLogEntry {
  id: string;
  ts: number;
  action: ShiftAction;
  pos?: string;
  loket?: string;
  detail: string;
}

export interface PanggilanRef {
  kodebooking: string;
  pos: string;
  loket: string;
  calledAt: number;
}

interface StoreState {
  session: LoketSession | null;
  shiftLog: ShiftLogEntry[];
  panggilan: Record<string, PanggilanRef>;
}

const EMPTY: StoreState = { session: null, shiftLog: [], panggilan: {} };

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
      return {
        session: p.session ?? null,
        shiftLog: p.shiftLog ?? [],
        panggilan: p.panggilan ?? {},
      };
    }
  } catch {
    /* ignore */
  }
  return { session: null, shiftLog: [], panggilan: {} };
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

function logId(): string {
  return `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function appendLog(entry: Omit<ShiftLogEntry, "id" | "ts">): ShiftLogEntry {
  const full: ShiftLogEntry = { id: logId(), ts: Date.now(), ...entry };
  commit({ ...state, shiftLog: [full, ...state.shiftLog].slice(0, 200) });
  return full;
}

// ── Sesi loket ─────────────────────────────────────────────

export function bukaLoket(input: Omit<LoketSession, "openedAt">) {
  const session: LoketSession = { ...input, openedAt: Date.now() };
  commit({ ...state, session });
  appendLog({
    action: "buka",
    pos: session.pos,
    loket: session.loket,
    detail: `Buka loket oleh ${session.petugas} (${session.jenisPasien})`,
  });
}

export function tutupLoket() {
  const s = state.session;
  commit({ ...state, session: null });
  if (s) {
    appendLog({ action: "tutup", pos: s.pos, loket: s.loket, detail: `Tutup loket oleh ${s.petugas}` });
  }
}

// ── Aksi (terikat sesi aktif) ──────────────────────────────

/** Catat panggilan ke loket aktif. Status antrean di-set di antreanStore oleh caller. */
export function recordPanggil(kodebooking: string, nomorAntrean: string) {
  const s = state.session;
  if (!s) return;
  const ref: PanggilanRef = { kodebooking, pos: s.pos, loket: s.loket, calledAt: Date.now() };
  commit({ ...state, panggilan: { ...state.panggilan, [kodebooking]: ref } });
  appendLog({ action: "panggil", pos: s.pos, loket: s.loket, detail: `Panggil ${nomorAntrean}` });
}

export function logRespon(kodebooking: string, nama: string) {
  const s = state.session;
  appendLog({
    action: "respon",
    pos: s?.pos,
    loket: s?.loket,
    detail: `Respon kedatangan ${nama} (${kodebooking})`,
  });
}

export function logBatal(nomorAntrean: string, alasan: string) {
  const s = state.session;
  appendLog({ action: "batal", pos: s?.pos, loket: s?.loket, detail: `Batal ${nomorAntrean}: ${alasan}` });
}

// ── Reads ──────────────────────────────────────────────────

export function getPanggilan(kodebooking: string): PanggilanRef | undefined {
  return state.panggilan[kodebooking];
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

export function useLoketStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
