"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, AlertTriangle, CheckCircle2,
  Save, Send, BookOpen, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type RadOrder, type EkspertasiData, type CriticalFinding,
  type CriticalKategori,
} from "../radShared";
import { saveRadResult } from "@/lib/api/rad/radResult";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import CriticalFindingModal, { CriticalFindingSelector } from "../CriticalFindingModal";

// ── Text area auto grow ───────────────────────────────────

function ReportField({
  label, value, onChange, placeholder, rows = 3, locked,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; rows?: number; locked: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold text-slate-600">{label}</label>
      <textarea
        rows={rows}
        disabled={locked}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function EkspertasiPane({
  order, onStatusChange,
}: { order: RadOrder; onStatusChange: () => void }) {
  const saved  = order.ekspertasi;
  const isDone = saved?.isDone ||
    ["Verifikasi_Hasil", "Selesai"].includes(order.status);

  const [indikasi, setIndikasi] = useState(saved?.indikasiKlinis ?? order.catatan ?? "");
  const [teknik,   setTeknik]   = useState(saved?.teknik   ?? "");
  const [temuan,   setTemuan]   = useState(saved?.temuan   ?? "");
  const [kesan,    setKesan]    = useState(saved?.kesan    ?? "");
  const [saran,    setSaran]    = useState(saved?.saran    ?? "");
  const [spradNama, setSpradNama] = useState(saved?.spradNama ?? "");
  const [spradSIP,  setSpradSIP]  = useState(saved?.spradSIP  ?? "");

  const [critKat,  setCritKat]  = useState<CriticalKategori[]>(
    saved?.criticalFindings.map((f) => f.kategori) ?? [],
  );
  const [showModal, setShowModal] = useState(false);
  const [saved2,    setSaved2]    = useState<EkspertasiData | null>(saved ?? null);

  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(isDone);
  const [draftSaved, setDraftSaved] = useState(false);

  const hasContent = temuan.trim().length > 20 && kesan.trim().length > 5;
  const canSubmit  = hasContent && spradNama.trim().length >= 3 && !done;

  const buildFindings = (): CriticalFinding[] =>
    critKat.map((kat) => {
      const existing = saved?.criticalFindings.find((f) => f.kategori === kat);
      return existing ?? {
        id:        `cf-${Date.now()}-${kat.slice(0, 4)}`,
        kategori:  kat,
        deskripsi: `${kat} ditemukan pada pemeriksaan ${order.items[0]?.nama ?? "ini"}`,
        confirmed: false,
      };
    });

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      await saveRadResult(order.id, {
        indikasiKlinis: indikasi,
        teknik, temuan, kesan, saran: saran || undefined,
        radiolog: spradNama, radiologSip: spradSIP || undefined,
        criticalFindings: buildFindings(),
        finalize: false,
      });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (e) {
      toast.error("Gagal menyimpan draft", e instanceof ApiError ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const findings = buildFindings();
    if (findings.length > 0 && findings.some((f) => !f.confirmed)) {
      setShowModal(true);
    } else {
      finalizeExpertise(findings);
    }
  };

  const finalizeExpertise = async (findings: CriticalFinding[]) => {
    setLoading(true);
    try {
      await saveRadResult(order.id, {
        indikasiKlinis: indikasi, teknik, temuan, kesan,
        saran: saran || undefined,
        radiolog: spradNama, radiologSip: spradSIP || undefined,
        criticalFindings: findings,
        finalize: true,
      });
      const data: EkspertasiData = {
        indikasiKlinis: indikasi, teknik, temuan, kesan,
        saran: saran || undefined, spradNama, spradSIP,
        criticalFindings: findings, isDraft: false, isDone: true,
      };
      setSaved2(data);
      setDone(true);
      setShowModal(false);
      toast.success("Laporan diterbitkan", "Menunggu validasi SpRad");
      onStatusChange();
    } catch (e) {
      toast.error("Gagal menerbitkan laporan", e instanceof ApiError ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  const modItem = order.items[0];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[1fr_260px]">

        {/* ── Left: report form ── */}
        <div className="flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center gap-3 rounded-xl bg-teal-600 px-4 py-3 text-white">
            <FileText size={20} className="shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Expertise / Laporan Radiologi</p>
              <p className="text-[11px] text-teal-200">
                {modItem?.nama} · {modItem?.region} · ACR Practice Parameters
              </p>
            </div>
            {!done && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-[11px] font-semibold hover:bg-white/30 transition-colors"
              >
                <Save size={11} />
                {draftSaved ? "Tersimpan ✓" : "Simpan Draft"}
              </button>
            )}
          </div>

          {/* Done state */}
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Laporan Diterbitkan</p>
                    <p className="text-sm text-teal-600">
                      {saved2?.spradNama ?? spradNama} · {saved2?.spradSIP ?? spradSIP}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    { label: "Indikasi Klinis", value: saved2?.indikasiKlinis ?? indikasi },
                    { label: "Teknik",          value: saved2?.teknik ?? teknik           },
                    { label: "Temuan",           value: saved2?.temuan ?? temuan           },
                    { label: "Kesan",            value: saved2?.kesan ?? kesan             },
                    ...(saved2?.saran || saran ? [{ label: "Saran", value: saved2?.saran ?? saran }] : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                      <p className="mt-0.5 text-sm text-slate-700 leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>

                {(saved2?.criticalFindings.length ?? 0) > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                    <p className="mb-2 text-[11px] font-bold text-rose-700">Temuan Kritis (Sudah Dikonfirmasi)</p>
                    {saved2?.criticalFindings.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 text-[11px] text-rose-600">
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        {f.kategori} — via {f.metode} ke {f.namaDokter}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="form" className="flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Laporan Radiologi</p>

                  <div className="flex flex-col gap-3">
                    <ReportField
                      label="Indikasi Klinis" locked={done}
                      value={indikasi} onChange={setIndikasi}
                      placeholder="Keluhan, diagnosis klinis, alasan pemeriksaan..."
                      rows={2}
                    />
                    <ReportField
                      label="Teknik Pemeriksaan" locked={done}
                      value={teknik} onChange={setTeknik}
                      placeholder={`Teknik pemeriksaan ${modItem?.modalitas ?? ""}, parameter yang digunakan...`}
                      rows={2}
                    />
                    <ReportField
                      label="Temuan (Deskripsi per Organ / Anatomi)" locked={done}
                      value={temuan} onChange={setTemuan}
                      placeholder="Deskripsikan temuan secara sistematis per organ. Sertakan ukuran, lokasi, karakteristik, vaskularisasi, densitas/sinyal..."
                      rows={6}
                    />
                    <ReportField
                      label="Kesan / Konklusi *" locked={done}
                      value={kesan} onChange={setKesan}
                      placeholder="Simpulkan temuan diagnostik utama. Sertakan TI-RADS/BI-RADS/LI-RADS jika relevan..."
                      rows={3}
                    />
                    <ReportField
                      label="Saran / Rekomendasi (Opsional)" locked={done}
                      value={saran} onChange={setSaran}
                      placeholder="Saran pemeriksaan lanjutan, follow-up, atau tindakan..."
                      rows={2}
                    />
                  </div>

                  {/* SpRad identity */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-500">Nama SpRad *</label>
                      <input type="text" placeholder="dr. Nama Lengkap Sp.Rad"
                        value={spradNama} onChange={(e) => setSpradNama(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-500">No. SIP SpRad *</label>
                      <input type="text" placeholder="SIP/RAD/YYYY/XXXX"
                        value={spradSIP} onChange={(e) => setSpradSIP(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                  whileHover={canSubmit ? { scale: 1.01 } : {}}
                  whileTap={canSubmit ? { scale: 0.99 } : {}}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
                    canSubmit
                      ? "bg-teal-600 text-white shadow-md shadow-teal-200 hover:bg-teal-700"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed",
                  )}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    />
                  ) : <Send size={16} />}
                  {loading ? "Memproses..." : critKat.length > 0
                    ? `Terbitkan Laporan + Konfirmasi ${critKat.length} Temuan Kritis`
                    : "Terbitkan Laporan → Validasi SpRad"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: critical findings + reference ── */}
        <div className="flex flex-col gap-3">

          {/* Critical findings selector */}
          <div className="rounded-2xl border border-rose-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-600" />
              <p className="text-[11px] font-bold text-rose-800">Temuan Kritis</p>
            </div>
            <p className="mb-3 text-[10px] text-slate-400">
              Pilih jika ada temuan yang memerlukan pelaporan segera ke DPJP.
            </p>
            <CriticalFindingSelector
              selected={critKat}
              onChange={setCritKat}
            />
            {critKat.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-lg bg-rose-50 p-2.5"
              >
                <p className="text-[11px] font-bold text-rose-700">
                  {critKat.length} temuan kritis dipilih
                </p>
                <p className="text-[10px] text-rose-600 mt-0.5">
                  Konfirmasi pelaporan ke DPJP wajib dilakukan sebelum laporan diterbitkan.
                </p>
              </motion.div>
            )}
          </div>

          {/* Exam reference */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen size={13} className="text-slate-400" />
              <p className="text-[11px] font-bold text-slate-500">Info Pemeriksaan</p>
            </div>
            <div className="space-y-1.5 text-[11px]">
              {[
                { label: "Pemeriksaan", value: modItem?.nama ?? "—"         },
                { label: "Region",      value: modItem?.region ?? "—"        },
                { label: "Modalitas",   value: modItem?.modalitas ?? "—"     },
                { label: "Kontras",     value: modItem?.withKontras ? "Ya" : "Tidak" },
                { label: "Dokter",      value: order.dokter                   },
                { label: "Prioritas",   value: order.prioritas.replace("_", "-") },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-semibold text-slate-700 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="rounded-xl bg-teal-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <User size={12} className="text-teal-600" />
              <p className="text-[10px] font-bold text-teal-700">Panduan Pelaporan</p>
            </div>
            <p className="text-[10px] text-teal-600 leading-relaxed">
              Gunakan terminologi standar (TI-RADS, BI-RADS, LI-RADS, ACR Appropriateness). Sertakan ukuran lesi dalam 3 dimensi. Deskripsikan secara sistematis.
            </p>
          </div>
        </div>
      </div>

      {/* Critical Finding Modal */}
      {showModal && (
        <CriticalFindingModal
          findings={buildFindings()}
          onConfirmAll={finalizeExpertise}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
}
