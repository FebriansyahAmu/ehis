"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight, AlertTriangle, CheckCircle2, Package,
  ChevronDown, ChevronUp, Shield, ClipboardCheck, Plus,
  Pill, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPengembalianForRM,
  totalKembalian,
  KONDISI_CFG,
  STATUS_PENGEMBALIAN_CFG,
  ALASAN_OPTIONS,
  type PengembalianRecord,
  type ItemKembalian,
  type KondisiObat,
  type AlasanKembalian,
  type StatusPengembalian,
} from "./pengembalianShared";

// ── Item row (editable) ───────────────────────────────────

function ItemRow({
  item,
  onUpdate,
  locked,
}: {
  item: ItemKembalian;
  onUpdate: (patch: Partial<ItemKembalian>) => void;
  locked: boolean;
}) {
  const selisih = item.jumlahDispensasi - item.jumlahDiberikan;

  return (
    <div className={cn(
      "rounded-xl border bg-white p-3 space-y-2 transition-colors",
      item.isHAM ? "border-rose-200" : "border-slate-200",
    )}>
      {/* Drug name + badges */}
      <div className="flex items-start gap-2">
        <Pill size={13} className={cn("mt-0.5 shrink-0", item.isHAM ? "text-rose-500" : "text-slate-400")} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-800 leading-tight">{item.namaObat}</span>
            {item.isHAM && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 ring-1 ring-rose-200">
                <AlertTriangle size={8} />HAM
              </span>
            )}
            {item.isNarPsi && (
              <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 ring-1 ring-purple-200">
                NAR/PSI
              </span>
            )}
          </div>
          {item.lotNo && (
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
              LOT {item.lotNo} · EXP {item.expiredDate}
            </p>
          )}
        </div>
      </div>

      {/* Quantity strip */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Dispensasi", val: item.jumlahDispensasi, cls: "text-slate-600" },
          { label: "Diberikan",  val: item.jumlahDiberikan,  cls: "text-sky-600"   },
          { label: "Sisa",       val: selisih,                cls: selisih > 0 ? "text-amber-600" : "text-slate-400" },
        ].map(({ label, val, cls }) => (
          <div key={label} className="rounded-lg bg-slate-50 py-1.5">
            <p className={cn("text-base font-bold tabular-nums leading-none", cls)}>{val}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-3 gap-2">
        {/* Jumlah kembali */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 block mb-1">Dikembalikan</label>
          <input
            type="number"
            min={0}
            max={selisih}
            value={item.jumlahKembalikan}
            disabled={locked}
            onChange={(e) => onUpdate({ jumlahKembalikan: Math.min(selisih, Math.max(0, +e.target.value)) })}
            className={cn(
              "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-bold text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-400",
              locked && "opacity-50 cursor-not-allowed",
            )}
          />
        </div>

        {/* Kondisi */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 block mb-1">Kondisi</label>
          <select
            value={item.kondisi}
            disabled={locked}
            onChange={(e) => onUpdate({ kondisi: e.target.value as KondisiObat })}
            className={cn(
              "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-400",
              locked && "opacity-50 cursor-not-allowed",
            )}
          >
            {(["Baik", "Rusak", "Kadaluarsa"] as KondisiObat[]).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Alasan */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 block mb-1">Alasan</label>
          <select
            value={item.alasan}
            disabled={locked}
            onChange={(e) => onUpdate({ alasan: e.target.value as AlasanKembalian })}
            className={cn(
              "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-400",
              locked && "opacity-50 cursor-not-allowed",
            )}
          >
            {ALASAN_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* HAM warning */}
      {item.isHAM && item.jumlahKembalikan > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2">
          <Shield size={12} className="text-rose-600 shrink-0" />
          <p className="text-[11px] text-rose-700 font-medium">
            HAM — wajib verifikasi 2 apoteker sebelum masuk stok depo
          </p>
        </div>
      )}
    </div>
  );
}

// ── Record accordion ──────────────────────────────────────

function RecordCard({
  record,
  isNew,
  onStatusChange,
}: {
  record: PengembalianRecord;
  isNew?: boolean;
  onStatusChange: (status: StatusPengembalian) => void;
}) {
  const [open,    setOpen]    = useState(isNew ?? false);
  const [items,   setItems]   = useState(record.items);
  const [catatan, setCatatan] = useState(record.catatan ?? "");
  const [perawat, setPerawat] = useState(record.perawatPenyerah);

  const cfg     = STATUS_PENGEMBALIAN_CFG[record.status];
  const locked  = record.status === "Selesai";
  const totalKb = items.reduce((s, i) => s + i.jumlahKembalikan, 0);
  const hasHAM  = items.some((i) => i.isHAM && i.jumlahKembalikan > 0);

  function patchItem(id: string, patch: Partial<ItemKembalian>) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
  }

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden shadow-sm transition-all",
      isNew ? "border-sky-300 ring-1 ring-sky-200" : "border-slate-200",
    )}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <Package size={14} className="text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{record.noResepRef}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", cfg.badge)}>
              {cfg.label}
            </span>
            {hasHAM && (
              <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 ring-1 ring-rose-200">
                HAM
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {record.tanggal} · {totalKembalian(record)} unit dikembalikan · {record.items.length} item
          </p>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </button>

      {/* Expanded */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
              {/* Items */}
              <div className="space-y-2">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onUpdate={(patch) => patchItem(item.id, patch)}
                    locked={locked}
                  />
                ))}
              </div>

              {/* Perawat + catatan */}
              {!locked && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Perawat Penyerah</label>
                    <input
                      value={perawat}
                      onChange={(e) => setPerawat(e.target.value)}
                      placeholder="Nama perawat"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Catatan</label>
                    <input
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Catatan tambahan"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                </div>
              )}

              {locked && record.catatan && (
                <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-500 text-[11px]">Catatan: </span>
                  {record.catatan}
                </div>
              )}

              {/* Verif strip */}
              {record.status !== "Draft" && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Diverifikasi oleh <strong>{record.apotekerPenerima}</strong>
                    {record.verifiedAt && (
                      <> · {new Date(record.verifiedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</>
                    )}
                  </p>
                </div>
              )}

              {/* Action */}
              {!locked && (
                <button
                  onClick={() => onStatusChange("Diverifikasi")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
                >
                  <ClipboardCheck size={14} />
                  Verifikasi Penerimaan
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Summary panel ─────────────────────────────────────────

function SummaryPanel({ records }: { records: PengembalianRecord[] }) {
  const allItems = records.flatMap((r) => r.items);
  const totalUnit = allItems.reduce((s, i) => s + i.jumlahKembalikan, 0);
  const totalHAM  = allItems.filter((i) => i.isHAM && i.jumlahKembalikan > 0).length;
  const selesai   = records.filter((r) => r.status === "Selesai").length;
  const pending   = records.filter((r) => r.status !== "Selesai").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Total Unit",    val: totalUnit, cls: "text-slate-800"   },
          { label: "Selesai",       val: selesai,   cls: "text-emerald-700" },
          { label: "Pending",       val: pending,   cls: pending > 0 ? "text-amber-600" : "text-slate-400" },
          { label: "Item HAM",      val: totalHAM,  cls: totalHAM > 0 ? "text-rose-600" : "text-slate-400" },
        ].map(({ label, val, cls }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className={cn("text-2xl font-bold tabular-nums leading-none", cls)}>{val}</p>
            <p className="text-[11px] text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Guide */}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-2">
        <p className="text-xs font-bold text-sky-800 uppercase tracking-wide">Prosedur PMK 72/2016 Ps. 20</p>
        {[
          "Perawat siapkan obat sisa beserta kemasan asli",
          "Isi formulir pengembalian per item (kondisi + alasan)",
          "Apoteker verifikasi fisik dan cocokkan jumlah",
          "HAM / Nar-Psi: verifikasi 2 apoteker wajib",
          "Stok depo diperbarui setelah verifikasi selesai",
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-200 text-[9px] font-bold text-sky-700">{i + 1}</span>
            <p className="text-[11px] text-sky-700">{s}</p>
          </div>
        ))}
      </div>

      {/* Per-record kondisi breakdown */}
      {records.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Rekap Kondisi</p>
          {(["Baik", "Rusak", "Kadaluarsa"] as const).map((k) => {
            const count = allItems.filter((i) => i.kondisi === k && i.jumlahKembalikan > 0).length;
            if (!count) return null;
            const cfg = KONDISI_CFG[k];
            return (
              <div key={k} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                  <span className="text-xs text-slate-600">{k}</span>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", cfg.badge)}>{count} item</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function PengembalianPane({ noRM }: { noRM: string }) {
  const initial = getPengembalianForRM(noRM);
  const [records, setRecords] = useState(initial);

  function handleStatusChange(id: string, status: typeof records[0]["status"]) {
    setRecords((prev) => prev.map((r) => r.id === id
      ? { ...r, status, verifiedAt: status === "Diverifikasi" ? new Date().toISOString() : r.verifiedAt }
      : r,
    ));
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_260px]">

      {/* ── Left: records list ── */}
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100">
              <RotateCcw size={14} className="text-sky-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Pengembalian Obat</h3>
              <p className="text-[11px] text-slate-400">PMK 72/2016 Ps. 20 · Obat sisa saat pulang</p>
            </div>
          </div>
          <button
            onClick={() => {/* future: modal buat catatan baru */}}
            className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
          >
            <Plus size={12} />
            Tambah
          </button>
        </div>

        {/* Records */}
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-14">
            <ArrowLeftRight size={24} className="text-slate-300" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">Belum ada pengembalian obat</p>
              <p className="text-xs text-slate-400 mt-1">Tambahkan saat pasien siap pulang</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec, i) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <RecordCard
                  record={rec}
                  isNew={i === 0 && rec.status === "Draft"}
                  onStatusChange={(status) => handleStatusChange(rec.id, status)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: summary ── */}
      <aside>
        <SummaryPanel records={records} />
      </aside>
    </div>
  );
}
