"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ScanLine, FlaskConical, Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import StatusFisikPane, { type PemeriksaanFormState, emptyFormState } from "@/components/shared/medical-records/pemeriksaan/StatusFisikPane";

// ── Types ──────────────────────────────────────────────────

type SubTab = "fisik" | "anatomi" | "penunjang";

interface HasilEntry {
  id: string;
  jenis: string;
  nama: string;
  nilai: string;
  satuan: string;
  normal: string;
  tanggal: string;
}

// ── Sub-tab config ─────────────────────────────────────────

const SUB_TABS: { id: SubTab; label: string; Icon: React.ElementType }[] = [
  { id: "fisik",     label: "Fisik",      Icon: Activity    },
  { id: "anatomi",   label: "Anatomi",    Icon: ScanLine    },
  { id: "penunjang", label: "Penunjang",  Icon: FlaskConical},
];

// ── Metadata header ────────────────────────────────────────

function MetaHeader({
  tanggal, jam, dokter, perawat, onChange,
}: {
  tanggal: string; jam: string; dokter: string; perawat: string;
  onChange: (field: "tanggal" | "jam" | "dokter" | "perawat", v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs sm:grid-cols-4">
      {([
        { id: "tanggal", label: "Tanggal",          type: "date" },
        { id: "jam",     label: "Jam",              type: "time" },
        { id: "dokter",  label: "Dokter Pemeriksa", type: "text" },
        { id: "perawat", label: "Perawat",          type: "text" },
      ] as const).map(({ id, label, type }) => (
        <div key={id}>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <input
            type={type}
            value={id === "tanggal" ? tanggal : id === "jam" ? jam : id === "dokter" ? dokter : perawat}
            onChange={(e) => onChange(id, e.target.value)}
            placeholder={type === "text" ? "—" : undefined}
            className="w-full border-b border-slate-200 bg-transparent py-1 text-xs font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:border-indigo-400"
          />
        </div>
      ))}
    </div>
  );
}

// ── ANATOMI pane ───────────────────────────────────────────

const BODY_REGIONS = [
  { id: "kepala",         label: "Kepala",         col: 2, row: 1 },
  { id: "leher",          label: "Leher",          col: 2, row: 2 },
  { id: "dada_kiri",      label: "Dada Kiri",      col: 1, row: 3 },
  { id: "dada_kanan",     label: "Dada Kanan",     col: 3, row: 3 },
  { id: "abdomen",        label: "Abdomen",        col: 2, row: 4 },
  { id: "pinggang_kiri",  label: "Pinggang Kiri",  col: 1, row: 4 },
  { id: "pinggang_kanan", label: "Pinggang Kanan", col: 3, row: 4 },
  { id: "panggul",        label: "Panggul",        col: 2, row: 5 },
  { id: "paha_kiri",      label: "Paha Kiri",      col: 1, row: 6 },
  { id: "paha_kanan",     label: "Paha Kanan",     col: 3, row: 6 },
  { id: "lutut_kiri",     label: "Lutut Kiri",     col: 1, row: 7 },
  { id: "lutut_kanan",    label: "Lutut Kanan",    col: 3, row: 7 },
  { id: "kaki_kiri",      label: "Kaki Kiri",      col: 1, row: 8 },
  { id: "kaki_kanan",     label: "Kaki Kanan",     col: 3, row: 8 },
  { id: "bahu_kiri",      label: "Bahu Kiri",      col: 0, row: 3 },
  { id: "bahu_kanan",     label: "Bahu Kanan",     col: 4, row: 3 },
  { id: "lengan_kiri",    label: "Lengan Kiri",    col: 0, row: 4 },
  { id: "lengan_kanan",   label: "Lengan Kanan",   col: 4, row: 4 },
  { id: "tangan_kiri",    label: "Tangan Kiri",    col: 0, row: 5 },
  { id: "tangan_kanan",   label: "Tangan Kanan",   col: 4, row: 5 },
];

interface RegionNote { region: string; label: string; catatan: string }

function AnatomiPane() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes]       = useState<RegionNote[]>([]);
  const [editing, setEditing]   = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  function toggleRegion(id: string, label: string) {
    setSelected((p) => {
      const next = new Set(p);
      if (next.has(id)) {
        next.delete(id);
        setNotes((n) => n.filter((r) => r.region !== id));
        if (editing === id) setEditing(null);
      } else {
        next.add(id);
        setNotes((n) => [...n, { region: id, label, catatan: "" }]);
        setEditing(id);
        setEditText("");
      }
      return next;
    });
  }

  function saveNote(region: string) {
    setNotes((p) => p.map((n) => n.region === region ? { ...n, catatan: editText } : n));
    setEditing(null);
  }

  const gridCols = 5;
  const gridRows = 8;
  const grid: (typeof BODY_REGIONS[0] | null)[][] = Array.from({ length: gridRows }, (_, r) =>
    Array.from({ length: gridCols }, (_, c) =>
      BODY_REGIONS.find((b) => b.row === r + 1 && b.col === c) ?? null
    )
  );

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-4">
      {/* Body grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:w-64 md:shrink-0">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Klik area tubuh untuk menandai
        </p>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {grid.flat().map((region, idx) =>
            region ? (
              <button
                key={region.id}
                onClick={() => toggleRegion(region.id, region.label)}
                title={region.label}
                className={cn(
                  "cursor-pointer rounded px-1 py-1.5 text-[9px] font-medium leading-tight transition-colors",
                  selected.has(region.id)
                    ? "bg-rose-500 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-700",
                )}
              >
                {region.label.split(" ").map((w) => w[0]).join("")}
              </button>
            ) : (
              <div key={idx} />
            )
          )}
        </div>
        <p className="mt-2 text-[10px] text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500 mr-1" />
          Area yang ditandai
        </p>
      </div>

      {/* Notes */}
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-xs font-semibold text-slate-700">
          Catatan Area Tubuh
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {selected.size}
          </span>
        </p>
        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-xs text-slate-400 shadow-xs">
            Klik area tubuh di kiri untuk menandai dan mencatat temuan
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.region} className="rounded-xl border border-rose-100 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">{n.label}</span>
                <button
                  onClick={() => toggleRegion(n.region, n.label)}
                  aria-label="Hapus"
                  className="shrink-0 cursor-pointer text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {editing === n.region ? (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Temuan / catatan..."
                    className="flex-1 border-b border-slate-200 bg-transparent py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={() => saveNote(n.region)}
                    className="cursor-pointer rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-indigo-700"
                  >
                    Simpan
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditing(n.region); setEditText(n.catatan); }}
                  className="mt-1.5 w-full cursor-pointer text-left text-[11px] text-slate-500 hover:text-indigo-600"
                >
                  {n.catatan || <span className="italic text-slate-300">Klik untuk tambah catatan...</span>}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── PENUNJANG pane ─────────────────────────────────────────

const JENIS_OPTIONS = ["Laboratorium", "Radiologi", "EKG", "USG", "Lainnya"];

function PenunjangPane() {
  const [entries, setEntries] = useState<HasilEntry[]>([]);
  const [form, setForm] = useState<Omit<HasilEntry, "id">>({
    jenis: "Laboratorium", nama: "", nilai: "", satuan: "", normal: "", tanggal: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function handleAdd() {
    if (!form.nama) return;
    setEntries((p) => [...p, { id: `p-${Date.now()}`, ...form }]);
    setForm((p) => ({ ...p, nama: "", nilai: "", satuan: "", normal: "", tanggal: "" }));
  }

  const grouped = entries.reduce<Record<string, HasilEntry[]>>((acc, e) => {
    (acc[e.jenis] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-4">
      {/* Form */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:w-72 md:shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Tambah Hasil Pemeriksaan</p>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Jenis</p>
          <div className="flex flex-wrap gap-1">
            {JENIS_OPTIONS.map((j) => (
              <button
                key={j}
                onClick={() => set("jenis", j)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors",
                  form.jenis === j
                    ? "bg-indigo-600 text-white ring-indigo-600"
                    : "bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300",
                )}
              >
                {j}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nama Pemeriksaan</p>
          <input
            value={form.nama}
            onChange={(e) => set("nama", e.target.value)}
            placeholder="Contoh: Hemoglobin, foto toraks..."
            className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nilai / Hasil</p>
            <input value={form.nilai} onChange={(e) => set("nilai", e.target.value)}
              placeholder="12.5"
              className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400" />
          </div>
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Satuan</p>
            <input value={form.satuan} onChange={(e) => set("satuan", e.target.value)}
              placeholder="g/dL"
              className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400" />
          </div>
        </div>

        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nilai Normal</p>
          <input value={form.normal} onChange={(e) => set("normal", e.target.value)}
            placeholder="12.0 – 16.0 g/dL"
            className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400" />
        </div>

        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal</p>
          <input type="date" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)}
            className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-400" />
        </div>

        <button
          onClick={handleAdd}
          disabled={!form.nama}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={12} />
          Tambah Hasil
        </button>
      </div>

      {/* Results */}
      <div className="flex flex-1 flex-col gap-3">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-5 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30">
          <Upload size={18} className="text-slate-300" />
          <span className="text-xs font-medium text-slate-500">Upload file hasil lab / radiologi</span>
          <span className="text-[11px] text-slate-400">PDF, JPG, PNG — maks. 10 MB</span>
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
        </label>

        {Object.keys(grouped).length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-xs text-slate-400 shadow-xs">
            Belum ada hasil pemeriksaan
          </div>
        ) : (
          Object.entries(grouped).map(([jenis, items]) => (
            <div key={jenis} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2">
                <span className="text-[11px] font-semibold text-slate-600">{jenis}</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pemeriksaan</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">Hasil</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Normal</th>
                    <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal</th>
                    <th className="w-8 px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-700">{item.nama}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-800">
                        {item.nilai} <span className="font-normal text-slate-400">{item.satuan}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">{item.normal || "—"}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{item.tanggal || "—"}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setEntries((p) => p.filter((e) => e.id !== item.id))}
                          aria-label="Hapus"
                          className="cursor-pointer text-slate-300 transition-colors hover:text-rose-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function PemeriksaanTab() {
  const [active, setActive] = useState<SubTab>("fisik");

  const [meta, setMeta] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    jam:     new Date().toTimeString().slice(0, 5),
    dokter:  "",
    perawat: "",
  });

  const [formState, setFormState] = useState<PemeriksaanFormState>(() => ({
    ...emptyFormState(),
    tanggal: new Date().toISOString().slice(0, 10),
    jam:     new Date().toTimeString().slice(0, 5),
  }));

  function handleMetaChange(field: "tanggal" | "jam" | "dokter" | "perawat", v: string) {
    setMeta((p) => ({ ...p, [field]: v }));
    setFormState((p) => ({ ...p, [field]: v }));
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Top bar */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <Activity size={16} className="text-indigo-500" />
        <span className="text-sm font-semibold text-slate-700">Pemeriksaan Fisik</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-400">Head-to-toe · SNARS AP 1</span>
      </div>

      {/* Metadata header */}
      <MetaHeader
        tanggal={meta.tanggal}
        jam={meta.jam}
        dokter={meta.dokter}
        perawat={meta.perawat}
        onChange={handleMetaChange}
      />

      {/* Sub-tab nav */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex overflow-x-auto">
          {SUB_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={cn(
                "relative flex shrink-0 cursor-pointer items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors",
                active === id ? "text-indigo-700" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Icon size={13} aria-hidden />
              {label}
              {active === id && (
                <motion.div
                  layoutId="pemeriksaan-underline"
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
          {active === "fisik" && (
            <StatusFisikPane
              initial={formState}
              onSave={(data) => setFormState(data)}
            />
          )}
          {active === "anatomi"   && <AnatomiPane />}
          {active === "penunjang" && <PenunjangPane />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
