"use client";

// Modal cetak Hasil Radiologi — A4 WYSIWYG + QR TTE radiolog (SpRad). Hasil RESMI dari DB
// (medicalrecord.RadResult) bila ada, fallback order.ekspertasi. Pola identik PrintPreviewModal Lab
// (iframe srcdoc + @page A4 + TteQr deterministik). Tanda tangan elektronik = ekspertise & validasi
// disatukan → validator = radiolog penanda tangan. Cetak narasi (indikasi/teknik/temuan/kesan/saran).

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Printer, X, ShieldCheck } from "lucide-react";
import { type RadOrder, fmtDate } from "./radShared";
import { getRadResult } from "@/lib/api/rad/radResult";
import type { RadResultDTO } from "@/lib/schemas/rad/radResult";
import TteQr, { tteSerial } from "@/components/shared/TteQr";

export default function RadPrintModal({ order, onClose }: { order: RadOrder; onClose: () => void }) {
  const [result, setResult] = useState<RadResultDTO | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    getRadResult(order.id, ac.signal)
      .then((r) => { if (!ac.signal.aborted) setResult(r); })
      .catch(() => { /* fallback ke order.ekspertasi */ });
    return () => ac.abort();
  }, [order.id]);

  const eks = order.ekspertasi;
  const report = {
    indikasi: result?.indikasiKlinis || eks?.indikasiKlinis || "",
    teknik:   result?.teknik || eks?.teknik || "",
    temuan:   result?.temuan || eks?.temuan || "",
    kesan:    result?.kesan || eks?.kesan || "",
    saran:    result?.saran || eks?.saran || "",
  };
  const radiolog    = result?.radiolog || eks?.spradNama || "";
  const radiologSip = result?.radiologSip || eks?.spradSIP || "";
  const validatedAt = result?.validatedAt ?? order.validasi?.waktu ?? order.timestamps.rilis ?? null;
  const criticals   = result?.criticalFindings ?? eks?.criticalFindings ?? [];
  const radiografer = (order.akuisisi?.radiografer ?? []).map((r) => r.nama).join(", ") || "—";
  const modItem     = order.items[0];

  const signed    = !!radiolog && !!validatedAt;
  const serial    = tteSerial(`${order.id}|${validatedAt ?? ""}`, "TTE-RAD");
  const qrPayload = `EHIS-RAD|${order.noOrder}|RM:${order.noRM}|VALIDATOR:${radiolog}|${validatedAt ?? ""}|${serial}`;

  const SECTIONS: { label: string; value: string }[] = [
    { label: "Indikasi Klinis",    value: report.indikasi },
    { label: "Teknik Pemeriksaan", value: report.teknik   },
    { label: "Temuan",             value: report.temuan   },
    { label: "Kesan / Konklusi",   value: report.kesan    },
    ...(report.saran ? [{ label: "Saran / Rekomendasi", value: report.saran }] : []),
  ].filter((s) => s.value.trim() !== "");

  function doPrint() {
    const content = document.getElementById("rad-print-content")?.innerHTML ?? "";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hasil Radiologi ${order.noOrder}</title>
      <style>
        @page{size:A4;margin:14mm 12mm}
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b;margin:0}
        .sec{margin-top:10px}
        .sec-label{font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;font-weight:700}
        .sec-val{margin-top:2px;font-size:11px;line-height:1.55;color:#1e293b;white-space:pre-wrap}
        .crit{margin-top:10px;border:1px solid #fecaca;background:#fff1f2;border-radius:6px;padding:8px}
        .crit-h{font-size:10px;font-weight:700;color:#be123c;margin-bottom:3px}
        .crit-row{font-size:10px;color:#be123c}
        .sign-grid{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-top:18px;border-top:1px solid #e2e8f0;padding-top:12px}
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
          <p className="text-sm font-bold text-slate-800">Preview Hasil Radiologi · A4</p>
          <div className="flex items-center gap-2">
            <button
              onClick={doPrint}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-teal-700"
            >
              <Printer size={13} />
              Cetak / Print
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Report content — lembar A4 WYSIWYG */}
        <div className="max-h-[78vh] overflow-y-auto bg-slate-100 p-5">
          <div className="mx-auto w-[210mm] max-w-full bg-white px-12 py-10 shadow-sm" data-paper="A4">
            <div id="rad-print-content" className="space-y-2 text-[11px] text-slate-800">

              {/* Header */}
              <div className="text-center">
                <p className="text-[13px] font-extrabold text-slate-900">HASIL PEMERIKSAAN RADIOLOGI</p>
                <p className="text-[10px] text-slate-500">RS. Contoh Medika — Jl. Contoh No. 1, Jakarta</p>
              </div>

              <div className="border-t-2 border-slate-800" />

              {/* Patient + exam info */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 pt-1">
                {[
                  ["Nama Pasien", order.namaPasien],
                  ["No. Order",   order.noOrder],
                  ["No. RM",      order.noRM],
                  ["Tanggal",     `${order.tanggal} ${order.jam}`],
                  ["Tanggal Lahir", fmtDate(order.tanggalLahir)],
                  ["Dokter Pengirim", order.dokter],
                  ["Pemeriksaan", modItem ? `${modItem.nama} (${modItem.modalitas})` : "—"],
                  ["Unit",        order.unitAsal + (order.ruangan ? ` · ${order.ruangan}` : "")],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="w-28 shrink-0 text-slate-500">{k}</span>
                    <span className="font-semibold text-slate-800">: {v}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200" />

              {/* Narrative report */}
              {SECTIONS.length === 0 ? (
                <p className="rounded border border-dashed border-slate-200 py-4 text-center text-[10px] text-slate-400">
                  Laporan belum tersedia.
                </p>
              ) : (
                SECTIONS.map((s) => (
                  <div key={s.label} className="sec mt-2.5">
                    <p className="sec-label text-[9px] font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
                    <p className="sec-val mt-0.5 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-800">{s.value}</p>
                  </div>
                ))
              )}

              {/* Critical findings */}
              {criticals.length > 0 && (
                <div className="crit mt-2.5 rounded-md border border-rose-200 bg-rose-50 p-2">
                  <p className="crit-h text-[10px] font-bold text-rose-700">Temuan Kritis (Dilaporkan ke DPJP)</p>
                  {criticals.map((f, i) => (
                    <p key={f.id ?? i} className="crit-row text-[10px] text-rose-700">
                      • {f.kategori}{f.metode ? ` — via ${f.metode}${f.namaDokter ? ` ke ${f.namaDokter}` : ""}` : ""}
                    </p>
                  ))}
                </div>
              )}

              {/* Footer — TTD radiografer + TTE QR radiolog (SpRad) + waktu rilis */}
              <div className="sign-grid flex items-end justify-between gap-6 border-t border-slate-200 pt-3">
                <div className="sign-col flex-1 text-center">
                  <p className="muted text-slate-400">Radiografer Pelaksana</p>
                  <div className="sign-line mt-8 border-t border-slate-800 pt-1 text-center font-semibold">{radiografer}</div>
                </div>
                <div className="sign-col flex-1 text-center">
                  <p className="muted text-slate-400">Dokter Spesialis Radiologi</p>
                  {signed ? (
                    <div className="tte-box mt-1 flex flex-col items-center gap-1">
                      <TteQr value={qrPayload} size={84} />
                      <p className="font-semibold text-slate-800">{radiolog}</p>
                      {radiologSip && <p className="text-[9px] text-slate-500">{radiologSip}</p>}
                      <p className="tte-serial font-mono text-[9px] tracking-wider text-slate-500">{serial}</p>
                      <p className="tte-tag flex items-center gap-1 text-[8px] font-bold text-emerald-600">
                        <ShieldCheck size={9} /> Tertandatangani elektronik
                      </p>
                    </div>
                  ) : (
                    <div className="sign-line mt-8 border-t border-slate-800 pt-1 text-center font-semibold">{radiolog || "—"}</div>
                  )}
                </div>
                <div className="sign-col flex-1 text-center">
                  <p className="muted text-slate-400">Waktu Rilis</p>
                  <p className="mt-1 font-semibold">{validatedAt ? new Date(validatedAt).toLocaleString("id-ID") : "—"}</p>
                </div>
              </div>

              <p className="text-center text-[9px] text-slate-400">
                PMK 269/2008 · PMK 24/2020 · SNARS AP 6 · Tanda tangan elektronik (TTE) valid — pindai QR untuk verifikasi.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
