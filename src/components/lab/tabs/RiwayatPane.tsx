"use client";

import { Printer, FileText, FlaskConical, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LabOrder, FLAG_CFG, PRIORITAS_CFG, LAB_STATUS_CFG,
  deriveLabOrders, fmtTimestamp,
} from "../labShared";

interface Props { order: LabOrder }

// ── Result Badge ──────────────────────────────────────────

function ResultBadge({ flag }: { flag?: import("../labShared").FlagHasil }) {
  if (!flag) return null;
  const cfg = FLAG_CFG[flag];
  return (
    <span className={cn(
      "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
      flag === "C" ? "bg-rose-100 text-rose-700" :
      flag === "H" ? "bg-amber-100 text-amber-700" :
      flag === "L" ? "bg-sky-100 text-sky-700"    :
      "bg-emerald-50 text-emerald-600",
    )}>
      {cfg.label}
    </span>
  );
}

// ── History Card ──────────────────────────────────────────

function HistoryCard({ o, isCurrent }: { o: LabOrder; isCurrent: boolean }) {
  const cfg    = LAB_STATUS_CFG[o.status];
  const priCfg = PRIORITAS_CFG[o.prioritas];
  const isDone = o.status === "Selesai";
  const isRej  = o.status === "Ditolak";

  const criticalCount = o.hasil?.filter((h) => h.flag === "C" && h.nilai).length ?? 0;
  const abnormalCount = o.hasil?.filter((h) => (h.flag === "H" || h.flag === "L") && h.nilai).length ?? 0;

  return (
    <div className={cn(
      "rounded-xl border bg-white p-4 transition-shadow",
      isCurrent ? "border-sky-300 ring-1 ring-sky-200 shadow-sm" : "border-slate-200",
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {isCurrent && (
              <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[9px] font-bold text-white">Order Ini</span>
            )}
            <p className="text-[12px] font-bold text-slate-800">{o.noOrder}</p>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", priCfg.badge)}>
              {o.prioritas}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">{o.tanggal} · {o.jam} · {o.dokter.split(",")[0]}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px]", cfg.badge)}>
          {isDone ? <CheckCircle2 size={10} className="inline mr-1" /> : isRej ? <XCircle size={10} className="inline mr-1" /> : null}
          {cfg.label}
        </span>
      </div>

      {/* Tests */}
      <div className="mt-2 flex flex-wrap gap-1">
        {o.items.map((i) => (
          <span key={i.id} className={cn(
            "rounded px-1.5 py-0.5 text-[10px]",
            i.isSpecial ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : "bg-slate-100 text-slate-600",
          )}>
            {i.nama}
          </span>
        ))}
      </div>

      {/* Abnormal flags summary */}
      {isDone && o.hasil && (criticalCount > 0 || abnormalCount > 0) && (
        <div className="mt-2 flex gap-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              {criticalCount} Kritis
            </span>
          )}
          {abnormalCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              {abnormalCount} Abnormal
            </span>
          )}
        </div>
      )}

      {/* Timestamps */}
      {isDone && (
        <div className="mt-2 flex gap-3 text-[10px] text-slate-400">
          <span><Clock size={9} className="inline mr-0.5" />Order: {fmtTimestamp(o.timestamps.order)}</span>
          <span>Rilis: {fmtTimestamp(o.timestamps.rilis)}</span>
          {o.validator && <span>Validator: {o.validator.split(",")[0]}</span>}
        </div>
      )}
    </div>
  );
}

// ── Print Document Card ───────────────────────────────────

function DocCard({
  title, desc, available, onClick,
}: { title: string; desc: string; available: boolean; onClick: () => void }) {
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-xl border p-3.5 transition-colors",
      available ? "border-sky-200 bg-sky-50 hover:bg-sky-100 cursor-pointer" : "border-slate-200 bg-slate-50 opacity-50",
    )}
    onClick={available ? onClick : undefined}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", available ? "bg-sky-100" : "bg-slate-100")}>
        <FileText size={16} className={available ? "text-sky-600" : "text-slate-400"} />
      </div>
      <div className="flex-1">
        <p className={cn("text-[12px] font-bold", available ? "text-sky-800" : "text-slate-500")}>{title}</p>
        <p className="text-[10px] text-slate-400">{desc}</p>
      </div>
      {available && <Printer size={14} className="mt-1 shrink-0 text-sky-400" />}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RiwayatPane({ order }: Props) {
  const allOrders = deriveLabOrders().filter((o) => o.noRM === order.noRM);
  const isDone = order.status === "Selesai";

  function handlePrint(type: string) {
    window.alert(`Cetak ${type} — fitur PDF akan tersedia di versi berikutnya`);
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_280px]">

      {/* Left — Order history */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Riwayat Order Lab</h3>
            <p className="text-[11px] text-slate-400">{order.namaPasien} · {order.noRM}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {allOrders.length} order
          </span>
        </div>

        {allOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-12 text-center">
            <FlaskConical size={24} className="text-slate-300" />
            <p className="text-sm text-slate-400">Belum ada riwayat</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {allOrders.map((o) => (
              <HistoryCard key={o.id} o={o} isCurrent={o.id === order.id} />
            ))}
          </div>
        )}
      </div>

      {/* Right — Cetak */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Cetak Dokumen</h4>

        <DocCard
          title="Hasil Pemeriksaan Lab"
          desc="Format standar KOP RS, nilai + rujukan + flag, TTD validator"
          available={isDone}
          onClick={() => handlePrint("Hasil Pemeriksaan")}
        />
        <DocCard
          title="Lembar Permintaan Lab"
          desc="Formulir permintaan awal dengan kop dokter & diagnosa"
          available={true}
          onClick={() => handlePrint("Lembar Permintaan")}
        />
        <DocCard
          title="Label Tabung"
          desc="Label identitas pasien untuk setiap tabung sampel"
          available={!!order.specimen?.noRegistrasi}
          onClick={() => handlePrint("Label Tabung")}
        />
        <DocCard
          title="Log Nilai Kritis"
          desc="Bukti pelaporan nilai kritis beserta konfirmasi dokter"
          available={(order.criticalNotifs?.length ?? 0) > 0}
          onClick={() => handlePrint("Log Nilai Kritis")}
        />

        <p className="text-[10px] text-slate-400">
          Semua dokumen harus ditandatangani digital oleh validator.<br />
          PMK 269/2008 · PMK 43/2013 · ISO 15189
        </p>
      </div>
    </div>
  );
}
