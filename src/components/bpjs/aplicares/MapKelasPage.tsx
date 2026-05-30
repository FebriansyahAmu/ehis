"use client";

/**
 * BP7.2 — Map Kelas BPJS ↔ Kelas RS Lokal.
 *
 * Route: /ehis-bpjs/aplicares/map-kelas
 * Accent: pink · Adapter: getMapKelas()
 *
 * CRUD table: tambah / edit / hapus mapping.
 * Validation: no duplikat (kdKelasBPJS, kdKelasLokal) · multiplier > 0.
 * Single-source: reuse KelasRawat dari eklaimShared.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, BarChart2, PencilLine, Trash2, Plus, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMapKelas } from "@/lib/bpjs/aplicaresAdapter";
import type { MapKelasRecord } from "@/lib/bpjs/bpjsShared";
import {
  kelasBPJSChipCls,
  kelasBPJSLabel,
  kelasLokalChipCls,
  multiplierBadgeCls,
  multiplierLabel,
  makeRowId,
  type MapRowLocal,
} from "./aplicaresShared";
import KamarMappingForm from "./KamarMappingForm";

// ── Skeleton ───────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-2">
        <Bone className="h-2.5 w-28" />
        <Bone className="h-5 w-48" />
        <Bone className="h-2.5 w-80" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => <Bone key={i} className="h-16 rounded-2xl" />)}
      </div>
      <Bone className="h-96 rounded-2xl" />
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, iconCls, delay = 0,
}: {
  icon: React.ElementType; label: string; value: string;
  sub: string; iconCls: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconCls)}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-black leading-none text-slate-900">{value}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Delete confirm inline ──────────────────────────────

function DeleteConfirmRow({
  row, onConfirm, onCancel,
}: {
  row: MapRowLocal;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-rose-50"
    >
      <td colSpan={6} className="px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertTriangle size={13} className="shrink-0 text-rose-500" />
          <p className="flex-1 text-[11px] text-rose-700">
            Hapus mapping{" "}
            <strong className="font-mono">{row.kdKelasBPJS}</strong>
            {" → "}
            <strong>{row.namaKelasLokal}</strong>? Tindakan ini tidak dapat diurungkan.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-[10px] font-semibold text-white transition hover:bg-rose-700"
            >
              <Trash2 size={10} />
              Hapus
            </button>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

// ── Page ───────────────────────────────────────────────

export default function MapKelasPage() {
  const [loaded, setLoaded]             = useState(false);
  const [rows, setRows]                 = useState<MapRowLocal[]>([]);
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalMode, setModalMode]       = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget]     = useState<MapRowLocal | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [savedId, setSavedId]           = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await getMapKelas();
      if (res.ok && res.value.response) {
        const data: MapRowLocal[] = (res.value.response as MapKelasRecord[]).map((r) => ({
          id:             makeRowId(),
          kdKelasBPJS:    r.kdKelasBPJS,
          namaKelasBPJS:  r.namaKelasBPJS,
          kdKelasLokal:   r.kdKelasLokal,
          namaKelasLokal: r.namaKelasLokal,
          multiplier:     r.multiplier ?? 1.0,
        }));
        setRows(data);
      }
      setLoaded(true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  function openAdd() {
    setEditTarget(undefined);
    setModalMode("add");
    setModalOpen(true);
  }

  function openEdit(row: MapRowLocal) {
    setEditTarget(row);
    setModalMode("edit");
    setModalOpen(true);
  }

  function handleSave(data: Omit<MapRowLocal, "id">, id?: string) {
    setModalOpen(false);
    if (id) {
      setRows((prev) => prev.map((r) => r.id === id ? { ...data, id } : r));
      setSavedId(id);
    } else {
      const newId = makeRowId();
      setRows((prev) => [...prev, { ...data, id: newId }]);
      setSavedId(newId);
    }
    setTimeout(() => setSavedId(null), 1500);
  }

  function handleDelete(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setDeleteTarget(null);
  }

  const bpjsCoverage  = new Set(rows.map((r) => r.kdKelasBPJS)).size;
  const lokalCoverage = new Set(rows.map((r) => r.kdKelasLokal)).size;

  const pageContent = (
    <motion.div
      key="page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-4 p-6"
    >
      {/* ── Header ── */}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-pink-600">
          EHIS BPJS · Aplicares
        </p>
        <h1 className="mt-0.5 text-base font-bold text-slate-900">Map Kelas</h1>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Mapping kelas BPJS ↔ kelas rawat RS lokal beserta{" "}
          <span className="font-semibold">multiplier tarif</span>.
          Digunakan saat sinkronisasi bed Aplicares dan perhitungan selisih tarif naik/turun kelas.
        </p>
      </div>

      {/* ── StatCards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          icon={Layers}
          label="Total Mapping"
          value={String(rows.length)}
          sub={`${bpjsCoverage} kelas BPJS · ${lokalCoverage} kelas lokal`}
          iconCls="bg-pink-100 text-pink-600"
          delay={0}
        />
        <StatCard
          icon={BarChart2}
          label="Multiplier Custom"
          value={rows.filter((r) => r.multiplier !== 1).length + " custom"}
          sub={`${rows.filter((r) => r.multiplier === 1).length} standar (1.00×)`}
          iconCls="bg-emerald-100 text-emerald-600"
          delay={0.07}
        />
      </div>

      {/* ── Table Panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Layers size={13} className="text-pink-500" />
            <span className="text-[11px] font-semibold text-slate-700">Mapping Kelas</span>
            <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700">
              {rows.length} entry
            </span>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg bg-pink-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-pink-700 active:scale-[0.98]"
          >
            <Plus size={11} />
            Tambah Mapping
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Kelas BPJS", "Nama BPJS", "Kelas Lokal", "Nama Lokal", "Multiplier", "Aksi"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((row) => (
                  deleteTarget === row.id ? (
                    <DeleteConfirmRow
                      key={`del-${row.id}`}
                      row={row}
                      onConfirm={() => handleDelete(row.id)}
                      onCancel={() => setDeleteTarget(null)}
                    />
                  ) : (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        "border-b border-slate-50 transition",
                        savedId === row.id ? "bg-emerald-50/60" : "hover:bg-pink-50/30",
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-bold",
                          kelasBPJSChipCls(row.kdKelasBPJS),
                        )}>
                          {row.kdKelasBPJS}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        {row.namaKelasBPJS}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-bold",
                          kelasLokalChipCls(row.kdKelasLokal),
                        )}>
                          {row.kdKelasLokal}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        {row.namaKelasLokal}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-bold tabular-nums",
                          multiplierBadgeCls(row.multiplier),
                        )}>
                          {multiplierLabel(row.multiplier)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {savedId === row.id ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                            <Check size={11} />
                            Disimpan
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(row)}
                              title="Edit mapping"
                              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              <PencilLine size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(row.id)}
                              title="Hapus mapping"
                              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  )
                ))}
              </AnimatePresence>

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[11px] text-slate-400">
                    Belum ada mapping — klik <strong>Tambah Mapping</strong> untuk memulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2">
          <span className="text-[10px] text-slate-400">
            {rows.length} mapping aktif · BPJS: {[...new Set(rows.map((r) => kelasBPJSLabel(r.kdKelasBPJS)))].join(", ")}
          </span>
          <span className="text-[10px] text-slate-400">
            Multiplier {">"} 1 = naik kelas · {"<"} 1 = turun kelas
          </span>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <PageSkeleton />
          </motion.div>
        ) : pageContent}
      </AnimatePresence>

      {/* Modal lives outside AnimatePresence to avoid mode="wait" multi-child warning */}
      <KamarMappingForm
        open={modalOpen}
        mode={modalMode}
        initial={editTarget}
        existingRows={rows}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
