"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Plus, Trash2, Search, Save, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PPK_INITIAL,
  type PPKRecord,
  type JenisFaskes,
  type TipePPK,
  type KelasFaskes,
  type KepemilikanFaskes,
} from "@/lib/master/ppkStore";

const JENIS_OPTIONS: JenisFaskes[]       = ["RS Umum", "RS Khusus", "RSIA", "Puskesmas", "Klinik Pratama", "Klinik Utama", "Balai Kesehatan", "Lab Klinik"];
const TIPE_OPTIONS:  TipePPK[]           = ["PPK I", "PPK II", "PPK III"];
const KELAS_OPTIONS: KelasFaskes[]       = ["A", "B", "C", "D", "-"];
const KEPEMILIKAN_OPTIONS: KepemilikanFaskes[] = ["Pemerintah", "Swasta", "BUMN", "TNI/Polri"];

const TIPE_CFG: Record<TipePPK, string> = {
  "PPK I":   "bg-sky-100 text-sky-700",
  "PPK II":  "bg-amber-100 text-amber-700",
  "PPK III": "bg-rose-100 text-rose-700",
};

const base =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-3 w-32" />
          <Bone className="h-5 w-52" />
          <Bone className="h-3 w-80" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-12 w-24" />
          <Bone className="h-12 w-24" />
          <Bone className="h-12 w-24" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <Bone className="h-full w-[240px]" />
        <Bone className="h-full flex-1" />
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub,
}: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-black text-slate-900">{value}</p>
      {sub && <p className="text-[9px] text-slate-400">{sub}</p>}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function emptyPPK(): PPKRecord {
  return {
    id:          crypto.randomUUID(),
    kodeFaskes:  "",
    nama:        "",
    jenis:       "RS Umum",
    kepemilikan: "Pemerintah",
    tipe:        "PPK II",
    kelas:       "B",
    alamat:      "",
    kota:        "",
  };
}

// ── Page ─────────────────────────────────────────────────

export default function PPKPage() {
  const [items,      setItems]      = useState<PPKRecord[]>(() => structuredClone(PPK_INITIAL));
  const [selectedId, setSelectedId] = useState<string | null>(PPK_INITIAL[0]?.id ?? null);
  const [draft,      setDraft]      = useState<PPKRecord | null>(() => structuredClone(PPK_INITIAL[0] ?? null));
  const [search,     setSearch]     = useState("");
  const [loaded,     setLoaded]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, []);

  const isDirty = useMemo(() => {
    if (!draft) return false;
    const original = items.find((i) => i.id === draft.id);
    return !original || JSON.stringify(original) !== JSON.stringify(draft);
  }, [items, draft]);

  const filtered = items.filter((p) =>
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.kodeFaskes.toLowerCase().includes(search.toLowerCase()) ||
    p.kota.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (id: string) => {
    if (isDirty && !confirm("Ada perubahan belum tersimpan. Buang?")) return;
    const item = items.find((i) => i.id === id);
    if (item) { setSelectedId(id); setDraft(structuredClone(item)); }
  };

  const handleAdd = () => {
    if (isDirty && !confirm("Ada perubahan belum tersimpan. Buang?")) return;
    const newItem = emptyPPK();
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    setDraft(structuredClone(newItem));
  };

  const handleSave = () => {
    if (!draft) return;
    setItems((prev) => prev.map((i) => (i.id === draft.id ? structuredClone(draft) : i)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleCancel = () => {
    if (!selectedId) return;
    const original = items.find((i) => i.id === selectedId);
    if (original) setDraft(structuredClone(original));
  };

  const handleRemove = (id: string) => {
    if (!confirm("Hapus faskes ini dari daftar PPK?")) return;
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    setSelectedId(next[0]?.id ?? null);
    setDraft(next[0] ? structuredClone(next[0]) : null);
  };

  const patch = (p: Partial<PPKRecord>) =>
    setDraft((prev) => (prev ? { ...prev, ...p } : null));

  const ppk1Count  = items.filter((p) => p.tipe === "PPK I").length;
  const ppk23Count = items.filter((p) => p.tipe !== "PPK I").length;

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <PageSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col gap-4 p-6"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex shrink-0 items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-600">
                  EHIS Master · Konfigurasi
                </p>
                <h1 className="mt-0.5 text-xl font-bold text-slate-900">Faskes Rujukan (PPK)</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Daftar fasilitas kesehatan tujuan rujukan — digunakan modul Disposisi RJ dan IGD.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <StatCard label="Total Faskes" value={items.length} />
                <StatCard label="PPK I" value={ppk1Count} sub="Primer" />
                <StatCard label="PPK II / III" value={ppk23Count} sub="Lanjut" />
              </div>
            </motion.div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 gap-4">

              {/* ── Left: list ───────────────────────────── */}
              <div className="flex w-[240px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="shrink-0 border-b border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Konfigurasi</p>
                  <p className="text-sm font-bold text-slate-800">Faskes Rujukan</p>
                </div>
                <div className="shrink-0 space-y-2 border-b border-slate-100 p-3">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari faskes..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
                    />
                  </div>
                  <button
                    onClick={handleAdd}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                  >
                    <Plus size={12} />
                    Tambah PPK
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-2">
                  {filtered.length === 0 && (
                    <p className="py-8 text-center text-[11px] text-slate-400">
                      {search ? "Tidak ditemukan" : "Belum ada PPK"}
                    </p>
                  )}
                  {filtered.map((ppk, i) => {
                    const active = ppk.id === selectedId;
                    return (
                      <motion.button
                        key={ppk.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: i * 0.04 }}
                        onClick={() => handleSelect(ppk.id)}
                        className={cn(
                          "mb-1 w-full rounded-lg p-2.5 text-left transition",
                          active ? "bg-sky-50 ring-1 ring-sky-200" : "hover:bg-slate-50",
                        )}
                      >
                        <p className={cn(
                          "truncate text-xs font-semibold",
                          active ? "text-sky-700" : "text-slate-800",
                        )}>
                          {ppk.nama || "(Baru)"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className="font-mono text-[10px] text-slate-400">
                            {ppk.kodeFaskes || "—"}
                          </span>
                          <span className={cn("rounded px-1 py-0.5 text-[9px] font-bold uppercase", TIPE_CFG[ppk.tipe])}>
                            {ppk.tipe}
                          </span>
                          {ppk.kelas !== "-" && (
                            <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-600">
                              Kls {ppk.kelas}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">{ppk.kota}</p>
                      </motion.button>
                    );
                  })}
                </nav>

                {isDirty && (
                  <div className="shrink-0 border-t border-amber-100 bg-amber-50 px-3 py-2">
                    <p className="text-[11px] text-amber-700">
                      <span className="font-semibold">Ada perubahan</span> belum tersimpan
                    </p>
                  </div>
                )}
                <div className="shrink-0 border-t border-slate-100 px-3 py-2">
                  <p className="text-[10px] text-slate-400">{items.length} faskes terdaftar</p>
                </div>
              </div>

              {/* ── Right: form card ─────────────────────── */}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <AnimatePresence mode="wait">
                  {!draft ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-center shadow-sm"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                        <Landmark size={22} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-600">Pilih Faskes Rujukan</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Pilih dari daftar kiri atau tambahkan faskes baru
                        </p>
                      </div>
                      <button
                        onClick={handleAdd}
                        className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
                      >
                        <Plus size={12} /> Tambah PPK
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={draft.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      {/* Card header */}
                      <div className="shrink-0 border-b border-slate-100 px-5 py-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 ring-1 ring-sky-200">
                              <Landmark size={14} className="text-sky-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {draft.nama || "PPK Baru"}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {draft.kodeFaskes || "Kode belum diisi"} · {draft.kota || "Kota belum diisi"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <AnimatePresence>
                              {saved && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200"
                                >
                                  <BadgeCheck size={12} />
                                  Tersimpan
                                </motion.span>
                              )}
                            </AnimatePresence>
                            <button
                              onClick={() => handleRemove(draft.id)}
                              className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
                            >
                              <Trash2 size={11} /> Hapus
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Form content */}
                      <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-3 gap-3 p-5">

                          <Field label="Kode Faskes BPJS">
                            <input
                              type="text"
                              value={draft.kodeFaskes}
                              onChange={(e) => patch({ kodeFaskes: e.target.value })}
                              className={cn(base, "font-mono")}
                              placeholder="0001R001"
                              maxLength={10}
                            />
                          </Field>

                          <Field label="Jenis">
                            <select
                              value={draft.jenis}
                              onChange={(e) => patch({ jenis: e.target.value as JenisFaskes })}
                              className={base}
                            >
                              {JENIS_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
                            </select>
                          </Field>

                          <Field label="Kepemilikan">
                            <select
                              value={draft.kepemilikan}
                              onChange={(e) => patch({ kepemilikan: e.target.value as KepemilikanFaskes })}
                              className={base}
                            >
                              {KEPEMILIKAN_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                            </select>
                          </Field>

                          {/* Tipe — segmented (span 2) */}
                          <div className="col-span-2 flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tipe</span>
                            <div className="flex gap-1.5">
                              {TIPE_OPTIONS.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => patch({ tipe: t })}
                                  className={cn(
                                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                                    draft.tipe === t
                                      ? "border-sky-300 bg-sky-600 text-white"
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                                  )}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Kelas — segmented */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Kelas</span>
                            <div className="flex flex-wrap gap-1">
                              {KELAS_OPTIONS.map((k) => (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => patch({ kelas: k })}
                                  className={cn(
                                    "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                                    draft.kelas === k
                                      ? "border-sky-300 bg-sky-600 text-white"
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                                  )}
                                >
                                  {k === "-" ? "N/A" : k}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="col-span-3">
                            <Field label="Nama Faskes">
                              <input
                                type="text"
                                value={draft.nama}
                                onChange={(e) => patch({ nama: e.target.value })}
                                className={base}
                                placeholder="RSUPN Dr. Cipto Mangunkusumo"
                              />
                            </Field>
                          </div>

                          <div className="col-span-3">
                            <Field label="Alamat">
                              <input
                                type="text"
                                value={draft.alamat}
                                onChange={(e) => patch({ alamat: e.target.value })}
                                className={base}
                                placeholder="Jl. Nama Jalan No. ..."
                              />
                            </Field>
                          </div>

                          <Field label="RT">
                            <input type="text" value={draft.rt ?? ""} onChange={(e) => patch({ rt: e.target.value || undefined })} className={cn(base, "font-mono")} placeholder="001" maxLength={3} />
                          </Field>
                          <Field label="RW">
                            <input type="text" value={draft.rw ?? ""} onChange={(e) => patch({ rw: e.target.value || undefined })} className={cn(base, "font-mono")} placeholder="001" maxLength={3} />
                          </Field>
                          <Field label="Kodepos">
                            <input type="text" value={draft.kodePos ?? ""} onChange={(e) => patch({ kodePos: e.target.value || undefined })} className={cn(base, "font-mono")} placeholder="10430" maxLength={5} />
                          </Field>

                          <Field label="Telepon">
                            <input type="text" value={draft.telepon ?? ""} onChange={(e) => patch({ telepon: e.target.value || undefined })} className={base} placeholder="021-xxxxxxx" />
                          </Field>
                          <Field label="Fax">
                            <input type="text" value={draft.fax ?? ""} onChange={(e) => patch({ fax: e.target.value || undefined })} className={base} placeholder="021-xxxxxxx" />
                          </Field>
                          <Field label="Kota / Kabupaten">
                            <input type="text" value={draft.kota} onChange={(e) => patch({ kota: e.target.value })} className={base} placeholder="Jakarta Pusat" />
                          </Field>

                        </div>
                      </div>

                      {/* Footer */}
                      <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                        <button
                          onClick={handleCancel}
                          disabled={!isDirty}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-30"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={!isDirty}
                          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-40"
                        >
                          <Save size={12} />
                          Simpan
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
