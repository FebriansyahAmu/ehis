"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car, HardHat, AlertTriangle, CheckCircle2,
  FileText, MapPin, Loader2, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KunjunganRecord } from "@/lib/data";
import { Select } from "@/components/shared/inputs/Select";
import { DatePicker } from "@/components/shared/inputs/DatePicker";
import { TimePicker } from "@/components/shared/inputs/TimePicker";
import { getKecelakaan, saveKecelakaan } from "@/lib/api/kecelakaan";
import { KLLPanel } from "./kecelakaan/KLLPanel";
import { KKPanel } from "./kecelakaan/KKPanel";
import { SuratJRModal } from "./kecelakaan/SuratJRModal";
import {
  type JenisKecelakaan, type KecelakaanDraft, type StatusKlaim,
  BLANK_DRAFT, PROVINSI_LIST, STATUS_CONFIG, dtoToDraft,
} from "./kecelakaan/kecelakaanTypes";

// Pasien DB (UUID) → persist ke encounter.Kecelakaan; demo (non-UUID) → lokal saja.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Field styles ─────────────────────────────────────────────

const sm    = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition";
const smSel = "w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition cursor-pointer";
const lbl   = "mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400";

// ─── Jenis options ────────────────────────────────────────────

const JENIS_OPTIONS = [
  {
    id:      "kll"     as JenisKecelakaan,
    label:   "Lalu Lintas",
    sub:     "Kendaraan bermotor di jalan",
    reg:     "Jasa Raharja · UU 34/1964",
    icon:    Car,
    idle:    "border-amber-200 bg-amber-50 text-amber-700",
    active:  "border-amber-500 bg-amber-500 text-white",
    regCls:  "bg-white/20 text-white",
    regIdle: "bg-amber-100/80 text-amber-600",
  },
  {
    id:      "kerja"   as JenisKecelakaan,
    label:   "Kecelakaan Kerja",
    sub:     "Saat atau akibat pekerjaan",
    reg:     "BPJS Naker JKK · PP 44/2015",
    icon:    HardHat,
    idle:    "border-emerald-200 bg-emerald-50 text-emerald-700",
    active:  "border-emerald-600 bg-emerald-600 text-white",
    regCls:  "bg-white/20 text-white",
    regIdle: "bg-emerald-100/80 text-emerald-600",
  },
  {
    id:      "lainnya" as JenisKecelakaan,
    label:   "Lainnya",
    sub:     "Jatuh, luka bakar, dll",
    reg:     "BPJS Kesehatan / Umum",
    icon:    AlertTriangle,
    idle:    "border-slate-200 bg-slate-50 text-slate-600",
    active:  "border-slate-700 bg-slate-700 text-white",
    regCls:  "bg-white/20 text-white",
    regIdle: "bg-slate-100/80 text-slate-500",
  },
] as const;

// ─── Jenis Selector ───────────────────────────────────────────

function JenisSelector({
  value,
  onChange,
}: {
  value:    JenisKecelakaan;
  onChange: (v: JenisKecelakaan) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {JENIS_OPTIONS.map(opt => {
        const Icon     = opt.icon;
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.97]",
              isActive ? opt.active : cn(opt.idle, "hover:opacity-90"),
            )}
          >
            <div className="flex w-full items-center justify-between">
              <Icon size={14} className="shrink-0" />
              {isActive && <CheckCircle2 size={11} className="shrink-0 opacity-75" />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-tight">{opt.label}</p>
              <p className={cn(
                "mt-0.5 truncate text-[9.5px] leading-tight",
                isActive ? "opacity-70" : "opacity-50",
              )}>
                {opt.sub}
              </p>
            </div>
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold leading-tight",
              isActive ? opt.regCls : opt.regIdle,
            )}>
              {opt.reg}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Lainnya panel ────────────────────────────────────────────

function LainnyaPanel({
  draft,
  setDraft,
}: {
  draft:    KecelakaanDraft;
  setDraft: React.Dispatch<React.SetStateAction<KecelakaanDraft>>;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
        Kategori Kecelakaan
      </p>
      <div>
        <p className={lbl}>Jenis / Kategori</p>
        <select
          className={smSel}
          value={draft.mekanismeTrauma}
          onChange={e => setDraft(d => ({ ...d, mekanismeTrauma: e.target.value }))}
        >
          <option value="">Pilih kategori...</option>
          <option>Jatuh / Terpeleset</option>
          <option>Luka Bakar (Non-Kerja)</option>
          <option>Kekerasan / KDRT</option>
          <option>Kecelakaan Olahraga</option>
          <option>Kecelakaan Rumah Tangga</option>
          <option>Tersedak / Aspirasi</option>
          <option>Tenggelam</option>
          <option>Sengatan Listrik (Non-Kerja)</option>
          <option>Gigitan Hewan</option>
          <option>Lainnya</option>
        </select>
      </div>
      <div>
        <p className={lbl}>Penjamin</p>
        <select className={smSel}>
          <option>BPJS Kesehatan</option>
          <option>Umum / Mandiri</option>
          <option>Asuransi Swasta</option>
        </select>
      </div>
    </div>
  );
}

// ─── Detail Kejadian ──────────────────────────────────────────

function DetailKejadian({
  draft,
  setDraft,
}: {
  draft:    KecelakaanDraft;
  setDraft: React.Dispatch<React.SetStateAction<KecelakaanDraft>>;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="flex items-center gap-2">
        <MapPin size={11} className="text-slate-400" />
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
          Detail Kejadian
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className={lbl}>Tanggal Kejadian</p>
          <DatePicker
            value={draft.tanggal}
            onChange={iso => setDraft(d => ({ ...d, tanggal: iso }))}
            placeholder="Pilih tanggal…"
          />
        </div>
        <div>
          <p className={lbl}>Waktu Kejadian</p>
          <TimePicker
            value={draft.waktu}
            onChange={hhmm => setDraft(d => ({ ...d, waktu: hhmm }))}
            placeholder="Pilih waktu…"
          />
        </div>
      </div>

      <div>
        <p className={lbl}>Provinsi Kejadian</p>
        <Select
          value={draft.provinsi}
          onChange={v => setDraft(d => ({ ...d, provinsi: v }))}
          options={[...PROVINSI_LIST]}
          icon={MapPin}
          placeholder="Pilih provinsi…"
        />
      </div>

      <div>
        <p className={lbl}>Lokasi Lengkap Kejadian</p>
        <input
          className={sm}
          placeholder="Alamat / nama jalan / simpang / km jalan..."
          value={draft.lokasi}
          onChange={e => setDraft(d => ({ ...d, lokasi: e.target.value }))}
        />
      </div>

      <div>
        <p className={lbl}>Kronologi Singkat</p>
        <textarea
          className={cn(sm, "min-h-18 resize-none leading-relaxed")}
          placeholder="Deskripsikan kronologi kejadian secara singkat dan jelas..."
          value={draft.kronologi}
          onChange={e => setDraft(d => ({ ...d, kronologi: e.target.value }))}
        />
      </div>
    </div>
  );
}

// ─── Status Klaim ─────────────────────────────────────────────

function StatusKlaimSection({
  draft,
  setDraft,
}: {
  draft:    KecelakaanDraft;
  setDraft: React.Dispatch<React.SetStateAction<KecelakaanDraft>>;
}) {
  const statuses: StatusKlaim[] = ["belum", "proses", "selesai", "ditolak"];
  const showNomor = draft.statusKlaim === "proses" || draft.statusKlaim === "selesai";

  return (
    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
        Status Klaim Asuransi
      </p>
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => {
          const cfg      = STATUS_CONFIG[s];
          const isActive = draft.statusKlaim === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setDraft(d => ({ ...d, statusKlaim: s }))}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10.5px] font-semibold transition active:scale-95",
                isActive
                  ? cfg.chipCls
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <div className={cn("h-1.5 w-1.5 rounded-full", isActive ? cfg.dot : "bg-slate-300")} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {showNomor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-1">
              <p className={lbl}>Nomor Klaim</p>
              <input
                className={sm}
                placeholder="Nomor klaim dari Jasa Raharja / BPJS Naker..."
                value={draft.nomorKlaim}
                onChange={e => setDraft(d => ({ ...d, nomorKlaim: e.target.value }))}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── KecelakaanForm ───────────────────────────────────────────

export function KecelakaanForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const persist = UUID_RE.test(kunjungan.id);

  const [draft,       setDraft]       = useState<KecelakaanDraft>({ ...BLANK_DRAFT });
  const [loading,     setLoading]     = useState(persist);
  const [saving,      setSaving]      = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [showJRModal, setShowJRModal] = useState(false);
  const [err,         setErr]         = useState<string | null>(null);

  // Muat data kecelakaan tersimpan (pasien DB). Demo (non-UUID) → form kosong/lokal.
  useEffect(() => {
    if (!persist) return;
    const ac = new AbortController();
    getKecelakaan(kunjungan.id, ac.signal)
      .then((row) => { if (row) setDraft(dtoToDraft(row)); })
      .catch(() => { /* biarkan blank → operator isi baru */ })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [persist, kunjungan.id]);

  const handleSave = async () => {
    if (!persist) { setSubmitted(true); return; } // demo lokal
    setSaving(true);
    setErr(null);
    try {
      await saveKecelakaan(kunjungan.id, draft);
      setSubmitted(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan data kecelakaan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-400">
        <Loader2 size={22} className="animate-spin text-sky-500" />
        <p className="text-[12px] font-medium">Memuat data kecelakaan…</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-14 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={24} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-slate-800">Data Kecelakaan Tersimpan</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Data telah dicatat dan siap digunakan untuk proses klaim
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Kembali ke Form
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-[13px] font-bold text-slate-800">Data Kecelakaan</p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Pengisian data kecelakaan untuk pelaporan dan klaim Jasa Raharja / BPJS Ketenagakerjaan
        </p>
      </div>

      {/* Error */}
      {err && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700 ring-1 ring-rose-100">
          <AlertTriangle size={13} className="shrink-0" /> {err}
        </div>
      )}

      {/* Demo notice */}
      {!persist && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
          <AlertTriangle size={13} className="shrink-0" /> Pasien demo — data kecelakaan tidak tersimpan.
        </div>
      )}

      {/* Jenis selector */}
      <JenisSelector
        value={draft.jenis}
        onChange={jenis => setDraft(d => ({ ...d, jenis, mekanismeTrauma: "" }))}
      />

      {/* Conditional panel per jenis */}
      <AnimatePresence mode="wait">
        <motion.div
          key={draft.jenis}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
        >
          {draft.jenis === "kll"    && <KLLPanel    draft={draft} setDraft={setDraft} />}
          {draft.jenis === "kerja"  && <KKPanel     draft={draft} setDraft={setDraft} />}
          {draft.jenis === "lainnya"&& <LainnyaPanel draft={draft} setDraft={setDraft} />}
        </motion.div>
      </AnimatePresence>

      {/* Detail Kejadian (shared) */}
      <DetailKejadian draft={draft} setDraft={setDraft} />

      {/* Status Klaim */}
      <StatusKlaimSection draft={draft} setDraft={setDraft} />

      {/* JR Modal */}
      {showJRModal && (
        <SuratJRModal draft={draft} onClose={() => setShowJRModal(false)} />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div>
          {draft.jenis === "kll" && (
            <button
              type="button"
              onClick={() => setShowJRModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 active:scale-95"
            >
              <FileText size={12} />
              Buat Laporan Jasa Raharja
            </button>
          )}
          {draft.jenis === "kerja" && (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
            >
              <FileText size={12} />
              Buat Laporan BPJS Naker (Form 3 KK)
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-[12px] font-bold text-white shadow-sm shadow-sky-200/70 transition hover:bg-sky-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? "Menyimpan…" : "Simpan Data Kecelakaan"}
        </button>
      </div>
    </div>
  );
}
