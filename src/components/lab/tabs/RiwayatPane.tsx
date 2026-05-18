"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, FileText, FlaskConical, CheckCircle2, XCircle, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LabOrder, FLAG_CFG, PRIORITAS_CFG, LAB_STATUS_CFG,
  deriveLabOrders, fmtTimestamp,
} from "../labShared";

interface Props { order: LabOrder }

// ── Print Preview Modal ───────────────────────────────────

function PrintPreviewModal({ order, onClose }: { order: LabOrder; onClose: () => void }) {
  const grouped = new Map<string, typeof order.hasil>();
  for (const h of (order.hasil ?? [])) {
    const list = grouped.get(h.kategori) ?? [];
    list.push(h);
    grouped.set(h.kategori, list);
  }

  function doPrint() {
    const content = document.getElementById("lab-print-content")?.innerHTML ?? "";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hasil Lab ${order.noOrder}</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b;padding:24px;max-width:720px;margin:auto}
        table{width:100%;border-collapse:collapse;margin-top:6px}
        th{text-align:left;font-size:9px;text-transform:uppercase;color:#64748b;padding:4px 6px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
        td{padding:4px 6px;border-bottom:1px solid #f1f5f9;font-size:11px}
        .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:64px;color:rgba(148,163,184,0.1);font-weight:900;pointer-events:none}
      </style>
    </head><body><div class="watermark">HASIL RESMI</div>${content}</body></html>`;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("srcdoc", html);
    iframe.style.cssText = "position:fixed;visibility:hidden;width:800px;height:600px;top:-9999px;left:-9999px;";
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 2000);
    };
    document.body.appendChild(iframe);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-bold text-slate-800">Preview Hasil Pemeriksaan Lab</p>
          <div className="flex items-center gap-2">
            <button
              onClick={doPrint}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-sky-700"
            >
              <Printer size={13} />
              Cetak / Print
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Report content */}
        <div className="overflow-y-auto p-5">
          <div id="lab-print-content" className="space-y-3 text-[11px] text-slate-800">

            {/* Header */}
            <div className="text-center">
              <p className="text-[13px] font-extrabold text-slate-900">HASIL PEMERIKSAAN LABORATORIUM KLINIK</p>
              <p className="text-[10px] text-slate-500">RS. Contoh Medika — Jl. Contoh No. 1, Jakarta</p>
            </div>

            <div className="border-t-2 border-slate-800" />

            {/* Patient info */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {[
                ["Nama Pasien", order.namaPasien],
                ["No. Order",   order.noOrder],
                ["No. RM",      order.noRM],
                ["Tanggal",     `${order.tanggal} ${order.jam}`],
                ["Tanggal Lahir", order.tanggalLahir],
                ["Dokter",      order.dokter],
                ["Unit",        order.unitAsal + (order.ruangan ? ` · ${order.ruangan}` : "")],
                ["Analis",      order.analis ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="w-28 shrink-0 text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-800">: {v}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200" />

            {/* Results per category */}
            {[...grouped.entries()].map(([kat, items]) => (
              <div key={kat}>
                <p className="bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 rounded">{kat}</p>
                <table className="w-full mt-1">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-1 text-left text-[9px] uppercase text-slate-400 w-2/5">Pemeriksaan</th>
                      <th className="py-1 text-center text-[9px] uppercase text-slate-400">Hasil</th>
                      <th className="py-1 text-left text-[9px] uppercase text-slate-400">Satuan</th>
                      <th className="py-1 text-left text-[9px] uppercase text-slate-400">Nilai Rujukan</th>
                      <th className="py-1 text-left text-[9px] uppercase text-slate-400">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items ?? []).map((h) => {
                      const flagCfg = h.flag ? FLAG_CFG[h.flag] : null;
                      return (
                        <tr key={h.kode} className="border-b border-slate-50">
                          <td className="py-1 text-[11px]">{h.nama}</td>
                          <td className={cn("py-1 text-center text-sm font-bold", flagCfg?.cls ?? "text-slate-500")}>
                            {h.nilai ?? "—"}
                          </td>
                          <td className="py-1 text-[10px] text-slate-500">{h.satuan}</td>
                          <td className="py-1 text-[10px] text-slate-500">{h.rujukanStr}</td>
                          <td className="py-1">
                            {h.flag && h.nilai && (
                              <span className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                                h.flag === "C" ? "bg-rose-100 text-rose-700" :
                                h.flag === "H" ? "bg-amber-100 text-amber-700" :
                                h.flag === "L" ? "bg-sky-100 text-sky-700" :
                                "bg-emerald-50 text-emerald-700",
                              )}>
                                {flagCfg?.label}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Catatan validator */}
            {order.catatanValidator && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <p className="text-[10px] font-bold text-slate-500 mb-1">Catatan Klinis Validator</p>
                <p className="text-[11px] text-slate-700 leading-relaxed">{order.catatanValidator}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 grid grid-cols-3 gap-6 text-[10px]">
              <div>
                <p className="text-slate-400">Analis Pelaksana</p>
                <div className="mt-6 border-t border-slate-800 pt-1 text-center font-semibold">{order.analis ?? "—"}</div>
              </div>
              <div>
                <p className="text-slate-400">Validator (SpPK)</p>
                <div className="mt-6 border-t border-slate-800 pt-1 text-center font-semibold">{order.validator ?? "—"}</div>
              </div>
              <div>
                <p className="text-slate-400">Waktu Rilis</p>
                <p className="mt-1 font-semibold">{order.timestamps.rilis ? new Date(order.timestamps.rilis).toLocaleString("id-ID") : "—"}</p>
              </div>
            </div>

            <p className="text-center text-[9px] text-slate-400">
              PMK 269/2008 · PMK 43/2013 · ISO 15189:2022 · Dokumen ini sah jika ditandatangani oleh validator
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── History Card ─────────────────────────────────────────

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
          <div className="flex items-center gap-2 flex-wrap">
            {isCurrent && (
              <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[9px] font-bold text-white">Order Ini</span>
            )}
            <p className="text-[12px] font-bold text-slate-800">{o.noOrder}</p>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", priCfg.badge)}>{o.prioritas}</span>
          </div>
          <p className="text-[11px] text-slate-500">{o.tanggal} · {o.jam} · {o.dokter.split(",")[0]}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px]", cfg.badge)}>
          {isDone ? <CheckCircle2 size={10} className="inline mr-1" /> : isRej ? <XCircle size={10} className="inline mr-1" /> : null}
          {cfg.label}
        </span>
      </div>

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

      {isDone && o.hasil && (criticalCount > 0 || abnormalCount > 0) && (
        <div className="mt-2 flex gap-2">
          {criticalCount > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">{criticalCount} Kritis</span>
          )}
          {abnormalCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{abnormalCount} Abnormal</span>
          )}
        </div>
      )}

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

// ── Doc Card ──────────────────────────────────────────────

function DocCard({ title, desc, available, onClick }: {
  title: string; desc: string; available: boolean; onClick: () => void;
}) {
  return (
    <div
      className={cn(
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
  const allOrders   = deriveLabOrders().filter((o) => o.noRM === order.noRM);
  const isDone      = order.status === "Selesai";
  const [showPreview, setShowPreview] = useState(false);

  function handlePrint(type: string) {
    if (type === "Hasil Pemeriksaan") {
      setShowPreview(true);
      return;
    }
    window.alert(`Cetak ${type} — fitur PDF akan tersedia di versi berikutnya`);
  }

  return (
    <>
      <AnimatePresence>
        {showPreview && (
          <PrintPreviewModal order={order} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>

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
            desc="Preview format standar KOP RS · nilai + rujukan + flag · TTD validator"
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
    </>
  );
}
