"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartHandshake, Plus, Trash2 } from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

type SubTab = "Pengkajian" | "Diagnosa" | "Intervensi";

interface DataItem    { id: string; isi: string }
interface DiagnosaEntry {
  id: string; diagnosa: string; tujuan: string; target: string;
}
interface IntervensiEntry {
  id: string; intervensi: string; evaluasi: string; waktu: string; pelaksana: string;
}

// ── Config ─────────────────────────────────────────────────

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "Pengkajian", label: "Pengkajian"           },
  { id: "Diagnosa",   label: "Diagnosa & Luaran"    },
  { id: "Intervensi", label: "Intervensi & Evaluasi"},
];

// ── Shared bottom-border primitives ───────────────────────

function BInput({
  label, value, onChange, placeholder, className,
}: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400"
      />
    </div>
  );
}

function BTextarea({
  label, value, onChange, placeholder, rows = 2,
}: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div>
      {label && (
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      )}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400"
      />
    </div>
  );
}

// ── Data column (Mayor / Minor) ────────────────────────────

function DataColumn({
  title, accentBorder, items, onAdd, onRemove, onChange,
}: {
  title: string; accentBorder: string;
  items: DataItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, isi: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("flex items-center justify-between rounded-lg border-l-2 bg-slate-50 px-3 py-2", accentBorder)}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{title}</p>
        <button
          onClick={onAdd}
          aria-label={`Tambah ${title}`}
          className="flex cursor-pointer items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 transition hover:text-indigo-600 hover:ring-indigo-300"
        >
          <Plus size={10} />
          Tambah
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 py-4 text-center text-[11px] text-slate-400">
          Belum ada data
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {items.map((item, idx) => (
            <div key={item.id} className="group flex items-start gap-2">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 transition group-focus-within:bg-indigo-400" />
              <input
                value={item.isi}
                onChange={(e) => onChange(item.id, e.target.value)}
                placeholder={`Data ${idx + 1}...`}
                className="flex-1 border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
              />
              <button
                onClick={() => onRemove(item.id)}
                aria-label="Hapus"
                className="mt-1.5 shrink-0 cursor-pointer text-slate-300 transition-colors hover:text-rose-500"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pengkajian pane ────────────────────────────────────────

function PengkajianPane() {
  const [subjektif, setSubjektif] = useState("");
  const [objektif,  setObjektif]  = useState("");
  const [mayorItems, setMayorItems] = useState<DataItem[]>([]);
  const [minorItems, setMinorItems] = useState<DataItem[]>([]);

  function addItem(setter: React.Dispatch<React.SetStateAction<DataItem[]>>) {
    setter((p) => [...p, { id: `d-${Date.now()}`, isi: "" }]);
  }
  function removeItem(setter: React.Dispatch<React.SetStateAction<DataItem[]>>, id: string) {
    setter((p) => p.filter((i) => i.id !== id));
  }
  function updateItem(setter: React.Dispatch<React.SetStateAction<DataItem[]>>, id: string, isi: string) {
    setter((p) => p.map((i) => (i.id === id ? { ...i, isi } : i)));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Subjektif / Objektif */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Data Subjektif (S)</p>
          <BTextarea
            value={subjektif}
            onChange={setSubjektif}
            placeholder="Keluhan yang disampaikan pasien atau keluarga..."
            rows={3}
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Data Objektif (O)</p>
          <BTextarea
            value={objektif}
            onChange={setObjektif}
            placeholder="Hasil observasi, pemeriksaan, tanda vital..."
            rows={3}
          />
        </div>
      </div>

      {/* Mayor / Minor */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Data Pengkajian</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <DataColumn
            title="Data Mayor"
            accentBorder="border-l-indigo-400"
            items={mayorItems}
            onAdd={() => addItem(setMayorItems)}
            onRemove={(id) => removeItem(setMayorItems, id)}
            onChange={(id, isi) => updateItem(setMayorItems, id, isi)}
          />
          <DataColumn
            title="Data Minor"
            accentBorder="border-l-slate-300"
            items={minorItems}
            onAdd={() => addItem(setMinorItems)}
            onRemove={(id) => removeItem(setMinorItems, id)}
            onChange={(id, isi) => updateItem(setMinorItems, id, isi)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700">
          Simpan Pengkajian
        </button>
      </div>
    </div>
  );
}

// ── Diagnosa pane ──────────────────────────────────────────

function DiagnosaPane() {
  const [entries, setEntries] = useState<DiagnosaEntry[]>([]);
  const [form, setForm] = useState({ diagnosa: "", tujuan: "", target: "" });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function handleAdd() {
    if (!form.diagnosa) return;
    setEntries((p) => [...p, { id: `dn-${Date.now()}`, ...form }]);
    setForm({ diagnosa: "", tujuan: "", target: "" });
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
      {/* Form */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:w-80 md:shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Tambah Diagnosa Keperawatan
        </p>
        <BTextarea
          label="Diagnosa Keperawatan"
          value={form.diagnosa}
          onChange={(v) => set("diagnosa", v)}
          placeholder="Contoh: Nyeri akut b.d agen cedera fisik..."
          rows={3}
        />
        <BTextarea
          label="Tujuan / Luaran (NOC)"
          value={form.tujuan}
          onChange={(v) => set("tujuan", v)}
          placeholder="Nyeri berkurang dalam 2×24 jam..."
          rows={2}
        />
        <BInput
          label="Target Waktu"
          value={form.target}
          onChange={(v) => set("target", v)}
          placeholder="Contoh: 2×24 jam, sebelum pulang..."
        />
        <button
          onClick={handleAdd}
          disabled={!form.diagnosa}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={12} />
          Tambah Diagnosa
        </button>
      </div>

      {/* List */}
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-xs font-semibold text-slate-700">
          Daftar Diagnosa
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {entries.length}
          </span>
        </p>
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-xs text-slate-400 shadow-xs">
            Belum ada diagnosa keperawatan
          </div>
        ) : (
          entries.map((e, idx) => (
            <div key={e.id} className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                  {idx + 1}
                </span>
                <p className="flex-1 text-xs font-semibold leading-relaxed text-slate-800">{e.diagnosa}</p>
                <button
                  onClick={() => setEntries((p) => p.filter((i) => i.id !== e.id))}
                  aria-label="Hapus diagnosa"
                  className="shrink-0 cursor-pointer text-slate-300 transition-colors hover:text-rose-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {e.tujuan && (
                <p className="ml-7 text-[11px] text-slate-500">
                  <span className="font-semibold">Tujuan:</span> {e.tujuan}
                </p>
              )}
              {e.target && (
                <span className="ml-7 w-fit rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  Target: {e.target}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Intervensi pane ────────────────────────────────────────

function IntervensiPane() {
  const [entries, setEntries] = useState<IntervensiEntry[]>([]);
  const [form, setForm] = useState({ intervensi: "", evaluasi: "", waktu: "", pelaksana: "" });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function handleAdd() {
    if (!form.intervensi) return;
    setEntries((p) => [...p, { id: `iv-${Date.now()}`, ...form }]);
    setForm({ intervensi: "", evaluasi: "", waktu: "", pelaksana: "" });
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
      {/* Form */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:w-80 md:shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Tambah Intervensi
        </p>
        <BTextarea
          label="Intervensi Keperawatan (NIC)"
          value={form.intervensi}
          onChange={(v) => set("intervensi", v)}
          placeholder="Rencana intervensi atau tindakan keperawatan..."
          rows={3}
        />
        <BTextarea
          label="Evaluasi"
          value={form.evaluasi}
          onChange={(v) => set("evaluasi", v)}
          placeholder="Respon pasien terhadap intervensi..."
          rows={2}
        />
        <div className="grid grid-cols-2 gap-2">
          <BInput
            label="Waktu"
            value={form.waktu}
            onChange={(v) => set("waktu", v)}
            placeholder="08:00"
          />
          <BInput
            label="Pelaksana"
            value={form.pelaksana}
            onChange={(v) => set("pelaksana", v)}
            placeholder="Nama perawat..."
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!form.intervensi}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={12} />
          Tambah Intervensi
        </button>
      </div>

      {/* List */}
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-xs font-semibold text-slate-700">
          Catatan Intervensi & Evaluasi
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {entries.length}
          </span>
        </p>
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-xs text-slate-400 shadow-xs">
            Belum ada catatan intervensi
          </div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1 text-xs font-medium leading-relaxed text-slate-800">{e.intervensi}</p>
                <button
                  onClick={() => setEntries((p) => p.filter((i) => i.id !== e.id))}
                  aria-label="Hapus"
                  className="shrink-0 cursor-pointer text-slate-300 transition-colors hover:text-rose-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {e.evaluasi && (
                <p className="text-[11px] leading-relaxed text-slate-500">
                  <span className="font-semibold text-indigo-600">Evaluasi:</span> {e.evaluasi}
                </p>
              )}
              <div className="flex gap-3 text-[10px] text-slate-400">
                {e.waktu     && <span>{e.waktu}</span>}
                {e.pelaksana && <span>{e.pelaksana}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function KeperawatanTab({ patient }: { patient: IGDPatientDetail }) {
  const [active, setActive] = useState<SubTab>("Pengkajian");

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <HeartHandshake size={14} className="text-indigo-500" />
        <span className="text-xs font-semibold text-slate-700">Asuhan Keperawatan</span>
      </div>

      {/* Sub-tab nav — sticky with Framer Motion layoutId underline */}
      <div className="sticky top-0 z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex overflow-x-auto">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "relative shrink-0 cursor-pointer px-5 py-3 text-xs font-medium transition-colors",
                active === tab.id ? "text-indigo-700" : "text-slate-500 hover:text-slate-700",
              )}
            >
              {tab.label}
              {active === tab.id && (
                <motion.div
                  layoutId="keperawatan-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {active === "Pengkajian" && <PengkajianPane />}
          {active === "Diagnosa"   && <DiagnosaPane />}
          {active === "Intervensi" && <IntervensiPane />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
