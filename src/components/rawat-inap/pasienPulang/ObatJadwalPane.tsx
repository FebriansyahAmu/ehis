"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, Building2, CalendarCheck, FlaskConical,
  MapPin, Pill, Plus, Radiation, Trash2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type JadwalKontrol, type JadwalPemeriksaan, type ObatPulangItem, type PasienPulangData,
  POLI_OPTIONS,
} from "./pasienPulangShared";

type Props = {
  data:     PasienPulangData;
  onChange: (d: PasienPulangData) => void;
};

function SectionTitle({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
      <Icon size={12} className="text-orange-400" />
      <p className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {count !== undefined && (
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{count}</span>
      )}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="shrink-0">
      <div className={cn(
        "relative h-5 w-9 rounded-full transition-colors duration-200",
        checked ? "bg-orange-400" : "bg-slate-300",
      )}>
        <span className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0.5",
        )} />
      </div>
    </button>
  );
}

// ── Obat Pulang ───────────────────────────────────────────

function ObatPulangSection({
  items, onChange,
}: { items: ObatPulangItem[]; onChange: (items: ObatPulangItem[]) => void }) {
  const EMPTY = { id: "", namaObat: "", dosis: "", frekuensi: "", durasi: "", instruksi: "", isHAM: false, fromResep: false };
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [draft, setDraft] = useState<Omit<ObatPulangItem, "id" | "fromResep">>({
    namaObat: "", dosis: "", frekuensi: "", durasi: "", instruksi: "", isHAM: false,
  });

  const canSave = draft.namaObat.trim() && draft.dosis.trim() && draft.frekuensi.trim();

  function save() {
    if (!canSave) return;
    onChange([...items, { ...draft, id: `op-${Date.now()}`, fromResep: false }]);
    setDraft({ namaObat: "", dosis: "", frekuensi: "", durasi: "", instruksi: "", isHAM: false });
    setForm(null);
  }

  return (
    <div>
      <div className="space-y-2">
        {items.length === 0 && !form && (
          <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-[11px] text-slate-400">
            Belum ada obat pulang
          </p>
        )}
        <AnimatePresence>
          {items.map(ob => (
            <motion.div
              key={ob.id}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <Pill size={12} className="mt-0.5 shrink-0 text-orange-400" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[12px] font-semibold text-slate-700">{ob.namaObat}</p>
                  {ob.isHAM && (
                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-red-600">
                      HAM
                    </span>
                  )}
                  {ob.fromResep && (
                    <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[8px] font-semibold text-sky-600">
                      dari Resep
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">{ob.dosis} · {ob.frekuensi} · {ob.durasi}</p>
                {ob.instruksi && <p className="mt-1 text-[10px] text-slate-400">{ob.instruksi}</p>}
              </div>
              <button
                onClick={() => onChange(items.filter(i => i.id !== ob.id))}
                className="shrink-0 rounded-lg p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add form */}
        <AnimatePresence>
          {form !== null && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-orange-200 bg-orange-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold text-orange-700">Tambah Obat Pulang</p>
                <button onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([ ["Nama Obat *", "namaObat", "text"], ["Dosis *", "dosis", "text"], ["Frekuensi *", "frekuensi", "text"], ["Durasi", "durasi", "text"] ] as const).map(([lbl, key, type]) => (
                  <div key={key}>
                    <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">{lbl}</label>
                    <input
                      type={type}
                      value={draft[key] as string}
                      onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                      placeholder={lbl.replace(" *", "")}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none transition focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">Instruksi Khusus</label>
                <input
                  value={draft.instruksi}
                  onChange={e => setDraft(d => ({ ...d, instruksi: e.target.value }))}
                  placeholder="Instruksi penggunaan..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none transition focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.isHAM}
                    onChange={e => setDraft(d => ({ ...d, isHAM: e.target.checked }))}
                    className="accent-red-500"
                  />
                  <span className="text-[11px] text-slate-600">High-Alert Medication (HAM)</span>
                </label>
                <button
                  onClick={save}
                  disabled={!canSave}
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white transition disabled:opacity-40 hover:bg-orange-600 active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {form === null && (
        <button
          onClick={() => setForm(EMPTY)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-orange-200 py-2.5 text-[11px] font-medium text-orange-500 transition hover:border-orange-300 hover:bg-orange-50"
        >
          <Plus size={12} /> Tambah Obat
        </button>
      )}

      {items.some(i => i.isHAM) && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <AlertTriangle size={11} className="shrink-0 text-red-500" />
          <p className="text-[10px] text-red-700">Terdapat obat High-Alert. Pastikan double-check dan edukasi khusus sudah diberikan.</p>
        </div>
      )}
    </div>
  );
}

// ── Jadwal Kontrol ────────────────────────────────────────

function JadwalKontrolSection({
  items, onChange,
}: { items: JadwalKontrol[]; onChange: (items: JadwalKontrol[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ tanggal: "", poli: "", dokter: "", catatan: "" });

  const canSave = draft.tanggal && draft.poli;

  function save() {
    if (!canSave) return;
    onChange([...items, { ...draft, id: `jk-${Date.now()}` }]);
    setDraft({ tanggal: "", poli: "", dokter: "", catatan: "" });
    setShowForm(false);
  }

  return (
    <div>
      <div className="space-y-2">
        {items.length === 0 && !showForm && (
          <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-[11px] text-slate-400">
            Belum ada jadwal kontrol
          </p>
        )}
        <AnimatePresence>
          {items.map(jk => (
            <motion.div
              key={jk.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <CalendarCheck size={12} className="mt-0.5 shrink-0 text-orange-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-700">
                  {new Date(jk.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-[11px] text-slate-500">{jk.poli}{jk.dokter ? ` · ${jk.dokter}` : ""}</p>
                {jk.catatan && <p className="mt-0.5 text-[10px] text-slate-400">{jk.catatan}</p>}
              </div>
              <button onClick={() => onChange(items.filter(i => i.id !== jk.id))} className="shrink-0 rounded-lg p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-orange-200 bg-orange-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold text-orange-700">Tambah Jadwal Kontrol</p>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">Tanggal *</label>
                  <input type="date" value={draft.tanggal} onChange={e => setDraft(d => ({ ...d, tanggal: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">Poliklinik *</label>
                  <select value={draft.poli} onChange={e => setDraft(d => ({ ...d, poli: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                  >
                    <option value="">Pilih poli...</option>
                    {POLI_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-2">
                <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">Dokter</label>
                <input value={draft.dokter} onChange={e => setDraft(d => ({ ...d, dokter: e.target.value }))} placeholder="Nama dokter..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                />
              </div>
              <div className="mt-2">
                <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">Catatan</label>
                <input value={draft.catatan} onChange={e => setDraft(d => ({ ...d, catatan: e.target.value }))} placeholder="Catatan tambahan..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                />
              </div>
              <div className="mt-2 flex justify-end">
                <button onClick={save} disabled={!canSave}
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white transition disabled:opacity-40 hover:bg-orange-600 active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-orange-200 py-2.5 text-[11px] font-medium text-orange-500 transition hover:border-orange-300 hover:bg-orange-50"
        >
          <Plus size={12} /> Tambah Jadwal Kontrol
        </button>
      )}
    </div>
  );
}

// ── Jadwal Pemeriksaan ────────────────────────────────────

function JadwalPemeriksaanSection({
  items, onChange,
}: { items: JadwalPemeriksaan[]; onChange: (items: JadwalPemeriksaan[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ jenis: "Lab" as "Lab" | "Radiologi", nama: "", tanggal: "", catatan: "" });

  const canSave = draft.nama.trim() && draft.tanggal;

  function save() {
    if (!canSave) return;
    onChange([...items, { ...draft, id: `jp-${Date.now()}` }]);
    setDraft({ jenis: "Lab", nama: "", tanggal: "", catatan: "" });
    setShowForm(false);
  }

  return (
    <div>
      <div className="space-y-2">
        {items.length === 0 && !showForm && (
          <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-[11px] text-slate-400">
            Belum ada jadwal pemeriksaan
          </p>
        )}
        <AnimatePresence>
          {items.map(jp => (
            <motion.div
              key={jp.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              {jp.jenis === "Lab"
                ? <FlaskConical size={12} className="mt-0.5 shrink-0 text-violet-400" />
                : <Radiation    size={12} className="mt-0.5 shrink-0 text-sky-400" />
              }
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-semibold text-slate-700">{jp.nama}</p>
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                    jp.jenis === "Lab" ? "bg-violet-100 text-violet-600" : "bg-sky-100 text-sky-600",
                  )}>{jp.jenis}</span>
                </div>
                <p className="text-[11px] text-slate-500">{new Date(jp.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                {jp.catatan && <p className="mt-0.5 text-[10px] text-slate-400">{jp.catatan}</p>}
              </div>
              <button onClick={() => onChange(items.filter(i => i.id !== jp.id))} className="shrink-0 rounded-lg p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-orange-200 bg-orange-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold text-orange-700">Tambah Jadwal Pemeriksaan</p>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">Jenis</label>
                  <select value={draft.jenis} onChange={e => setDraft(d => ({ ...d, jenis: e.target.value as "Lab" | "Radiologi" }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                  >
                    <option value="Lab">Lab</option>
                    <option value="Radiologi">Radiologi</option>
                  </select>
                </div>
                <div>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">Tanggal *</label>
                  <input type="date" value={draft.tanggal} onChange={e => setDraft(d => ({ ...d, tanggal: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">Nama Pemeriksaan *</label>
                <input value={draft.nama} onChange={e => setDraft(d => ({ ...d, nama: e.target.value }))} placeholder="cth: Elektrolit (Na, K, Mg)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                />
              </div>
              <div className="mt-2">
                <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">Catatan</label>
                <input value={draft.catatan} onChange={e => setDraft(d => ({ ...d, catatan: e.target.value }))} placeholder="Catatan..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                />
              </div>
              <div className="mt-2 flex justify-end">
                <button onClick={save} disabled={!canSave}
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white transition disabled:opacity-40 hover:bg-orange-600 active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-orange-200 py-2.5 text-[11px] font-medium text-orange-500 transition hover:border-orange-300 hover:bg-orange-50"
        >
          <Plus size={12} /> Tambah Jadwal Pemeriksaan
        </button>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function ObatJadwalPane({ data, onChange }: Props) {
  function set<K extends keyof PasienPulangData>(key: K, val: PasienPulangData[K]) {
    onChange({ ...data, [key]: val });
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row">

      {/* ── Left: Obat + Jadwal ── */}
      <div className="min-w-0 flex-1 space-y-4">

        {/* Obat Pulang */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={Pill} label="Obat Pulang" count={data.obatPulang.length} />
          <ObatPulangSection items={data.obatPulang} onChange={items => set("obatPulang", items)} />
        </div>

        {/* Jadwal Kontrol */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={CalendarCheck} label="Jadwal Kontrol Poliklinik" count={data.jadwalKontrol.length} />
          <JadwalKontrolSection items={data.jadwalKontrol} onChange={items => set("jadwalKontrol", items)} />
        </div>

        {/* Jadwal Pemeriksaan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={FlaskConical} label="Jadwal Pemeriksaan Lanjutan" count={data.jadwalPemeriksaan.length} />
          <JadwalPemeriksaanSection items={data.jadwalPemeriksaan} onChange={items => set("jadwalPemeriksaan", items)} />
        </div>

      </div>

      {/* ── Right: FKTP + Summary ── */}
      <div className="w-full shrink-0 space-y-3 xl:w-64">

        {/* FKTP */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={Building2} label="Rujukan FKTP" />
          <button
            onClick={() => set("adaRujukanFKTP", !data.adaRujukanFKTP)}
            className="mb-3 flex w-full items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
          >
            <div className="text-left">
              <p className="text-[11px] font-semibold text-slate-700">Rujukan ke FKTP</p>
              <p className="text-[10px] text-slate-400">Puskesmas / faskes primer</p>
            </div>
            <Toggle checked={data.adaRujukanFKTP} onChange={v => set("adaRujukanFKTP", v)} />
          </button>
          <AnimatePresence>
            {data.adaRujukanFKTP && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <div>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">Nama FKTP</label>
                  <input
                    value={data.fktpNama}
                    onChange={e => set("fktpNama", e.target.value)}
                    placeholder="cth: Puskesmas Menteng"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">Tujuan Rujukan</label>
                  <textarea
                    value={data.fktpTujuan}
                    onChange={e => set("fktpTujuan", e.target.value)}
                    rows={2}
                    placeholder="Monitoring TTV, kepatuhan obat..."
                    className="w-full resize-none rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ringkasan</p>
          <div className="space-y-2">
            {[
              { icon: Pill,         label: "Obat pulang",       val: data.obatPulang.length },
              { icon: CalendarCheck, label: "Jadwal kontrol",   val: data.jadwalKontrol.length },
              { icon: FlaskConical,  label: "Jadwal pemeriksaan", val: data.jadwalPemeriksaan.length },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={10} className="text-slate-400" />
                  <p className="text-[11px] text-slate-500">{label}</p>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  val > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
                )}>{val}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <div className="flex items-center gap-1.5">
                <MapPin size={10} className="text-slate-400" />
                <p className="text-[11px] text-slate-500">Rujukan FKTP</p>
              </div>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                data.adaRujukanFKTP ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
              )}>
                {data.adaRujukanFKTP ? "Ada" : "Tidak"}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
