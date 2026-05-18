"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, CheckCircle2, Calendar, FileText,
  Clock, UserCheck, Syringe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type RadOrder, type PersiapanData, type KontrasInfo,
  PROTAP_MAP, updateRadWorkflow,
} from "../radShared";
import KontrasPanel from "./persiapan/KontrasPanel";

// ── Protap item ───────────────────────────────────────────

function ProtapItem({
  label, checked, onChange, locked,
}: { label: string; checked: boolean; onChange: (v: boolean) => void; locked: boolean }) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-2.5 text-left text-[12px] transition-all w-full",
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-600 hover:border-teal-200",
        locked && "opacity-60 cursor-not-allowed",
      )}
    >
      <div className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
        checked ? "border-emerald-500 bg-emerald-500" : "border-slate-300",
      )}>
        {checked && <CheckCircle2 size={11} className="text-white" />}
      </div>
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function PersiapanPane({
  order, onStatusChange,
}: { order: RadOrder; onStatusChange: () => void }) {
  const mod    = order.items[0]?.modalitas ?? "Konvensional";
  const hasKontras = order.items.some((i) => i.withKontras);

  const defaultProtap = PROTAP_MAP[mod];
  const saved = order.persiapan;

  const isDone = saved?.verified ||
    ["Akuisisi", "Expertise", "Verifikasi_Hasil", "Selesai"].includes(order.status);

  const [protapChecked, setProtapChecked] = useState<boolean[]>(
    () => defaultProtap.map((_, i) => saved?.protap.includes(defaultProtap[i]) ?? false),
  );
  const [jadwal,   setJadwal]   = useState(saved?.jadwal?.slice(11, 16) ?? "");
  const [catatan,  setCatatan]  = useState(saved?.catatan ?? "");
  const [kontras,  setKontras]  = useState<KontrasInfo>(
    saved?.kontras ?? {
      jenis: "Iodinasi_IV",
      premedikasi: false,
      konsentSigned: false,
      reaksiIntra: "Tidak Ada",
    },
  );
  const [loading, setLoading]   = useState(false);
  const [done,    setDone]      = useState(isDone);

  const allProtapChecked = protapChecked.every(Boolean);
  const kontrasOk = !hasKontras || (kontras.konsentSigned && kontras.dosis);
  const canSubmit = allProtapChecked && jadwal.trim() && kontrasOk && !done;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const now = new Date();
    const jadwalISO = `${order.tanggal}T${jadwal}:00`;

    const data: PersiapanData = {
      jadwal: jadwalISO,
      protap: defaultProtap.filter((_, i) => protapChecked[i]),
      kontras: hasKontras ? kontras : undefined,
      catatan: catatan.trim() || undefined,
      verified: true,
    };

    updateRadWorkflow(order.id, {
      status: "Akuisisi",
      persiapan: data,
      timestamps: { persiapan: now.toISOString() },
    });

    setDone(true);
    setLoading(false);
    onStatusChange();
  };

  const completedCount = protapChecked.filter(Boolean).length;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_280px]">

      {/* ── Left: preparation form ── */}
      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center gap-3 rounded-xl bg-amber-500 px-4 py-3 text-white">
          <Settings size={20} className="shrink-0" />
          <div>
            <p className="font-bold">Persiapan Pasien</p>
            <p className="text-[11px] text-amber-100">
              {mod} · {order.items[0]?.region} · PMK 24/2020
            </p>
          </div>
          <div className="ml-auto rounded-xl bg-white/20 px-3 py-1 text-center">
            <p className="text-xs font-bold">{completedCount}/{defaultProtap.length}</p>
            <p className="text-[9px] text-amber-100">Selesai</p>
          </div>
        </div>

        {/* Done state */}
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-emerald-800">Persiapan Selesai</p>
                  <p className="text-sm text-emerald-600">Jadwal: {saved?.jadwal ? new Date(saved.jadwal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : jadwal} WIB</p>
                </div>
              </div>
              {hasKontras && saved?.kontras && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                    Kontras: {saved.kontras.jenis.replace("_", " ")}
                  </span>
                  {saved.kontras.konsentSigned && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      ✓ Consent
                    </span>
                  )}
                  {saved.kontras.premedikasi && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      ✓ Premedikasi
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" className="flex flex-col gap-4">

              {/* Protap checklist */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileText size={14} className="text-slate-500" />
                  <p className="text-[11px] font-bold text-slate-600">Protap Persiapan — {mod}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {defaultProtap.map((item, i) => (
                    <ProtapItem
                      key={item} label={item} locked={done}
                      checked={protapChecked[i]}
                      onChange={(v) => setProtapChecked((prev) => {
                        const next = [...prev];
                        next[i] = v;
                        return next;
                      })}
                    />
                  ))}
                </div>
              </div>

              {/* Jadwal */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Calendar size={14} className="text-slate-500" />
                  <p className="text-[11px] font-bold text-slate-600">Jadwal Pemeriksaan</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-slate-500">Waktu Pemeriksaan</label>
                    <input
                      type="time"
                      value={jadwal}
                      onChange={(e) => setJadwal(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-slate-500">Catatan Tambahan</label>
                    <input
                      type="text"
                      placeholder="Opsional"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>
              </div>

              {/* Kontras section */}
              {hasKontras && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <KontrasPanel kontras={kontras} onChange={setKontras} locked={done} />
                </motion.div>
              )}

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
                ) : (
                  <Settings size={16} />
                )}
                {loading ? "Menyimpan..." : "Konfirmasi Persiapan Selesai"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: info panel ── */}
      <div className="flex flex-col gap-3">

        {/* Patient allergy card */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Syringe size={14} className="text-rose-600" />
            <p className="text-[11px] font-bold text-rose-800">Alergi Pasien</p>
          </div>
          <p className="text-[11px] text-rose-600">
            Cek riwayat alergi kontras di tab Asesmen sebelum memberikan media kontras.
          </p>
        </div>

        {/* Modalitas info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <p className="text-[11px] font-bold text-slate-600">Target Waktu Persiapan</p>
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Order masuk",        value: order.timestamps.order ? new Date(order.timestamps.order).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—" },
              { label: "Jadwal pemeriksaan",  value: jadwal || "Belum diatur" },
              { label: "Target TAT",          value: { CITO: "≤ 60 mnt", Semi_Cito: "≤ 180 mnt", Rutin: "≤ 360 mnt" }[order.prioritas] },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-[11px]">
                <span className="text-slate-400">{label}</span>
                <span className="font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck size={14} className="text-slate-400" />
              <p className="text-[11px] font-bold text-slate-600">Progress Protap</p>
            </div>
            <span className="text-[11px] font-bold text-teal-700">
              {completedCount}/{defaultProtap.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${defaultProtap.length > 0 ? (completedCount / defaultProtap.length) * 100 : 0}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          {hasKontras && (
            <div className="mt-3 rounded-lg bg-amber-50 p-2.5">
              <p className="text-[10px] font-bold text-amber-700">⚠ Pemeriksaan ini menggunakan media kontras</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Pastikan informed consent telah ditandatangani.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
