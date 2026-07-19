"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { useLabRoster } from "../useLabRoster";
import ValidatorPicker from "../ValidatorPicker";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import {
  type LabOrder,
  type HasilItem,
  FLAG_CFG,
  KATEGORI_CFG,
  hasCriticalResult,
  updateLabWorkflow,
  dtoValueToHasil,
  hasilKey,
} from "../labShared";
import { getLabResult, validateLabResult, type LabResultDTO } from "@/lib/api/lab/labResult";

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
  const { session, can } = useSession();
  const isDone = order.status === "Selesai";
  const canValidate = order.status === "Divalidasi";
  const isRejected = order.status === "Ditolak";
  const canSign = can("ancillary.lab.validate", "update");

  // Validator = DOKTER ter-assign ke Laboratorium (SDM Assignment), diverifikasi server. Superuser/
  // global boleh validasi tanpa pilih dokter (selaras bypass server di labAssignment).
  const { doctors, loading: rosterLoading } = useLabRoster(order.id);
  const noDoctors = !rosterLoading && doctors.length === 0;
  const bypass = !!session && (session.isSuperuser || session.isGlobal);

  const [result, setResult] = useState<LabResultDTO | null>(null);
  const [validatorSel, setValidatorSel] = useState(""); // pegawaiId dokter terpilih
  const [catatan, setCatatan] = useState("");
  const [confirm1, setConfirm1] = useState(isDone);
  const [confirm2, setConfirm2] = useState(isDone);
  const [saving, setSaving] = useState(false);

  // Hasil: overlay sesi (baru entry) atau DB (fresh load).
  const rows: HasilItem[] = (order.hasil?.length ? order.hasil : result?.values.map(dtoValueToHasil)) ?? [];
  const noHasil = rows.length === 0;

  // Dokter terpilih + nama efektif (tersimpan saat final, else dari pilihan / fallback bypass).
  const selectedDoctor = doctors.find((d) => d.pegawaiId === validatorSel);
  const validatorName = isDone
    ? (result?.validator || order.validator || "")
    : (selectedDoctor?.namaTampil ?? (bypass ? session?.namaTampil ?? "" : ""));
  const catatanFinal = result?.catatanValidator ?? order.catatanValidator ?? null;

  const critNotifs = result?.criticalNotifs ?? order.criticalNotifs ?? [];
  const hasCritical = hasCriticalResult(rows);
  const allCriticalConfirmed = critNotifs.every((n) => n.confirmed);
  const canSubmit = confirm1 && confirm2 && canSign && (validatorSel.length > 0 || bypass);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await getLabResult(order.id, ac.signal);
        if (!ac.signal.aborted) setResult(res);
      } catch { /* diam */ }
    })();
    return () => ac.abort();
  }, [order.id]);

  // Pra-pilih: bila SpPK yang login termasuk dokter ter-assign Lab → pilih dirinya otomatis.
  useEffect(() => {
    if (isDone || validatorSel) return;
    const me = doctors.find((d) => d.pegawaiId === session?.pegawaiId);
    if (me) setValidatorSel(me.pegawaiId);
  }, [doctors, session?.pegawaiId, isDone, validatorSel]);

  function handleValidate() {
    if (!canSubmit) return;
    setSaving(true);
    void (async () => {
      try {
        const saved = await validateLabResult(order.id, {
          validatorPegawaiId: validatorSel || undefined,
          validator: validatorName || undefined,
          catatanValidator: catatan || undefined,
        });
        updateLabWorkflow(order.id, {
          status: "Selesai",
          validator: saved.validator ?? validatorName,
          catatanValidator: catatan,
          timestamps: {
            validasi: new Date().toISOString().slice(0, 16),
            rilis: new Date().toISOString().slice(0, 16),
          },
        });
        // Billing = PROYEKSI order server-side (billingProjectionService) → tak perlu ingest client.
        toast.success("Hasil tervalidasi & dirilis", `Validator: ${saved.validator ?? validatorName}`);
        onStatusChange();
      } catch (e) {
        toast.error("Gagal memvalidasi hasil", e instanceof ApiError ? e.message : undefined);
      } finally {
        setSaving(false);
      }
    })();
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
  const grouped = new Map<string, HasilItem[]>();
  for (const h of rows) {
    const list = grouped.get(h.kategori) ?? [];
    list.push(h);
    grouped.set(h.kategori, list);
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
                      <HasilSummaryRow key={hasilKey(h)} {...h} />
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
                  Validator (Dokter Penanggung Jawab Lab){" "}
                  <span className="text-rose-400">*</span>
                </label>
                <ValidatorPicker
                  doctors={doctors}
                  value={validatorSel}
                  onChange={setValidatorSel}
                  disabled={!canSign || (noDoctors && !bypass)}
                  optional={bypass}
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Daftar dokter yang ditugaskan ke Laboratorium (SDM Assignment).
                </p>
              </div>

              {noDoctors && !bypass && (
                <p className="flex items-center gap-1.5 text-[11px] text-amber-600">
                  <AlertTriangle size={12} /> Belum ada dokter ter-assign ke Laboratorium (SDM Assignment). Tetapkan dokter penanggung jawab terlebih dahulu.
                </p>
              )}

              {!canSign && (
                <p className="flex items-center gap-1.5 text-[11px] text-amber-600">
                  <AlertTriangle size={12} /> Hanya SpPK / Supervisor (hak validasi) yang dapat merilis hasil.
                </p>
              )}

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
                  Validator: {validatorName || "—"}
                  {(() => {
                    const t = result?.validatedAt ?? order.timestamps.rilis;
                    return t ? ` · ${new Date(t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "";
                  })()}
                </p>
              </div>
            </div>

            {catatanFinal && (
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
                      {catatanFinal}
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
              <span className="text-slate-700">{result?.analis ?? order.analis ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
