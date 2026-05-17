"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Plus, ShieldAlert, Send, Clock, User, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FarmasiOrder } from "@/components/farmasi/farmasiShared";
import {
  type LaporanMESO, type SeveritasESO, type KausalitasWHO,
  type OutcomeESO, type TindakanDiambil,
  SEVERITAS_CFG, KAUSALITAS_CFG, getMESOForRM,
} from "@/components/farmasi/meso/mesoShared";

// ── Props ─────────────────────────────────────────────────

interface Props { order: FarmasiOrder }

// ── Report card (left panel) ──────────────────────────────

function ReportCard({ laporan, active, onClick }: {
  laporan: LaporanMESO; active: boolean; onClick: () => void;
}) {
  const sev = SEVERITAS_CFG[laporan.severitas];
  const kau = KAUSALITAS_CFG[laporan.kausalitas];
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all duration-150",
        active
          ? "border-sky-300 bg-sky-50 shadow-sm"
          : "border-slate-100 bg-white hover:border-sky-200 hover:bg-sky-50/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-xs font-semibold text-slate-800">{laporan.namaObatTerduga}</span>
        <div className="flex shrink-0 items-center gap-1">
          <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold", sev.badge)}>{sev.label}</span>
          <ChevronRight size={11} className={active ? "text-sky-500" : "text-slate-300"} />
        </div>
      </div>
      <p className="mt-1 text-[10px] text-slate-500 line-clamp-2">{laporan.deskripsiESO}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-semibold", kau.cls)}>
          {kau.label}
        </span>
        <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
          <Clock size={8} />{laporan.tanggalLaporan}
          {laporan.dikirimBPOM && <Send size={8} className="ml-1 text-sky-500" />}
        </span>
      </div>
    </motion.button>
  );
}

// ── Detail view ───────────────────────────────────────────

function DetailView({ laporan }: { laporan: LaporanMESO }) {
  const sev = SEVERITAS_CFG[laporan.severitas];
  const kau = KAUSALITAS_CFG[laporan.kausalitas];
  const rows: { label: string; value: string }[] = [
    { label: "Obat Terduga",     value: laporan.namaObatTerduga },
    { label: "Tanggal Onset",    value: laporan.tanggalMulai    },
    { label: "Tanggal Laporan",  value: laporan.tanggalLaporan  },
    { label: "Tindakan Diambil", value: laporan.tindakanLain ? `${laporan.tindakan} — ${laporan.tindakanLain}` : laporan.tindakan },
    { label: "Outcome",          value: laporan.outcome         },
    { label: "Apoteker",         value: laporan.apoteker        },
  ];
  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap items-start gap-2">
        <span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold", sev.badge)}>{sev.label}</span>
        <span className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold", kau.cls)}>{kau.label}</span>
        {laporan.dikirimBPOM && (
          <span className="flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
            <Send size={10} />Dilaporkan ke BPOM
          </span>
        )}
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Deskripsi ESO</p>
        <p className="text-sm text-slate-700">{laporan.deskripsiESO}</p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-sky-50/40 p-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Kausalitas WHO-UMC</p>
        <p className="text-xs font-semibold text-sky-700">{kau.label}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">{kau.desc}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg border border-slate-100 px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{r.label}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-700">{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── New report form ────────────────────────────────────────

type NewForm = {
  namaObatTerduga: string; tanggalMulai: string; deskripsiESO: string;
  severitas: SeveritasESO; kausalitas: KausalitasWHO;
  outcome: OutcomeESO; tindakan: TindakanDiambil;
  tindakanLain: string; apoteker: string; dikirimBPOM: boolean;
};

const EMPTY_FORM: NewForm = {
  namaObatTerduga: "", tanggalMulai: new Date().toISOString().split("T")[0],
  deskripsiESO: "", severitas: "Ringan", kausalitas: "Kemungkinan",
  outcome: "Belum Sembuh", tindakan: "Obat dilanjutkan",
  tindakanLain: "", apoteker: "", dikirimBPOM: false,
};

const SEV_OPTS:  SeveritasESO[]    = ["Ringan", "Sedang", "Berat", "Fatal"];
const KAU_OPTS:  KausalitasWHO[]   = ["Pasti", "Kemungkinan Besar", "Kemungkinan", "Meragukan", "Tidak Dapat Dinilai"];
const OUT_OPTS:  OutcomeESO[]      = ["Sembuh", "Sembuh dgn Gejala Sisa", "Belum Sembuh", "Fatal", "Tidak Diketahui"];
const TIN_OPTS:  TindakanDiambil[] = ["Obat dihentikan", "Dosis dikurangi", "Obat dilanjutkan", "Terapi simtomatik", "Lainnya"];

function NewReportForm({ noRM, obatList, onSave, onCancel }: {
  noRM: string; obatList: string[];
  onSave: (l: LaporanMESO) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<NewForm>({ ...EMPTY_FORM });
  const set = <K extends keyof NewForm>(k: K, v: NewForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.namaObatTerduga.trim() && form.deskripsiESO.trim() && form.apoteker.trim();

  const inp  = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
  const sel  = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
  const lbl  = "mb-1 block text-xs font-semibold text-slate-600";

  function handleSave() {
    if (!valid) return;
    onSave({
      id: `meso-local-${Date.now()}`, noRM,
      namaObatTerduga: form.namaObatTerduga,
      tanggalMulai: form.tanggalMulai, tanggalLaporan: new Date().toISOString().split("T")[0],
      deskripsiESO: form.deskripsiESO,
      severitas: form.severitas, kausalitas: form.kausalitas,
      outcome: form.outcome, tindakan: form.tindakan,
      tindakanLain: form.tindakan === "Lainnya" ? form.tindakanLain : undefined,
      apoteker: form.apoteker, dikirimBPOM: form.dikirimBPOM,
    });
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">Laporan ESO Baru</p>
        <button onClick={onCancel} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X size={14} />
        </button>
      </div>

      <div>
        <label className={lbl}>Obat Terduga</label>
        <select value={form.namaObatTerduga} onChange={(e) => set("namaObatTerduga", e.target.value)} className={sel}>
          <option value="">Pilih obat</option>
          {obatList.map((o) => <option key={o} value={o}>{o}</option>)}
          <option value="__lainnya__">Lainnya (ketik manual)</option>
        </select>
        {form.namaObatTerduga === "__lainnya__" && (
          <input className={cn(inp, "mt-1.5")} placeholder="Nama obat" onChange={(e) => set("namaObatTerduga", e.target.value)} />
        )}
      </div>

      <div>
        <label className={lbl}>Tanggal Mulai ESO</label>
        <input type="date" value={form.tanggalMulai} onChange={(e) => set("tanggalMulai", e.target.value)} className={inp} />
      </div>

      <div>
        <label className={lbl}>Deskripsi ESO</label>
        <textarea rows={3} value={form.deskripsiESO} onChange={(e) => set("deskripsiESO", e.target.value)}
          placeholder="Gejala, onset, perjalanan klinis..."
          className={cn(inp, "resize-none")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Severitas</label>
          <select value={form.severitas} onChange={(e) => set("severitas", e.target.value as SeveritasESO)} className={sel}>
            {SEV_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Kausalitas WHO-UMC</label>
          <select value={form.kausalitas} onChange={(e) => set("kausalitas", e.target.value as KausalitasWHO)} className={sel}>
            {KAU_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Outcome</label>
          <select value={form.outcome} onChange={(e) => set("outcome", e.target.value as OutcomeESO)} className={sel}>
            {OUT_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Tindakan Diambil</label>
          <select value={form.tindakan} onChange={(e) => set("tindakan", e.target.value as TindakanDiambil)} className={sel}>
            {TIN_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {form.tindakan === "Lainnya" && (
        <div>
          <label className={lbl}>Detail Tindakan</label>
          <input value={form.tindakanLain} onChange={(e) => set("tindakanLain", e.target.value)} className={inp} placeholder="Jelaskan tindakan..." />
        </div>
      )}

      <div>
        <label className={lbl}><User size={10} className="inline mr-1" />Apoteker Pelapor</label>
        <input value={form.apoteker} onChange={(e) => set("apoteker", e.target.value)} className={inp} placeholder="Apt. Nama, S.Farm." />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.dikirimBPOM} onChange={(e) => set("dikirimBPOM", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-600" />
        <span className="text-xs font-medium text-slate-600">Laporan dikirim ke BPOM e-MESO</span>
      </label>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          Batal
        </button>
        <button onClick={handleSave} disabled={!valid}
          className={cn("flex-1 rounded-lg py-2 text-xs font-bold transition-all",
            valid ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95" : "cursor-not-allowed bg-slate-100 text-slate-400")}>
          Simpan Laporan
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function MESOPane({ order }: Props) {
  const [laporan, setLaporan]   = useState<LaporanMESO[]>(() => getMESOForRM(order.noRM));
  const [selected, setSelected] = useState<string | null>(laporan[0]?.id ?? null);
  const [showForm, setShowForm] = useState(false);

  function handleSave(l: LaporanMESO) {
    setLaporan((prev) => [l, ...prev]);
    setSelected(l.id);
    setShowForm(false);
  }

  const active = laporan.find((l) => l.id === selected);
  const obatList = order.items.map((i) => i.namaObat);

  return (
    <div className="flex min-h-0 gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ minHeight: 520 }}>

      {/* Left panel */}
      <div className="flex w-64 shrink-0 flex-col border-r border-slate-100 bg-slate-50/60">
        <div className="border-b border-slate-100 px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
                <ShieldAlert size={13} className="text-rose-600" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Pelaporan ESO</p>
                <p className="text-[10px] text-slate-400">PMK 72/2016 Ps. 33</p>
              </div>
            </div>
            <button onClick={() => { setShowForm(true); setSelected(null); }}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition">
              <Plus size={11} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          {laporan.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ShieldAlert size={20} className="mb-1.5 text-slate-300" />
              <p className="text-[11px] text-slate-400">Belum ada laporan ESO</p>
            </div>
          ) : (
            <AnimatePresence>
              {laporan.map((l, i) => (
                <motion.div key={l.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ReportCard laporan={l} active={selected === l.id && !showForm} onClick={() => { setSelected(l.id); setShowForm(false); }} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="border-t border-slate-100 px-3 py-2.5">
          <p className="text-[9px] text-slate-400">
            {laporan.length} laporan · {laporan.filter((l) => l.dikirimBPOM).length} dikirim BPOM
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div key="form"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            >
              <NewReportForm noRM={order.noRM} obatList={obatList} onSave={handleSave} onCancel={() => setShowForm(false)} />
            </motion.div>
          ) : active ? (
            <motion.div key={active.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            >
              <DetailView laporan={active} />
            </motion.div>
          ) : (
            <motion.div key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center"
            >
              <AlertTriangle size={24} className="text-slate-300" />
              <p className="text-sm text-slate-400">Pilih laporan atau buat laporan baru</p>
              <button onClick={() => setShowForm(true)}
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700">
                <Plus size={12} />Buat Laporan ESO
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
