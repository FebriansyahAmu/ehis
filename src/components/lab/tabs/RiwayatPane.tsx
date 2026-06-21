"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, FileText, FlaskConical, CheckCircle2, XCircle, Clock, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LabOrder, type HasilItem, FLAG_CFG, PRIORITAS_CFG, LAB_STATUS_CFG,
  mapDbLabOrder, applyWorkflowOverlay, fmtTimestamp, dtoValueToHasil, hasilKey,
} from "../labShared";
import TteQr, { tteSerial } from "../TteQr";
import { listLabWorklist } from "@/lib/api/lab/labOrder";
import { getLabResult, type LabResultDTO } from "@/lib/api/lab/labResult";

interface Props { order: LabOrder }

// ── Print Preview Modal ───────────────────────────────────

function PrintPreviewModal({ order, onClose }: { order: LabOrder; onClose: () => void }) {
  // Hasil RESMI dari DB (medicalrecord.LabResult) bila ada, fallback overlay sesi.
  const [result, setResult] = useState<LabResultDTO | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    getLabResult(order.id, ac.signal)
      .then((r) => { if (!ac.signal.aborted) setResult(r); })
      .catch(() => { /* fallback ke overlay */ });
    return () => ac.abort();
  }, [order.id]);

  // HANYA parameter yang TERISI (punya nilai) yang dicetak.
  const allRows: HasilItem[] = result?.values.map(dtoValueToHasil) ?? order.hasil ?? [];
  const rows = allRows.filter((h) => (h.nilai ?? "").trim() !== "");

  const grouped = new Map<string, HasilItem[]>();
  for (const h of rows) {
    const list = grouped.get(h.kategori) ?? [];
    list.push(h);
    grouped.set(h.kategori, list);
  }

  // Identitas penandatangan (DB diutamakan).
  const analis = result?.analis ?? order.analis ?? "—";
  const validator = result?.validator ?? order.validator ?? "";
  const catatanValidator = result?.catatanValidator ?? order.catatanValidator ?? null;
  const validatedAt = result?.validatedAt ?? order.timestamps.rilis ?? null;
  const signed = !!validator;
  const serial = tteSerial(`${order.id}|${validatedAt ?? ""}`);
  const qrPayload = `EHIS-LAB|${order.noOrder}|RM:${order.noRM}|VALIDATOR:${validator}|${validatedAt ?? ""}|${serial}`;

  function doPrint() {
    const content = document.getElementById("lab-print-content")?.innerHTML ?? "";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hasil Lab ${order.noOrder}</title>
      <style>
        @page{size:A4;margin:14mm 12mm}
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b;margin:0}
        table{width:100%;border-collapse:collapse;margin-top:6px}
        th{text-align:left;font-size:9px;text-transform:uppercase;color:#64748b;padding:4px 6px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
        td{padding:4px 6px;border-bottom:1px solid #f1f5f9;font-size:11px}
        .cat{background:#f1f5f9;padding:3px 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#475569;border-radius:3px;margin-top:10px}
        .sign-grid{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-top:16px;border-top:1px solid #e2e8f0;padding-top:12px}
        .sign-col{flex:1;text-align:center}
        .sign-line{margin-top:34px;border-top:1px solid #0f172a;padding-top:3px;font-weight:600}
        .tte-box{display:flex;flex-direction:column;align-items:center;gap:3px}
        .tte-serial{font-family:monospace;letter-spacing:1px;color:#334155;font-size:9px}
        .tte-tag{display:flex;align-items:center;gap:3px;color:#059669;font-size:8px;font-weight:700}
        .muted{color:#64748b;font-size:9px}
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
        className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-bold text-slate-800">Preview Hasil Pemeriksaan Lab · A4</p>
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

        {/* Report content — lembar A4 WYSIWYG (210×297mm; padding ≈ margin @page) */}
        <div className="max-h-[78vh] overflow-y-auto bg-slate-100 p-5">
          <div className="mx-auto w-[210mm] max-w-full bg-white px-12 py-10 shadow-sm" data-paper="A4">
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
                ["Analis",      analis],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="w-28 shrink-0 text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-800">: {v}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200" />

            {/* Results per category — HANYA parameter terisi */}
            {rows.length === 0 ? (
              <p className="rounded border border-dashed border-slate-200 py-4 text-center text-[10px] text-slate-400">
                Tidak ada parameter terisi untuk dicetak.
              </p>
            ) : (
              [...grouped.entries()].map(([kat, items]) => (
                <div key={kat}>
                  <p className="cat bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 rounded">{kat}</p>
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
                      {items.map((h) => {
                        const flagCfg = h.flag ? FLAG_CFG[h.flag] : null;
                        return (
                          <tr key={hasilKey(h)} className="border-b border-slate-50">
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
              ))
            )}

            {/* Catatan validator */}
            {catatanValidator && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <p className="text-[10px] font-bold text-slate-500 mb-1">Catatan Klinis Validator</p>
                <p className="text-[11px] text-slate-700 leading-relaxed">{catatanValidator}</p>
              </div>
            )}

            {/* Footer — TTD analis + TTE QR validator (SpPK) + waktu rilis */}
            <div className="sign-grid grid grid-cols-3 gap-6 border-t border-slate-200 pt-3 text-[10px]">
              <div className="sign-col">
                <p className="muted text-slate-400">Analis Pelaksana</p>
                <div className="sign-line mt-8 border-t border-slate-800 pt-1 text-center font-semibold">{analis}</div>
              </div>
              <div className="sign-col">
                <p className="muted text-slate-400">Validator (SpPK)</p>
                {signed ? (
                  <div className="tte-box mt-1 flex flex-col items-center gap-1">
                    <TteQr value={qrPayload} size={84} />
                    <p className="font-semibold text-slate-800">{validator}</p>
                    <p className="tte-serial font-mono text-[9px] tracking-wider text-slate-500">{serial}</p>
                    <p className="tte-tag flex items-center gap-1 text-[8px] font-bold text-emerald-600">
                      <ShieldCheck size={9} /> Tertandatangani elektronik
                    </p>
                  </div>
                ) : (
                  <div className="sign-line mt-8 border-t border-slate-800 pt-1 text-center font-semibold">—</div>
                )}
              </div>
              <div className="sign-col">
                <p className="muted text-slate-400">Waktu Rilis</p>
                <p className="mt-1 font-semibold">{validatedAt ? new Date(validatedAt).toLocaleString("id-ID") : "—"}</p>
              </div>
            </div>

            <p className="text-center text-[9px] text-slate-400">
              PMK 269/2008 · PMK 43/2013 · ISO 15189:2022 · Tanda tangan elektronik (TTE) valid — pindai QR untuk verifikasi.
            </p>
            </div>
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
  // Riwayat lintas-order pasien dari DB (medicalrecord.LabOrder, semua status by noRM).
  const [allOrders, setAllOrders] = useState<LabOrder[]>([order]);
  const isDone      = order.status === "Selesai";
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    listLabWorklist({ noRM: order.noRM }, ac.signal)
      .then((rows) => { if (!ac.signal.aborted) setAllOrders(rows.map((d) => applyWorkflowOverlay(mapDbLabOrder(d)))); })
      .catch(() => { /* pertahankan order saat ini */ });
    return () => ac.abort();
  }, [order.noRM]);

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
            desc="Format KOP RS · hanya parameter terisi · QR TTE validator (SpPK)"
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
