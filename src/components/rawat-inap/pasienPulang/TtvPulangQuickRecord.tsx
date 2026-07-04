"use client";

// Banner deteksi "TTV pulang" + form catat cepat — panel TTV di Resume Medik (pasien nyata).
// Observation TETAP single source tanda vital: form ini hanya JALAN PINTAS yang POST ke
// endpoint /kunjungan/:id/observasi yang sama dengan tab TTV (tanpa tabel/angka tandingan).
// Banner muncul hanya bila TTV pulang bermasalah: belum ada entri ke-2, atau pengukuran
// terakhir sudah kedaluwarsa (> STALE_JAM). Pencatat & waktu = server (sesi login + now()).

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, HeartPulse, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { Select } from "@/components/shared/inputs";
import { recordObservasi, type ObservationDTO } from "@/lib/api/observation";
import { StatusKesadaran } from "@/lib/schemas/observation";

const STALE_JAM = 6;

const KESADARAN_OPTS = StatusKesadaran.options.map(v => ({
  value: v, label: v.replace(/_/g, " "),
}));

interface Props {
  kunjunganId: string;
  obsCount: number;
  lastObsAt: string | null; // ISO
  onSaved: (dto: ObservationDTO) => void;
}

function NumField({
  label, value, onChange, placeholder, step,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; step?: string;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
      />
    </div>
  );
}

export default function TtvPulangQuickRecord({ kunjunganId, obsCount, lastObsAt, onSaved }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    tdSistolik: "", tdDiastolik: "", nadi: "", respirasi: "", suhu: "", spo2: "",
    skalaNyeri: "0", gcsEye: "4", gcsVerbal: "5", gcsMotor: "6",
    statusKesadaran: "Compos_Mentis",
  });
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));

  // ── Deteksi masalah TTV pulang ──
  const staleJam = lastObsAt
    ? (Date.now() - new Date(lastObsAt).getTime()) / 3600000
    : null;
  const problem: string | null =
    obsCount === 0
      ? "Belum ada TTV tercatat untuk kunjungan ini — TTV masuk & pulang kosong."
      : obsCount === 1
        ? "TTV pulang belum tercatat — baru 1 pengukuran (dipakai sebagai TTV masuk)."
        : staleJam !== null && staleJam > STALE_JAM
          ? `Pengukuran terakhir sudah ${Math.floor(staleJam)} jam lalu — catat TTV akhir menjelang pemulangan.`
          : null;

  if (!problem) return null;

  const requiredFilled =
    f.tdSistolik !== "" && f.tdDiastolik !== "" && f.nadi !== "" &&
    f.respirasi !== "" && f.suhu !== "" && f.spo2 !== "";

  async function simpan() {
    if (!requiredFilled || saving) return;
    setSaving(true);
    try {
      const dto = await recordObservasi(kunjunganId, {
        tdSistolik: Number(f.tdSistolik),
        tdDiastolik: Number(f.tdDiastolik),
        nadi: Number(f.nadi),
        respirasi: Number(f.respirasi),
        suhu: Number(f.suhu),
        spo2: Number(f.spo2),
        skalaNyeri: Number(f.skalaNyeri || 0),
        gcsEye: Number(f.gcsEye),
        gcsVerbal: Number(f.gcsVerbal),
        gcsMotor: Number(f.gcsMotor),
        statusKesadaran: f.statusKesadaran as StatusKesadaran,
        beratBadan: undefined,
        tinggiBadan: undefined,
        shift: undefined,
        perawat: undefined,        // pencatat diturunkan server dari sesi login
        waktuObservasi: undefined, // kosong → server pakai now()
      });
      toast.success("TTV tercatat", "Tersimpan ke tab TTV (Observation) sebagai pengukuran terbaru");
      setShowForm(false);
      setF(p => ({ ...p, tdSistolik: "", tdDiastolik: "", nadi: "", respirasi: "", suhu: "", spo2: "" }));
      onSaved(dto);
    } catch (e) {
      toast.error("Gagal mencatat TTV", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-amber-200 bg-amber-50">
      {/* Banner */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="flex-1 text-[11px] leading-snug text-amber-700">{problem}</p>
        <button
          onClick={() => setShowForm(s => !s)}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition",
            showForm
              ? "bg-white text-amber-700 ring-1 ring-amber-300"
              : "bg-amber-500 text-white hover:bg-amber-600 active:scale-95",
          )}
        >
          {showForm ? <><X size={10} /> Tutup</> : <><HeartPulse size={10} /> Catat TTV Pulang</>}
        </button>
      </div>

      {/* Form catat cepat */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-amber-200 bg-white px-3 py-3">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                <NumField label="TD Sistolik" value={f.tdSistolik} onChange={set("tdSistolik")} placeholder="mmHg" />
                <NumField label="TD Diastolik" value={f.tdDiastolik} onChange={set("tdDiastolik")} placeholder="mmHg" />
                <NumField label="Nadi" value={f.nadi} onChange={set("nadi")} placeholder="×/mnt" />
                <NumField label="Respirasi" value={f.respirasi} onChange={set("respirasi")} placeholder="×/mnt" />
                <NumField label="Suhu" value={f.suhu} onChange={set("suhu")} placeholder="°C" step="0.1" />
                <NumField label="SpO₂" value={f.spo2} onChange={set("spo2")} placeholder="%" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <NumField label="GCS E (1–4)" value={f.gcsEye} onChange={set("gcsEye")} />
                <NumField label="GCS V (1–5)" value={f.gcsVerbal} onChange={set("gcsVerbal")} />
                <NumField label="GCS M (1–6)" value={f.gcsMotor} onChange={set("gcsMotor")} />
                <NumField label="Nyeri (0–10)" value={f.skalaNyeri} onChange={set("skalaNyeri")} />
                <div>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-500">Kesadaran</label>
                  <Select
                    value={f.statusKesadaran}
                    onChange={set("statusKesadaran")}
                    options={KESADARAN_OPTS}
                  />
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <p className="text-[9.5px] text-slate-400">
                  Tersimpan ke tab TTV (satu sumber) · waktu = sekarang · pencatat = sesi login
                </p>
                <button
                  onClick={simpan}
                  disabled={!requiredFilled || saving}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-[10.5px] font-bold transition",
                    requiredFilled && !saving
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
                      : "cursor-not-allowed bg-slate-100 text-slate-400",
                  )}
                >
                  {saving ? "Menyimpan…" : "Simpan TTV"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
