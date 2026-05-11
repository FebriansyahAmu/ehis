"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pill, Calendar, FlaskConical, ScanLine, Building2,
  Plus, Trash2, AlertTriangle, CheckCircle2, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DischargeRencanaPulang, ObatPulangItem, JadwalKontrol, JadwalPemeriksaan,
} from "./dischargeShared";

type Props = {
  data:     DischargeRencanaPulang;
  onChange: (d: DischargeRencanaPulang) => void;
};

function SectionTitle({ icon: Icon, label, std }: { icon: React.ElementType; label: string; std?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
      <Icon size={12} className="text-sky-500" />
      <p className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {std && <span className="text-[9px] font-bold text-slate-300">{std}</span>}
    </div>
  );
}

function Toggle({ checked }: { checked: boolean }) {
  return (
    <div className={cn(
      "pointer-events-none relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200",
      checked ? "bg-sky-500" : "bg-slate-300",
    )}>
      <span className={cn(
        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
        checked ? "translate-x-4" : "translate-x-0.5",
      )} />
    </div>
  );
}

// ── Obat Pulang ───────────────────────────────────────────

interface ObatDraft {
  namaObat: string; dosis: string; frekuensi: string;
  durasi: string; instruksi: string; isHAM: boolean;
}

function emptyObat(): ObatDraft {
  return { namaObat: "", dosis: "", frekuensi: "", durasi: "", instruksi: "", isHAM: false };
}

function ObatCard({
  item, onDelete,
}: { item: ObatPulangItem; onDelete: () => void }) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">{item.namaObat}</p>
          {item.isHAM && (
            <span className="shrink-0 flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
              <AlertTriangle size={8} /> HAM
            </span>
          )}
          {item.fromResep && (
            <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-semibold text-sky-700">
              Dari Resep
            </span>
          )}
        </div>
        <button
          type="button" onClick={onDelete}
          className="shrink-0 rounded-lg p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
        {[
          { label: "Dosis",     val: item.dosis     },
          { label: "Frekuensi", val: item.frekuensi },
          { label: "Durasi",    val: item.durasi     },
        ].map(({ label, val }) => val && (
          <p key={label} className="text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600">{label}:</span> {val}
          </p>
        ))}
      </div>
      {item.instruksi && (
        <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800">
          {item.instruksi}
        </p>
      )}
    </div>
  );
}

function AddObatForm({
  onSave, onCancel,
}: { onSave: (d: ObatDraft) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<ObatDraft>(emptyObat);
  function set<K extends keyof ObatDraft>(k: K, v: ObatDraft[K]) { setDraft(d => ({ ...d, [k]: v })); }
  const canSave = draft.namaObat.trim() !== "";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3.5 space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Tambah Obat Pulang</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">Nama Obat <span className="text-red-400">*</span></label>
            <input value={draft.namaObat} onChange={e => set("namaObat", e.target.value)}
              placeholder="Nama obat & kekuatan..."
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            />
          </div>
          {(["dosis", "frekuensi", "durasi"] as const).map(field => (
            <div key={field}>
              <label className="mb-1 block text-[10px] font-semibold text-slate-500 capitalize">{field}</label>
              <input value={draft[field]} onChange={e => set(field, e.target.value)}
                placeholder={field === "dosis" ? "cth. 5 mg" : field === "frekuensi" ? "cth. 1×1 pagi" : "cth. 30 hari"}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-500">Instruksi Minum</label>
          <textarea value={draft.instruksi} onChange={e => set("instruksi", e.target.value)}
            rows={2} placeholder="Cara minum, peringatan, efek samping yang perlu diwaspadai..."
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
          />
        </div>
        <button
          type="button"
          onClick={() => set("isHAM", !draft.isHAM)}
          className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left border border-slate-200 hover:border-red-200 hover:bg-red-50/40 transition"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={12} className="text-red-400" />
            <span className="text-xs font-semibold text-slate-700">High-Alert Medication (HAM)</span>
            <span className="text-[10px] text-slate-400">SKP 3</span>
          </div>
          <Toggle checked={draft.isHAM} />
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={() => canSave && onSave(draft)} disabled={!canSave}
            className={cn("rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
              canSave ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
                      : "cursor-not-allowed bg-slate-200 text-slate-400")}
          >Simpan Obat</button>
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
            Batal
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Jadwal Kontrol ────────────────────────────────────────

interface KontrolDraft { tanggal: string; poli: string; dokter: string; catatan: string; }
function emptyKontrol(): KontrolDraft { return { tanggal: "", poli: "", dokter: "", catatan: "" }; }

function AddKontrolForm({ onSave, onCancel }: { onSave: (d: KontrolDraft) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<KontrolDraft>(emptyKontrol);
  function set<K extends keyof KontrolDraft>(k: K, v: string) { setDraft(d => ({ ...d, [k]: v })); }
  const canSave = draft.tanggal !== "" && draft.poli.trim() !== "";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Tambah Jadwal Kontrol</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">Tanggal <span className="text-red-400">*</span></label>
            <input type="date" value={draft.tanggal} onChange={e => set("tanggal", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">Poliklinik <span className="text-red-400">*</span></label>
            <input value={draft.poli} onChange={e => set("poli", e.target.value)} placeholder="cth. Poliklinik Jantung"
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">Dokter</label>
            <input value={draft.dokter} onChange={e => set("dokter", e.target.value)} placeholder="Nama dokter..."
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">Catatan</label>
            <input value={draft.catatan} onChange={e => set("catatan", e.target.value)} placeholder="Keperluan kontrol..."
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => canSave && onSave(draft)} disabled={!canSave}
            className={cn("rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
              canSave ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
                      : "cursor-not-allowed bg-slate-200 text-slate-400")}>
            Simpan Jadwal
          </button>
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
            Batal
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Jadwal Pemeriksaan ────────────────────────────────────

interface PemDraft { jenis: "Lab" | "Radiologi"; nama: string; tanggal: string; catatan: string; }
function emptyPem(): PemDraft { return { jenis: "Lab", nama: "", tanggal: "", catatan: "" }; }

function AddPemeriksaanForm({ onSave, onCancel }: { onSave: (d: PemDraft) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<PemDraft>(emptyPem);
  const canSave = draft.nama.trim() !== "" && draft.tanggal !== "";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Tambah Jadwal Pemeriksaan</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">Jenis</label>
            <div className="flex gap-1.5">
              {(["Lab", "Radiologi"] as const).map(j => (
                <button key={j} type="button" onClick={() => setDraft(d => ({ ...d, jenis: j }))}
                  className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                    draft.jenis === j ? "border-sky-300 bg-sky-100 text-sky-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300")}
                >
                  {j === "Lab" ? <FlaskConical size={11} /> : <ScanLine size={11} />} {j}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">Tanggal <span className="text-red-400">*</span></label>
            <input type="date" value={draft.tanggal} onChange={e => setDraft(d => ({ ...d, tanggal: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">Nama Pemeriksaan <span className="text-red-400">*</span></label>
            <input value={draft.nama} onChange={e => setDraft(d => ({ ...d, nama: e.target.value }))}
              placeholder="cth. Elektrolit, BNP, Foto Thorax PA..."
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">Tujuan / Catatan</label>
            <input value={draft.catatan} onChange={e => setDraft(d => ({ ...d, catatan: e.target.value }))}
              placeholder="Monitoring apa / tujuan pemeriksaan..."
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => canSave && onSave(draft)} disabled={!canSave}
            className={cn("rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
              canSave ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
                      : "cursor-not-allowed bg-slate-200 text-slate-400")}>
            Simpan
          </button>
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
            Batal
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function StepRencanaPulang({ data, onChange }: Props) {
  const [showObatForm,    setShowObatForm]    = useState(false);
  const [showKontrolForm, setShowKontrolForm] = useState(false);
  const [showPemForm,     setShowPemForm]     = useState(false);

  function set<K extends keyof DischargeRencanaPulang>(key: K, val: DischargeRencanaPulang[K]) {
    onChange({ ...data, [key]: val });
  }

  function addObat(draft: ObatDraft) {
    set("obatPulang", [...data.obatPulang, { id: `op-${Date.now()}`, ...draft, fromResep: false }]);
    setShowObatForm(false);
  }

  function addKontrol(draft: KontrolDraft) {
    set("jadwalKontrol", [...data.jadwalKontrol, { id: `jk-${Date.now()}`, ...draft }]);
    setShowKontrolForm(false);
  }

  function addPemeriksaan(draft: PemDraft) {
    set("jadwalPemeriksaan", [...data.jadwalPemeriksaan, { id: `jp-${Date.now()}`, ...draft }]);
    setShowPemForm(false);
  }

  const fmtDate = (iso: string) => iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const hamCount   = data.obatPulang.filter(o => o.isHAM).length;
  const isComplete = data.obatPulang.length > 0 && data.jadwalKontrol.length > 0;

  return (
    <div className="flex flex-col gap-4 xl:flex-row">

      {/* ── Left: Form sections ── */}
      <div className="min-w-0 flex-1 space-y-4">

        {/* Obat Pulang */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={Pill} label="Obat Pulang" std="PMK 72/2016" />
          <div className="space-y-2.5">
            {data.obatPulang.map(item => (
              <ObatCard key={item.id} item={item}
                onDelete={() => set("obatPulang", data.obatPulang.filter(o => o.id !== item.id))}
              />
            ))}
            <AnimatePresence>
              {showObatForm
                ? <AddObatForm key="form" onSave={addObat} onCancel={() => setShowObatForm(false)} />
                : (
                  <motion.button key="btn" type="button" onClick={() => setShowObatForm(true)}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 py-2 text-xs font-semibold text-sky-600 transition hover:bg-sky-100"
                  >
                    <Plus size={13} /> Tambah Obat Pulang
                  </motion.button>
                )
              }
            </AnimatePresence>
          </div>
        </div>

        {/* Jadwal Kontrol */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={Calendar} label="Jadwal Kontrol" std="SNARS ARK 3" />
          <div className="space-y-2">
            {data.jadwalKontrol.map(item => (
              <div key={item.id} className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100">
                  <Calendar size={13} className="text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">{item.poli}</p>
                  <p className="text-[11px] text-slate-500">
                    {fmtDate(item.tanggal)}{item.dokter && ` · ${item.dokter}`}
                  </p>
                  {item.catatan && <p className="mt-1 text-[11px] text-slate-400 italic">{item.catatan}</p>}
                </div>
                <button type="button"
                  onClick={() => set("jadwalKontrol", data.jadwalKontrol.filter(k => k.id !== item.id))}
                  className="shrink-0 rounded-lg p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <AnimatePresence>
              {showKontrolForm
                ? <AddKontrolForm key="form" onSave={addKontrol} onCancel={() => setShowKontrolForm(false)} />
                : (
                  <motion.button key="btn" type="button" onClick={() => setShowKontrolForm(true)}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 py-2 text-xs font-semibold text-sky-600 transition hover:bg-sky-100"
                  >
                    <Plus size={13} /> Tambah Jadwal Kontrol
                  </motion.button>
                )
              }
            </AnimatePresence>
          </div>
        </div>

        {/* Jadwal Pemeriksaan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={FlaskConical} label="Jadwal Pemeriksaan Lab / Radiologi" />
          <div className="space-y-2">
            {data.jadwalPemeriksaan.map(item => (
              <div key={item.id} className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  item.jenis === "Lab" ? "bg-violet-100" : "bg-teal-100",
                )}>
                  {item.jenis === "Lab"
                    ? <FlaskConical size={13} className="text-violet-600" />
                    : <ScanLine size={13} className="text-teal-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-xs font-bold text-slate-800">{item.nama}</p>
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                      item.jenis === "Lab" ? "bg-violet-100 text-violet-700" : "bg-teal-100 text-teal-700",
                    )}>{item.jenis}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{fmtDate(item.tanggal)}</p>
                  {item.catatan && <p className="mt-0.5 text-[11px] text-slate-400 italic">{item.catatan}</p>}
                </div>
                <button type="button"
                  onClick={() => set("jadwalPemeriksaan", data.jadwalPemeriksaan.filter(p => p.id !== item.id))}
                  className="shrink-0 rounded-lg p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <AnimatePresence>
              {showPemForm
                ? <AddPemeriksaanForm key="form" onSave={addPemeriksaan} onCancel={() => setShowPemForm(false)} />
                : (
                  <motion.button key="btn" type="button" onClick={() => setShowPemForm(true)}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 py-2 text-xs font-semibold text-sky-600 transition hover:bg-sky-100"
                  >
                    <Plus size={13} /> Tambah Pemeriksaan
                  </motion.button>
                )
              }
            </AnimatePresence>
          </div>
        </div>

        {/* Rujukan FKTP */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={Building2} label="Rujukan ke FKTP / Fasilitas Lain" />
          <button
            type="button"
            onClick={() => set("adaRujukanFKTP", !data.adaRujukanFKTP)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100 active:bg-slate-200"
          >
            <div>
              <p className="text-xs font-semibold text-slate-700">Perlu Rujukan FKTP</p>
              <p className="text-[11px] text-slate-400">Puskesmas atau klinik pratama terdekat</p>
            </div>
            <Toggle checked={data.adaRujukanFKTP} />
          </button>

          <AnimatePresence initial={false}>
            {data.adaRujukanFKTP && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-slate-500">Nama FKTP</label>
                    <input
                      value={data.fktpNama}
                      onChange={e => set("fktpNama", e.target.value)}
                      placeholder="Puskesmas / Klinik..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-slate-500">Tujuan Rujukan</label>
                    <textarea
                      value={data.fktpTujuan}
                      onChange={e => set("fktpTujuan", e.target.value)}
                      rows={2}
                      placeholder="Monitoring rutin, kepatuhan obat, edukasi berkelanjutan..."
                      className="w-full resize-none rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instruksi Khusus */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={ClipboardCheck} label="Instruksi Khusus Pulang" />
          <textarea
            value={data.instruksiKhusus}
            onChange={e => set("instruksiKhusus", e.target.value)}
            rows={4}
            placeholder="Instruksi aktivitas, diet, tanda bahaya, pemantauan mandiri di rumah..."
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
        </div>

      </div>

      {/* ── Right: Summary sidebar ── */}
      <div className="w-full shrink-0 space-y-3 xl:w-64">

        {/* Overview card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ringkasan Rencana</p>
          <div className="space-y-3">
            {[
              { icon: Pill,          label: "Obat Pulang",       count: data.obatPulang.length,        suffix: "obat",    required: true  },
              { icon: Calendar,      label: "Jadwal Kontrol",    count: data.jadwalKontrol.length,     suffix: "jadwal",  required: true  },
              { icon: FlaskConical,  label: "Pemeriksaan",       count: data.jadwalPemeriksaan.length, suffix: "item",    required: false },
            ].map(({ icon: Icon, label, count, suffix, required }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  count > 0 ? "bg-sky-50" : "bg-slate-100",
                )}>
                  <Icon size={13} className={count > 0 ? "text-sky-500" : "text-slate-400"} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-slate-700">{label}</p>
                  <p className={cn("text-[10px]", count > 0 ? "text-sky-600" : "text-slate-400")}>
                    {count > 0 ? `${count} ${suffix}` : required ? "Wajib diisi" : "Opsional"}
                  </p>
                </div>
                {count > 0 && <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />}
              </div>
            ))}

            {hamCount > 0 && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <AlertTriangle size={12} className="shrink-0 text-red-500" />
                <p className="text-[11px] font-semibold text-red-700">{hamCount} High-Alert Medication</p>
              </div>
            )}
          </div>
        </div>

        {/* FKTP status */}
        <div className={cn(
          "rounded-xl border p-3.5",
          data.adaRujukanFKTP ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white",
        )}>
          <div className="flex items-center gap-2">
            <Building2 size={13} className={data.adaRujukanFKTP ? "text-emerald-500" : "text-slate-400"} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Rujukan FKTP</p>
              <p className={cn("text-[11px] font-semibold",
                data.adaRujukanFKTP ? "text-emerald-700" : "text-slate-400")}>
                {data.adaRujukanFKTP
                  ? data.fktpNama || "FKTP dipilih"
                  : "Tidak ada rujukan"}
              </p>
            </div>
          </div>
        </div>

        {/* Completeness checklist */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Kelengkapan</p>
          <div className="space-y-2">
            {[
              { label: "Obat pulang diisi",      done: data.obatPulang.length > 0        },
              { label: "Jadwal kontrol diisi",   done: data.jadwalKontrol.length > 0     },
              { label: "Instruksi khusus diisi", done: data.instruksiKhusus.trim() !== "" },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  done ? "bg-emerald-500" : "bg-slate-200",
                )}>
                  {done && <CheckCircle2 size={10} className="text-white" />}
                </div>
                <span className={cn("text-[11px]", done ? "text-slate-700" : "text-slate-400")}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
          >
            <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
            <p className="text-xs font-semibold text-emerald-700">Rencana pulang lengkap</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
