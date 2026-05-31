"use client";

// ANT2.1 — Header kontrol "Buka Loket": pilih Pos · Loket · Tanggal · Jenis Pasien.
// Sesi aktif ditampilkan sebagai chip + tombol Tutup. Aksi baris terikat sesi ini.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DoorOpen, DoorClosed, MapPin, Calendar, Users, History, X } from "lucide-react";
import { usePosStore, loketLabel } from "@/lib/antrean/posStore";
import {
  bukaLoket,
  tutupLoket,
  type JenisFilter,
  type LoketSession,
  type ShiftLogEntry,
} from "@/lib/antrean/loketStore";
import { todayISO } from "./boardShared";

const JENIS_OPTS: JenisFilter[] = ["Semua", "Baru", "Lama"];

const ACTION_LABEL: Record<string, string> = {
  buka: "Buka loket",
  tutup: "Tutup loket",
  panggil: "Panggil",
  respon: "Respon",
  batal: "Batal",
};

export function LoketControlBar({
  session,
  shiftLog,
}: {
  session: LoketSession | null;
  shiftLog: ShiftLogEntry[];
}) {
  const posList = usePosStore();
  const [posKode, setPosKode] = useState("");
  const [loketKode, setLoketKode] = useState("");
  const [tanggal, setTanggal] = useState(todayISO());
  const [jenis, setJenis] = useState<JenisFilter>("Semua");
  const [logOpen, setLogOpen] = useState(false);

  // Pilihan diturunkan dari store → robust bila pos/loket dihapus di Pengaturan.
  const posObj = posList.find((p) => p.kode === posKode) ?? posList[0];
  const loketObj = posObj?.loket.find((l) => l.kode === loketKode) ?? posObj?.loket[0];

  const onPickPos = (kode: string) => {
    setPosKode(kode);
    setLoketKode("");
  };

  const handleBuka = () => {
    if (!posObj || !loketObj) return;
    bukaLoket({ pos: posObj.kode, loket: loketObj.kode, tanggal, jenisPasien: jenis, petugas: "Petugas Admisi" });
  };

  if (session) {
    return (
      <SessionBar session={session} shiftLog={shiftLog} logOpen={logOpen} setLogOpen={setLogOpen} />
    );
  }

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Pos Antrian" icon={MapPin}>
          <select
            value={posObj?.kode ?? ""}
            onChange={(e) => onPickPos(e.target.value)}
            className={selectClass}
          >
            {posList.map((p) => (
              <option key={p.kode} value={p.kode}>{p.nama}</option>
            ))}
          </select>
        </Field>

        <Field label="Loket" icon={DoorOpen}>
          <select
            value={loketObj?.kode ?? ""}
            onChange={(e) => setLoketKode(e.target.value)}
            disabled={!posObj || posObj.loket.length === 0}
            className={selectClass}
          >
            {posObj && posObj.loket.length > 0 ? (
              posObj.loket.map((l) => (
                <option key={l.kode} value={l.kode}>{l.nama}</option>
              ))
            ) : (
              <option value="">— belum ada loket —</option>
            )}
          </select>
        </Field>

        <Field label="Tanggal" icon={Calendar}>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className={selectClass}
          />
        </Field>

        <Field label="Jenis Pasien" icon={Users}>
          <select value={jenis} onChange={(e) => setJenis(e.target.value as JenisFilter)} className={selectClass}>
            {JENIS_OPTS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </Field>

        <button
          type="button"
          onClick={handleBuka}
          disabled={!loketObj}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 m-sm font-bold text-white shadow-sm transition-colors hover:bg-sky-700 active:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <DoorOpen className="h-4 w-4" />
          Buka Loket
        </button>
      </div>
      <p className="mt-2.5 m-tiny text-slate-400">
        Buka loket dahulu untuk mengaktifkan aksi <span className="font-semibold text-slate-500">Panggil · Respon Kedatangan · Batal</span> pada tabel di bawah.
      </p>
    </section>
  );
}

// ── Sesi aktif ─────────────────────────────────────────────

function SessionBar({
  session,
  shiftLog,
  logOpen,
  setLogOpen,
}: {
  session: LoketSession;
  shiftLog: ShiftLogEntry[];
  logOpen: boolean;
  setLogOpen: (v: boolean) => void;
}) {
  return (
    <section className="relative flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 p-4 text-white shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
        <DoorOpen className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="m-tiny font-medium uppercase tracking-wider text-sky-100">Loket Aktif</p>
        <p className="m-base font-extrabold leading-tight">{loketLabel(session.pos, session.loket)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 m-xs">
        <Meta label="Petugas" value={session.petugas} />
        <Meta label="Jenis" value={session.jenisPasien} />
        <Meta
          label="Dibuka"
          value={new Date(session.openedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLogOpen(!logOpen)}
          className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 m-xs font-semibold text-white transition-colors hover:bg-white/25"
        >
          <History className="h-4 w-4" />
          Shift Log
          <span className="rounded-full bg-white/25 px-1.5 py-0.5 m-mini font-bold tabular-nums">{shiftLog.length}</span>
        </button>
        <button
          type="button"
          onClick={tutupLoket}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 m-sm font-bold text-sky-700 shadow-sm transition-colors hover:bg-sky-50"
        >
          <DoorClosed className="h-4 w-4" />
          Tutup Loket
        </button>
      </div>

      <AnimatePresence>
        {logOpen && <ShiftLogPanel shiftLog={shiftLog} onClose={() => setLogOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}

function ShiftLogPanel({ shiftLog, onClose }: { shiftLog: ShiftLogEntry[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute right-4 top-full z-30 mt-2 flex max-h-80 w-80 flex-col overflow-hidden rounded-2xl bg-white text-slate-700 shadow-xl ring-1 ring-slate-200"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="m-xs font-bold uppercase tracking-wide text-slate-500">Shift Log (audit)</p>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {shiftLog.length === 0 ? (
          <p className="px-4 py-6 text-center m-xs text-slate-400">Belum ada aktivitas.</p>
        ) : (
          shiftLog.map((e) => (
            <div key={e.id} className="flex items-start gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0">
              <span className="mt-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 m-mini font-bold uppercase text-slate-500">
                {ACTION_LABEL[e.action] ?? e.action}
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-xs text-slate-700">{e.detail}</p>
                <p className="m-mini text-slate-400">
                  {new Date(e.ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ── Pieces ─────────────────────────────────────────────────

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 m-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

function Field({ label, icon: Icon, children }: { label: string; icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 m-tiny font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      {children}
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-sky-200">{label}:</span>
      <span className="font-bold">{value}</span>
    </span>
  );
}
