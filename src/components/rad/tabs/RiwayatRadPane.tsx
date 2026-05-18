"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Printer, ChevronDown, ChevronUp, FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type RadOrder, deriveRadOrders, RAD_STATUS_CFG, MODALITAS_CFG,
  URGENSI_CFG, fmtTimestamp, fmtDate,
} from "../radShared";

// ── History card ──────────────────────────────────────────

function HistCard({ order, isCurrent }: { order: RadOrder; isCurrent: boolean }) {
  const [open, setOpen] = useState(false);
  const statusCfg = RAD_STATUS_CFG[order.status];
  const modItem   = order.items[0];
  const modCfg    = modItem ? MODALITAS_CFG[modItem.modalitas] : null;
  const urgCfg    = URGENSI_CFG[order.prioritas];

  return (
    <div className={cn(
      "rounded-2xl border bg-white transition-shadow",
      isCurrent ? "border-teal-300 ring-2 ring-teal-100 shadow-md" : "border-slate-200",
    )}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 p-4"
      >
        {/* Modalitas icon */}
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold",
          modCfg?.bgColor ?? "bg-slate-100", modCfg?.textColor ?? "text-slate-600",
        )}>
          {modItem?.modalitas?.slice(0, 2) ?? "—"}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900 truncate">
              {modItem?.nama ?? "—"}
            </p>
            {isCurrent && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[9px] font-bold text-teal-700">
                Order Ini
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            <span className={cn("rounded-full px-2 py-0.5 font-semibold", urgCfg.badge)}>
              {urgCfg.label}
            </span>
            <span className={cn("flex items-center gap-1 rounded-lg px-2 py-0.5", statusCfg.badge)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
              {statusCfg.label}
            </span>
            <span className="text-slate-400">{order.tanggal}</span>
          </div>
        </div>

        <div className="shrink-0 text-slate-400">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-4">
              {/* Kesan */}
              {order.ekspertasi?.kesan && (
                <div className="mb-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Kesan / Konklusi</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{order.ekspertasi.kesan}</p>
                </div>
              )}

              {/* Temuan kritis */}
              {(order.ekspertasi?.criticalFindings.length ?? 0) > 0 && (
                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5">
                  <p className="text-[10px] font-bold text-rose-700 mb-1">Temuan Kritis</p>
                  {order.ekspertasi?.criticalFindings.map((f) => (
                    <p key={f.id} className="text-[11px] text-rose-600">· {f.kategori}</p>
                  ))}
                </div>
              )}

              {/* SpRad */}
              {order.ekspertasi?.spradNama && (
                <p className="text-[11px] text-slate-500">
                  SpRad: <span className="font-semibold text-slate-700">{order.ekspertasi.spradNama}</span>
                </p>
              )}

              {/* Timestamps */}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  { label: "Order",    value: fmtTimestamp(order.timestamps.order) },
                  { label: "Akuisisi", value: fmtTimestamp(order.timestamps.akuisisiMulai) },
                  { label: "Expertise",value: fmtTimestamp(order.timestamps.expertise) },
                  { label: "Rilis",    value: fmtTimestamp(order.timestamps.rilis) },
                ].map(({ label, value }) => value !== "—" && (
                  <div key={label} className="flex justify-between text-[10px]">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-semibold text-slate-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Print preview modal ───────────────────────────────────

function PrintPreviewModal({ order, onClose }: { order: RadOrder; onClose: () => void }) {
  const eksper  = order.ekspertasi;
  const validasi = order.validasi;

  const handlePrint = () => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`
      <!DOCTYPE html><html><head>
      <title>Laporan Radiologi - ${order.noOrder}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 20mm; color: #000; }
        .kop { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
        .kop h2 { margin: 0; font-size: 14px; } .kop p { margin: 2px 0; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        td { padding: 3px 6px; vertical-align: top; } td:first-child { width: 35%; font-weight: bold; }
        .section { margin-bottom: 10px; } .section-title { font-weight: bold; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #ccc; margin-bottom: 4px; }
        .watermark { position: fixed; bottom: 20mm; right: 10mm; opacity: 0.08; font-size: 48px; font-weight: bold; transform: rotate(-45deg); color: #000; }
        .ttd { margin-top: 20px; text-align: right; } .ttd p { margin: 2px 0; }
        @media print { .watermark { display: block; } }
      </style></head><body>
      <div class="kop">
        <h2>RUMAH SAKIT EHIS</h2>
        <p>Jl. Kesehatan No. 1, Jakarta · Telp: (021) 555-0100</p>
        <h3 style="margin: 8px 0 0">LAPORAN RADIOLOGI</h3>
      </div>
      <table>
        <tr><td>No. Order</td><td>${order.noOrder}</td><td>Tanggal</td><td>${order.tanggal} ${order.jam}</td></tr>
        <tr><td>Nama Pasien</td><td>${order.namaPasien}</td><td>No. RM</td><td>${order.noRM}</td></tr>
        <tr><td>Tgl Lahir</td><td>${fmtDate(order.tanggalLahir)}</td><td>Usia/Jenis Kelamin</td><td>${order.usia}th / ${order.gender === "L" ? "Laki-laki" : "Perempuan"}</td></tr>
        <tr><td>Pemeriksaan</td><td colspan="3">${order.items.map((i) => i.nama).join(", ")}</td></tr>
        <tr><td>Dokter Pengirim</td><td colspan="3">${order.dokter}</td></tr>
      </table>
      ${eksper ? `
        <div class="section"><div class="section-title">Indikasi Klinis</div><p>${eksper.indikasiKlinis}</p></div>
        <div class="section"><div class="section-title">Teknik Pemeriksaan</div><p>${eksper.teknik}</p></div>
        <div class="section"><div class="section-title">Temuan</div><p style="white-space: pre-line">${eksper.temuan}</p></div>
        <div class="section"><div class="section-title">Kesan / Konklusi</div><p><strong>${eksper.kesan}</strong></p></div>
        ${eksper.saran ? `<div class="section"><div class="section-title">Saran</div><p>${eksper.saran}</p></div>` : ""}
      ` : ""}
      <div class="ttd">
        <p>${fmtDate(validasi?.waktu ?? new Date().toISOString())}</p>
        <br/><br/>
        <p><strong>${eksper?.spradNama ?? "—"}</strong></p>
        <p>${eksper?.spradSIP ?? ""}</p>
      </div>
      <div class="watermark">LAPORAN RESMI</div>
      </body></html>
    `);
    doc.close();
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
        >
          <div className="flex items-center gap-3 bg-teal-600 px-5 py-4 text-white">
            <Printer size={18} />
            <p className="font-bold">Cetak Laporan Radiologi</p>
          </div>
          <div className="p-5">
            <div className="mb-4 grid gap-2">
              {[
                { label: "No. Order", value: order.noOrder },
                { label: "Pasien",    value: `${order.namaPasien} · ${order.noRM}` },
                { label: "Pemeriksaan",value: order.items.map((i) => i.nama).join(", ") },
                { label: "SpRad",     value: eksper?.spradNama ?? "—" },
                { label: "Status",    value: order.status },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-[12px]">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-semibold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 hover:bg-slate-50">
                Tutup
              </button>
              <button onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700">
                <Printer size={14} />
                Cetak Laporan
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RiwayatRadPane({ order }: { order: RadOrder }) {
  const [showPrint, setShowPrint] = useState(false);
  const allOrders = deriveRadOrders();
  const history   = allOrders
    .filter((o) => o.noRM === order.noRM)
    .sort((a, b) => (b.timestamps.order ?? "").localeCompare(a.timestamps.order ?? ""));

  const isDone   = order.status === "Selesai";
  const counts   = {
    total:    history.length,
    selesai:  history.filter((o) => o.status === "Selesai").length,
    aktif:    history.filter((o) => !["Selesai", "Ditolak"].includes(o.status)).length,
    kritis:   history.filter((o) => (o.ekspertasi?.criticalFindings.length ?? 0) > 0).length,
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3 text-white">
        <History size={20} className="shrink-0" />
        <div className="flex-1">
          <p className="font-bold">Riwayat Pemeriksaan Radiologi</p>
          <p className="text-[11px] text-slate-400">{order.namaPasien} · {order.noRM}</p>
        </div>
        {isDone && (
          <button
            onClick={() => setShowPrint(true)}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-[12px] font-semibold hover:bg-white/20 transition-colors"
          >
            <Printer size={13} />
            Cetak
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total",   value: counts.total,   color: "text-slate-700",  bg: "bg-slate-50",   icon: FileText   },
          { label: "Selesai", value: counts.selesai, color: "text-emerald-700",bg: "bg-emerald-50",  icon: CheckCircle2 },
          { label: "Aktif",   value: counts.aktif,   color: "text-teal-700",   bg: "bg-teal-50",     icon: Clock       },
          { label: "Kritis",  value: counts.kritis,  color: "text-rose-700",   bg: "bg-rose-50",     icon: AlertTriangle},
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={cn("flex flex-col items-center gap-1 rounded-xl border border-slate-200 py-3", bg)}>
            <Icon size={14} className={color} />
            <p className={cn("text-lg font-black tabular-nums", color)}>{value}</p>
            <p className="text-[10px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* History list */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-slate-400">
          <History size={24} className="text-slate-300" />
          <p className="text-sm">Belum ada riwayat pemeriksaan</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((o) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <HistCard order={o} isCurrent={o.id === order.id} />
            </motion.div>
          ))}
        </div>
      )}

      {!isDone && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] text-amber-700">
            Cetak laporan tersedia setelah laporan divalidasi dan status menjadi <strong>Selesai</strong>.
          </p>
        </div>
      )}

      {showPrint && (
        <PrintPreviewModal order={order} onClose={() => setShowPrint(false)} />
      )}
    </div>
  );
}
