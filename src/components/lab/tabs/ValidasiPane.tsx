"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LabOrder,
  FLAG_CFG,
  KATEGORI_CFG,
  hasCriticalResult,
  updateLabWorkflow,
} from "../labShared";
import { ingestLabOrder } from "@/lib/billing/chargeIngest";

interface Props {
  order: LabOrder;
  onStatusChange: () => void;
}

// ── Hasil Summary Row ─────────────────────────────────────

function HasilSummaryRow({
  nama,
  nilai,
  satuan,
  flag,
  rujukanStr,
}: {
  nama: string;
  nilai?: string;
  satuan: string;
  flag?: import("../labShared").FlagHasil;
  rujukanStr: string;
}) {
  const flagCfg = flag ? FLAG_CFG[flag] : null;
  return (
    <tr
      className={cn(
        "border-b border-slate-100 last:border-0",
        flag === "C" && nilai
          ? "bg-rose-50"
          : flag === "H" && nilai
            ? "bg-amber-50/30"
            : flag === "L" && nilai
              ? "bg-sky-50/30"
              : "",
      )}
    >
      <td className="py-2 text-[12px] text-slate-700">{nama}</td>
      <td
        className={cn(
          "py-2 text-center text-sm font-bold",
          flagCfg?.cls ?? "text-slate-400",
        )}
      >
        {nilai ?? "—"}
      </td>
      <td className="py-2 text-[11px] text-slate-400">{satuan}</td>
      <td className="py-2 text-[11px] text-slate-400">{rujukanStr}</td>
      <td className="py-2">
        {flag && nilai && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              flag === "C"
                ? "bg-rose-100 text-rose-700"
                : flag === "H"
                  ? "bg-amber-100 text-amber-700"
                  : flag === "L"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-emerald-50 text-emerald-600",
            )}
          >
            {flagCfg?.label}
          </span>
        )}
      </td>
    </tr>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function ValidasiPane({ order, onStatusChange }: Props) {
  const isDone = order.status === "Selesai";
  const canValidate = order.status === "Divalidasi";
  const noHasil = !order.hasil?.length;
  const isRejected = order.status === "Ditolak";

  const [validator, setValidator] = useState(order.validator ?? "");
  const [catatan, setCatatan] = useState(order.catatanValidator ?? "");
  const [confirm1, setConfirm1] = useState(isDone);
  const [confirm2, setConfirm2] = useState(isDone);
  const [saving, setSaving] = useState(false);

  const hasCritical = order.hasil ? hasCriticalResult(order.hasil) : false;
  const allCriticalConfirmed =
    order.criticalNotifs?.every((n) => n.confirmed) ?? true;
  const canSubmit = confirm1 && confirm2 && validator.trim().length > 0;

  function handleValidate() {
    if (!canSubmit) return;
    setSaving(true);
    setTimeout(() => {
      updateLabWorkflow(order.id, {
        status: "Selesai",
        validator,
        catatanValidator: catatan,
        timestamps: {
          validasi: new Date().toISOString().slice(0, 16),
          rilis: new Date().toISOString().slice(0, 16),
        },
      });
      // BL6.1 — silent wiring ke Billing. Idempotent (dedupe by sourceRef).
      // Jika invoice tidak ditemukan untuk noRM ini, ingest no-op (charges
      // akan muncul di invoice saat pasien dapat tagihan baru — fallback ok).
      const result = ingestLabOrder(order);
      if (result.ok && result.added > 0) {
        // eslint-disable-next-line no-console
        console.info(
          `[Billing] Lab ${order.noOrder} → invoice ${result.invoiceId} (+${result.added} charges, ${result.skipped} skipped)`,
        );
      }
      setSaving(false);
      onStatusChange();
    }, 700);
  }

  if (isRejected || noHasil) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center">
        <Lock size={28} className="text-slate-300" />
        <p className="text-sm text-slate-400">
          {isRejected
            ? "Specimen ditolak — tidak ada hasil untuk divalidasi"
            : "Hasil pemeriksaan belum dientry"}
        </p>
      </div>
    );
  }

  if (!canValidate && !isDone) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center">
        <Lock size={28} className="text-slate-300" />
        <p className="text-sm text-slate-400">Entry hasil belum selesai</p>
      </div>
    );
  }

  // Group results by category
  const grouped = new Map<string, typeof order.hasil>();
  for (const h of order.hasil ?? []) {
    const k = h.kategori;
    const list = grouped.get(k) ?? [];
    list.push(h);
    grouped.set(k, list);
  }

  const labelCls = "block text-[11px] font-semibold text-slate-500 mb-1";
  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400";

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_320px]">
      {/* Left — Results Review + Sign */}
      <div className="space-y-4">
        {/* Critical value warning */}
        {hasCritical && !allCriticalConfirmed && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-3"
          >
            <AlertTriangle size={18} className="mt-0.5 text-rose-600" />
            <div>
              <p className="text-sm font-bold text-rose-800">
                Nilai Kritis Belum Dikonfirmasi
              </p>
              <p className="text-[11px] text-rose-700">
                Konfirmasi notifikasi ke dokter sebelum validasi dapat
                dilakukan.
              </p>
            </div>
          </motion.div>
        )}

        {/* Results tables */}
        {[...grouped.entries()].map(([kat, items]) => {
          if (!items) return null;
          const kCfg = KATEGORI_CFG[kat as keyof typeof KATEGORI_CFG];
          return (
            <div
              key={kat}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5",
                  kCfg.badge.replace("ring-1", ""),
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", kCfg.dot)} />
                <p className="text-[11px] font-bold">{kat}</p>
              </div>
              <div className="overflow-x-auto px-4 pb-3">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-1.5 text-left text-[10px] text-slate-400">
                        Parameter
                      </th>
                      <th className="py-1.5 text-center text-[10px] text-slate-400">
                        Hasil
                      </th>
                      <th className="py-1.5 text-left text-[10px] text-slate-400">
                        Satuan
                      </th>
                      <th className="py-1.5 text-left text-[10px] text-slate-400">
                        Rujukan
                      </th>
                      <th className="py-1.5 text-left text-[10px] text-slate-400">
                        Flag
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((h) => (
                      <HasilSummaryRow key={h.kode} {...h} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Validation form */}
        <AnimatePresence>
          {!isDone && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <label className={labelCls}>
                  Catatan Klinis Validator (SpPK)
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={3}
                  placeholder="Interpretasi klinis, rekomendasi tindak lanjut…"
                  className={cn(inputCls, "resize-none")}
                />
              </div>

              <div className="space-y-3">
                <label key="c1" className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={confirm1}
                    onChange={(e) => setConfirm1(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-sky-600"
                  />
                  <span className="text-[12px] leading-relaxed text-slate-700">
                    Semua nilai telah direview dan sesuai dengan klinis pasien
                  </span>
                </label>
                <label key="c2" className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={confirm2}
                    onChange={(e) => setConfirm2(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-sky-600"
                  />
                  <span className="text-[12px] leading-relaxed text-slate-700">
                    Nilai kritis (bila ada) sudah dikonfirmasi dan tercatat dalam log
                  </span>
                </label>
              </div>

              <div>
                <label className={labelCls}>
                  Validator (SpPK / Supervisor){" "}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  value={validator}
                  onChange={(e) => setValidator(e.target.value)}
                  placeholder="dr. Nama, Sp.PK"
                  className={inputCls}
                />
              </div>

              <button
                onClick={handleValidate}
                disabled={!canSubmit || saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                <ShieldCheck size={15} />
                {saving
                  ? "Merilis hasil…"
                  : "Validasi & Rilis Hasil ke Rekam Medis"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Done state */}
        {isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 size={20} className="mt-0.5 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-800">
                  Hasil Tervalidasi &amp; Dirilis
                </p>
                <p className="text-[11px] text-emerald-700">
                  Validator: {order.validator} ·{" "}
                  {order.timestamps.rilis &&
                    new Date(order.timestamps.rilis).toLocaleTimeString(
                      "id-ID",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                </p>
              </div>
            </div>

            {order.catatanValidator && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-2">
                  <FileText
                    size={14}
                    className="mt-0.5 shrink-0 text-sky-600"
                  />
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1">
                      Catatan Validator
                    </p>
                    <p className="text-[12px] text-slate-700 leading-relaxed">
                      {order.catatanValidator}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Right — Checklist */}
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Checklist Validasi
          </h4>
          <div className="space-y-2 text-[11px] text-slate-600">
            {[
              "Verifikasi identitas pasien sesuai order",
              "Review konsistensi delta check (vs hasil sebelumnya)",
              "Konfirmasi nilai kritis sudah dilaporkan ke dokter",
              "Interpretasi klinis sesuai kondisi pasien",
              "TTD digital validator tersimpan dalam log audit",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2
                  size={13}
                  className={cn(
                    "mt-0.5 shrink-0",
                    isDone ? "text-emerald-500" : "text-slate-300",
                  )}
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[9px] text-slate-400">
            ISO 15189:2022 §5.6 · SNARS AP 5
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">
            Info Order
          </p>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Order</span>
              <span className="font-mono font-semibold text-slate-700">
                {order.noOrder}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dokter</span>
              <span className="text-slate-700">
                {order.dokter.split(",")[0]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Analis</span>
              <span className="text-slate-700">{order.analis ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
