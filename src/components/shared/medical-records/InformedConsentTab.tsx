"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ShieldCheck, X, Info,
  Calendar, Edit3, Stethoscope, Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ICConsentResult } from "@/lib/informed-consent/types";
import InformedConsentModal from "@/components/shared/informed-consent/InformedConsentModal";

// ── Patient interface (minimal — both IGD & RI satisfy this) ──

export interface ICPatient {
  name:  string;
  noRM:  string;
}

// ── Primitives ────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}
      {required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

function TI({
  label, value, onChange, placeholder, required, type = "text",
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type={type} value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

function TA({
  label, value, onChange, placeholder, rows = 2, required,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; rows?: number; required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <textarea
        rows={rows} value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        placeholder={placeholder}
        className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

type BlockAccent = "indigo" | "emerald" | "amber" | "rose" | "sky" | "slate";

const ACCENT_MAP: Record<BlockAccent, { header: string; icon: string; title: string }> = {
  indigo:  { header: "border-indigo-100 bg-indigo-50/60",   icon: "text-indigo-400",  title: "text-indigo-800"  },
  emerald: { header: "border-emerald-100 bg-emerald-50/60", icon: "text-emerald-500", title: "text-emerald-800" },
  amber:   { header: "border-amber-100 bg-amber-50/60",     icon: "text-amber-500",   title: "text-amber-800"   },
  rose:    { header: "border-rose-100 bg-rose-50/60",       icon: "text-rose-500",    title: "text-rose-800"    },
  sky:     { header: "border-sky-100 bg-sky-50/60",         icon: "text-sky-500",     title: "text-sky-800"     },
  slate:   { header: "border-slate-200 bg-slate-50/60",     icon: "text-slate-400",   title: "text-slate-700"   },
};

function Block({
  title, icon: Icon, children, accent = "slate", className,
}: {
  title?: string; icon?: React.ElementType; children: React.ReactNode;
  accent?: BlockAccent; className?: string;
}) {
  const a = ACCENT_MAP[accent];
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {title && (
        <div className={cn("flex items-center gap-2 border-b px-4 py-2.5", a.header)}>
          {Icon && <Icon size={13} className={a.icon} />}
          <span className={cn("text-xs font-semibold", a.title)}>{title}</span>
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────

const RISIKO_UMUM = [
  "Perdarahan",
  "Infeksi / Sepsis",
  "Alergi / Reaksi Obat",
  "Cedera Organ Sekitar",
  "Kegagalan Prosedur",
  "Nyeri Pasca Tindakan",
  "Komplikasi Anestesi",
  "Tromboemboli",
  "Kematian (kasus berat)",
];

interface ConsentRecord {
  id: string;
  noFormulir: string;
  tindakan: string;
  keputusan: "setuju" | "menolak";
  waktu: string;
}

// ── Main export ───────────────────────────────────────────

export default function InformedConsentTab({ patient }: { patient: ICPatient }) {
  const [showICModal, setShowICModal] = useState(false);
  const [icResult,    setIcResult]    = useState<ICConsentResult | null>(null);
  const [records,     setRecords]     = useState<ConsentRecord[]>([]);
  const [form, setForm] = useState({
    noFormulir:        `IC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
    tindakan:          "",
    tujuan:            "",
    manfaat:           "",
    risiko:            [] as string[],
    risikoLain:        "",
    alternatif:        "",
    konsekuensiTolak:  "",
    pertanyaanPasien:  "",
    keputusan:         "" as "setuju" | "menolak" | "",
    alasanTolak:       "",
    namaPasienWali:    "",
    hubungan:          "Pasien Sendiri",
    namaWitness1:      "",
    namaWitness2:      "",
    namaDokter:        "",
    tanggal:           new Date().toISOString().split("T")[0],
    waktu:             new Date().toTimeString().slice(0, 5),
  });
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const canSave =
    form.tindakan.trim() !== "" &&
    form.keputusan !== "" &&
    form.namaDokter.trim() !== "" &&
    form.namaPasienWali.trim() !== "";

  const handleSave = () => {
    if (!canSave) return;
    setRecords((p) => [
      {
        id: `ic-${Date.now()}`,
        noFormulir: form.noFormulir,
        tindakan: form.tindakan,
        keputusan: form.keputusan as "setuju" | "menolak",
        waktu: `${form.tanggal} ${form.waktu}`,
      },
      ...p,
    ]);
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Legal header */}
      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100">
          <ShieldCheck size={14} className="text-sky-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-sky-800">Formulir Persetujuan Tindakan Medis</p>
          <p className="text-[11px] text-sky-600">
            PerMenKes No. 290/MENKES/PER/III/2008 · UU Kesehatan No. 17 Tahun 2023 · Standar JCI
          </p>
        </div>
        <span className="ml-auto shrink-0 font-mono text-[11px] font-bold text-sky-600">{form.noFormulir}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">

        {/* Left: Detail tindakan */}
        <div className="flex flex-col gap-3">

          <Block title="Detail Tindakan / Prosedur" icon={Stethoscope} accent="sky">
            <TI label="Nama Tindakan / Prosedur" required value={form.tindakan}
              onChange={(v) => setF("tindakan", v)}
              placeholder="Contoh: Kateterisasi Jantung, Laparotomi Eksplorasi..." />
            <TA label="Tujuan Tindakan" rows={2} value={form.tujuan}
              onChange={(v) => setF("tujuan", v)}
              placeholder="Mengapa tindakan ini diperlukan untuk pasien..." />
            <TA label="Manfaat yang Diharapkan" rows={2} value={form.manfaat}
              onChange={(v) => setF("manfaat", v)}
              placeholder="Hasil yang diharapkan dari tindakan ini..." />
          </Block>

          <Block title="Risiko & Komplikasi yang Dijelaskan" icon={AlertTriangle} accent="amber">
            <p className="text-[11px] text-slate-500">
              Centang risiko yang telah dijelaskan kepada pasien/keluarga:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RISIKO_UMUM.map((r) => {
                const sel = form.risiko.includes(r);
                return (
                  <button
                    key={r} type="button"
                    onClick={() => setF("risiko", sel ? form.risiko.filter((x) => x !== r) : [...form.risiko, r])}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                      sel
                        ? "border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        : "border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:bg-amber-50",
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            <TI label="Risiko Spesifik Lainnya" value={form.risikoLain}
              onChange={(v) => setF("risikoLain", v)}
              placeholder="Risiko tambahan berdasarkan kondisi klinis pasien..." />
          </Block>

          <Block title="Alternatif & Konsekuensi" icon={Info} accent="indigo">
            <TA label="Alternatif Tindakan yang Tersedia" rows={2} value={form.alternatif}
              onChange={(v) => setF("alternatif", v)}
              placeholder="Pilihan terapi lain yang bisa dipertimbangkan..." />
            <TA label="Konsekuensi jika Tindakan Ditolak" rows={2} value={form.konsekuensiTolak}
              onChange={(v) => setF("konsekuensiTolak", v)}
              placeholder="Risiko / dampak medis jika pasien menolak dilakukan tindakan..." />
            <TA label="Pertanyaan / Klarifikasi dari Pasien/Keluarga" rows={2} value={form.pertanyaanPasien}
              onChange={(v) => setF("pertanyaanPasien", v)}
              placeholder="Pertanyaan yang diajukan dan penjelasan yang diberikan dokter..." />
          </Block>
        </div>

        {/* Right: Keputusan & TTD */}
        <div className="flex flex-col gap-3">

          <Block title="Keputusan Pasien / Wali" icon={CheckCircle2} accent="emerald">
            <div>
              <Label required>Keputusan Final</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setF("keputusan", "setuju")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 transition",
                    form.keputusan === "setuju"
                      ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                      : "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition",
                    form.keputusan === "setuju" ? "border-emerald-400 bg-emerald-100" : "border-slate-200 bg-slate-50",
                  )}>
                    <CheckCircle2 size={20} className={form.keputusan === "setuju" ? "text-emerald-600" : "text-slate-300"} />
                  </div>
                  <span className={cn("text-xs font-bold", form.keputusan === "setuju" ? "text-emerald-700" : "text-slate-500")}>
                    Menyetujui
                  </span>
                  <span className={cn("text-[10px] text-center leading-tight", form.keputusan === "setuju" ? "text-emerald-600" : "text-slate-400")}>
                    Pasien/wali menyetujui tindakan yang dijelaskan
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setF("keputusan", "menolak")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 transition",
                    form.keputusan === "menolak"
                      ? "border-rose-400 bg-rose-50 ring-2 ring-rose-100"
                      : "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition",
                    form.keputusan === "menolak" ? "border-rose-400 bg-rose-100" : "border-slate-200 bg-slate-50",
                  )}>
                    <X size={20} className={form.keputusan === "menolak" ? "text-rose-600" : "text-slate-300"} />
                  </div>
                  <span className={cn("text-xs font-bold", form.keputusan === "menolak" ? "text-rose-700" : "text-slate-500")}>
                    Menolak
                  </span>
                  <span className={cn("text-[10px] text-center leading-tight", form.keputusan === "menolak" ? "text-rose-600" : "text-slate-400")}>
                    Pasien/wali menolak tindakan yang diusulkan
                  </span>
                </button>
              </div>
            </div>

            {form.keputusan === "menolak" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-xl border border-rose-200 bg-rose-50 p-3"
              >
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
                  <AlertTriangle size={11} />
                  Penolakan Tindakan Medis — Surat Pernyataan Diperlukan
                </p>
                <TA label="Alasan Penolakan" rows={2} value={form.alasanTolak}
                  onChange={(v) => setF("alasanTolak", v)}
                  placeholder="Alasan pasien/wali menolak tindakan yang diusulkan..." />
              </motion.div>
            )}

            <div>
              <Label required>Penanda Tangan</Label>
              <div className="flex flex-col gap-2">
                <select
                  value={form.hubungan}
                  onChange={(e) => setF("hubungan", e.target.value)}
                  className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  {["Pasien Sendiri", "Suami / Istri", "Orang Tua", "Anak Kandung", "Saudara Kandung", "Wali Resmi"].map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <TI label="Nama Lengkap Pasien/Wali" required value={form.namaPasienWali}
                  onChange={(v) => setF("namaPasienWali", v)} placeholder="Nama sesuai KTP..." />
              </div>
            </div>

            {/* Signature boxes */}
            <div className="grid grid-cols-2 gap-3">

              <AnimatePresence mode="wait">
                {icResult ? (
                  <motion.div
                    key="ic-done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-2 py-3 text-center"
                  >
                    <div className="h-14 w-28 overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-inner">
                      <img src={icResult.signatureImagePng} alt="TTD Pasien/Wali" className="h-full w-full object-contain" />
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      <CheckCircle2 size={9} /> IC Tersimpan
                    </span>
                    <p className="text-[9px] font-medium text-emerald-700">{icResult.namaPenanda}</p>
                    <p className="text-[9px] text-emerald-500">{icResult.hubungan}</p>
                    <button
                      type="button"
                      onClick={() => setIcResult(null)}
                      className="text-[10px] text-emerald-500 underline transition hover:text-emerald-700"
                    >
                      Ganti TTD
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="ic-empty"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileTap={form.tindakan.trim() ? { scale: 0.97 } : undefined}
                    onClick={() => form.tindakan.trim() && setShowICModal(true)}
                    disabled={!form.tindakan.trim()}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-5 text-center transition-all",
                      form.tindakan.trim()
                        ? "border-dashed border-sky-300 bg-sky-50/60 hover:border-sky-400 hover:bg-sky-100/60"
                        : "cursor-not-allowed border-dashed border-slate-200 bg-slate-50/60 opacity-50",
                    )}
                  >
                    <ShieldCheck size={18} className={form.tindakan.trim() ? "text-sky-400" : "text-slate-300"} />
                    <p className="text-[10px] font-semibold text-slate-500">Tanda Tangan Pasien/Wali</p>
                    <p className="text-[10px] text-slate-400">{form.namaPasienWali || "—"}</p>
                    {form.tindakan.trim() ? (
                      <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-600">
                        Klik untuk TTD
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-300">Isi nama tindakan dulu</span>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>

              <div className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-2 py-5 text-center">
                <Edit3 size={14} className="text-slate-300" />
                <p className="text-[10px] font-semibold text-slate-400">Tanda Tangan Dokter/DPJP</p>
                <p className="text-[10px] font-medium text-slate-500">{form.namaDokter || "—"}</p>
              </div>
            </div>

            <InformedConsentModal
              isOpen={showICModal}
              onClose={() => setShowICModal(false)}
              onSave={(result) => { setIcResult(result); setShowICModal(false); }}
              tindakan={form.tindakan || "Tindakan Medis"}
              deskripsiTindakan={form.tujuan || undefined}
              dokterPelaksana={form.namaDokter || "dr. Dokter DPJP"}
              pasienNama={patient.name}
              pasienNoRM={patient.noRM}
              risiko={form.risiko.length > 0 ? form.risiko : undefined}
            />
          </Block>

          <Block title="Dokter, Saksi & Waktu" icon={Calendar} accent="slate">
            <TI label="Nama Dokter / DPJP" required value={form.namaDokter}
              onChange={(v) => setF("namaDokter", v)} placeholder="dr. Nama Lengkap, Sp.XX..." />
            <div className="grid grid-cols-2 gap-2">
              <TI label="Saksi 1" value={form.namaWitness1}
                onChange={(v) => setF("namaWitness1", v)} placeholder="Nama saksi..." />
              <TI label="Saksi 2" value={form.namaWitness2}
                onChange={(v) => setF("namaWitness2", v)} placeholder="Nama saksi..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TI label="Tanggal" type="date" value={form.tanggal} onChange={(v) => setF("tanggal", v)} />
              <TI label="Waktu" type="time" value={form.waktu} onChange={(v) => setF("waktu", v)} />
            </div>
          </Block>

          <div className="flex gap-2">
            <button
              type="button" onClick={handleSave} disabled={!canSave}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40",
                form.keputusan === "menolak" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700",
              )}
            >
              <CheckCircle2 size={13} />
              {form.keputusan === "menolak" ? "Catat Penolakan" : "Simpan Persetujuan"}
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Printer size={12} />
              Cetak
            </button>
          </div>

          {records.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tersimpan</p>
              {records.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2.5",
                    r.keputusan === "setuju" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50",
                  )}
                >
                  {r.keputusan === "setuju"
                    ? <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                    : <X size={13} className="shrink-0 text-rose-500" />
                  }
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-[11px] font-semibold", r.keputusan === "setuju" ? "text-emerald-800" : "text-rose-800")}>
                      {r.tindakan}
                    </p>
                    <p className={cn("text-[10px]", r.keputusan === "setuju" ? "text-emerald-600" : "text-rose-500")}>
                      {r.noFormulir} · {r.waktu}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
