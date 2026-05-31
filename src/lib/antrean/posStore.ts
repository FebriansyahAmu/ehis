// ANT3 — posStore: owner konfigurasi Pos Antrian → Loket → Poli (mapping + CRUD).
// Pola useSyncExternalStore + sessionStorage. Seed dari loketMock; saat backend ready
// → swap ke tabel `pos_antrian` / `loket` / `pos_poli`. Board (Buka Loket) consume store ini.

"use client";

import { useSyncExternalStore } from "react";
import { POS_ANTRIAN, type LoketRef } from "./loketMock";

const STORAGE_KEY = "ehis.pos.v1";

export interface PosConfig {
  kode: string;
  nama: string;
  loket: LoketRef[];
  /** kode poli yang dilayani pos ini (mapping ke POLI_ONSITE). */
  poli: string[];
}

interface StoreState {
  pos: PosConfig[];
}

// Default mapping poli per pos (seed).
const SEED_POLI: Record<string, string[]> = {
  RJ: ["UMU", "INT", "JAN", "PAR", "SAR", "ANA", "THT", "MAT", "ORT", "GIG", "OBG"],
  BPJS: ["UMU", "INT", "JAN", "PAR", "BED", "SAR", "ANA", "THT", "MAT", "ORT", "GIG", "OBG"],
  PRI: ["UMU", "INT", "JAN", "MAT"],
};

function seed(): StoreState {
  return {
    pos: POS_ANTRIAN.map((p) => ({
      kode: p.kode,
      nama: p.nama,
      loket: p.loket.map((l) => ({ ...l })),
      poli: SEED_POLI[p.kode] ?? [],
    })),
  };
}

let state: StoreState = load();
let snapshot: StoreState = state;
const listeners = new Set<() => void>();

// ── Persistence ────────────────────────────────────────────

function load(): StoreState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<StoreState>;
      if (p.pos && p.pos.length > 0) return { pos: p.pos };
    }
  } catch {
    /* ignore */
  }
  return seed();
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

function setPos(pos: PosConfig[]) {
  commit({ pos });
}

function slugKode(nama: string, taken: string[]): string {
  const base = nama.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "POS";
  let kode = base;
  let n = 1;
  while (taken.includes(kode)) kode = `${base}${n++}`;
  return kode;
}

// ── CRUD Pos ───────────────────────────────────────────────

export function addPos(nama: string): PosConfig {
  const kode = slugKode(nama, state.pos.map((p) => p.kode));
  const pos: PosConfig = { kode, nama, loket: [], poli: [] };
  setPos([...state.pos, pos]);
  return pos;
}

export function renamePos(kode: string, nama: string) {
  setPos(state.pos.map((p) => (p.kode === kode ? { ...p, nama } : p)));
}

export function removePos(kode: string) {
  setPos(state.pos.filter((p) => p.kode !== kode));
}

// ── CRUD Loket ─────────────────────────────────────────────

export function addLoket(posKode: string, nama: string) {
  setPos(
    state.pos.map((p) => {
      if (p.kode !== posKode) return p;
      const seq = String(p.loket.length + 1).padStart(2, "0");
      return { ...p, loket: [...p.loket, { kode: `${posKode}-${seq}`, nama }] };
    }),
  );
}

export function removeLoket(posKode: string, loketKode: string) {
  setPos(
    state.pos.map((p) =>
      p.kode === posKode ? { ...p, loket: p.loket.filter((l) => l.kode !== loketKode) } : p,
    ),
  );
}

// ── Mapping Poli ───────────────────────────────────────────

export function togglePoli(posKode: string, poliKode: string) {
  setPos(
    state.pos.map((p) => {
      if (p.kode !== posKode) return p;
      const has = p.poli.includes(poliKode);
      return { ...p, poli: has ? p.poli.filter((k) => k !== poliKode) : [...p.poli, poliKode] };
    }),
  );
}

export function resetPosConfig() {
  commit(seed());
}

// ── Reads (non-hook, baca state terkini) ───────────────────

export function getPosConfig(kode: string): PosConfig | undefined {
  return state.pos.find((p) => p.kode === kode);
}

/** Label gabungan "Pendaftaran BPJS · Loket BPJS 1" dari state terkini. */
export function loketLabel(posKode: string, loketKode: string): string {
  const pos = state.pos.find((p) => p.kode === posKode);
  const loket = pos?.loket.find((l) => l.kode === loketKode);
  if (!pos || !loket) return "—";
  return `${pos.nama} · ${loket.nama}`;
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
  return snapshot;
}

export function usePosStore(): PosConfig[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).pos;
}
