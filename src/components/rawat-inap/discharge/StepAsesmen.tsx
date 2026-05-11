"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Heart, User, Home, Activity, Stethoscope, Calendar, BedDouble, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RawatInapPatientDetail } from "@/lib/data";
import {
  type DischargeAsesmen, type HubunganCaregiver, type KemampuanCaregiver,
  type DukunganKeluarga, type KepatuhanObat, type RiwayatReadmisi,
  KONDISI_PULANG_LIST, KONDISI_PULANG_CONFIG,
  KEMAMPUAN_CONFIG, HOMECARE_OPTIONS, ALAT_BANTU_OPTIONS,
  calcRisikoReadmisi, RISIKO_CONFIG,
} from "./dischargeShared";

type Props = {
  data:     DischargeAsesmen;
  onChange: (d: DischargeAsesmen) => void;
  patient:  RawatInapPatientDetail;
};

const HUBUNGAN_OPTIONS: HubunganCaregiver[] = ["Suami", "Istri", "Anak", "Orang Tua", "Saudara", "Lainnya"];
const KEMAMPUAN_LIST: KemampuanCaregiver[]  = ["Mampu", "Perlu Pendampingan", "Tidak Mampu"];

const DUKUNGAN_OPTIONS: DukunganKeluarga[] = ["Ada & Mampu", "Ada tapi Terbatas", "Tidak Ada"];
const KEPATUHAN_OPTIONS: KepatuhanObat[]   = ["Patuh", "Kadang", "Tidak Patuh"];
const READMISI_OPTIONS: RiwayatReadmisi[]  = ["Tidak", "1x", ">1x"];

const DUKUNGAN_CONFIG: Record<DukunganKeluarga, { sel: string }> = {
  "Ada & Mampu":       { sel: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  "Ada tapi Terbatas": { sel: "border-amber-300 bg-amber-50 text-amber-700" },
  "Tidak Ada":         { sel: "border-red-300 bg-red-50 text-red-700" },
};
const KEPATUHAN_CONFIG: Record<KepatuhanObat, { sel: string }> = {
  "Patuh":       { sel: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  "Kadang":      { sel: "border-amber-300 bg-amber-50 text-amber-700" },
  "Tidak Patuh": { sel: "border-red-300 bg-red-50 text-red-700" },
};
const READMISI_CONFIG: Record<RiwayatReadmisi, { sel: string }> = {
  "Tidak": { sel: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  "1x":    { sel: "border-amber-300 bg-amber-50 text-amber-700" },
  ">1x":   { sel: "border-red-300 bg-red-50 text-red-700" },
};

const RISIKO_DESC: Record<string, string> = {
  RENDAH: "Kondisi mendukung pemulangan. Tetap edukasi dan jadwalkan kontrol.",
  SEDANG: "Perlu perhatian lebih. Pastikan jadwal kontrol dan edukasi keluarga.",
  TINGGI: "Risiko tinggi. Pertimbangkan homecare atau rujukan FKTP intensif.",
};

function Toggle({ checked }: { checked: boolean }) {
  return (
    <div className={cn(
      "pointer-events-none relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200",
      checked ? "bg-sky-500" : "bg-slate-300",
    )}>
      <span className={cn(
        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
        checked ? "translate-x-4" : "translate-x-0.5",
      )} />
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
      <Icon size={12} className="text-sky-500" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}

function hariDirawat(tglMasuk: string): string {
  const BULAN: Record<string, number> = {
    Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5,
    Juli: 6, Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11,
  };
  const parts = tglMasuk.split(" ");
  if (parts.length < 3) return "—";
  const d = parseInt(parts[0]), m = BULAN[parts[1]], y = parseInt(parts[2]);
  if (isNaN(d) || m === undefined || isNaN(y)) return "—";
  const diff = Math.floor((Date.now() - new Date(y, m, d).getTime()) / 86400000);
  return diff >= 0 ? `${diff} hari` : "—";
}

export default function StepAsesmen({ data, onChange, patient }: Props) {
  function set<K extends keyof DischargeAsesmen>(key: K, val: DischargeAsesmen[K]) {
    onChange({ ...data, [key]: val });
  }
  function toggleOption(field: "jenisHomecare" | "alatBantu", val: string) {
    const arr = data[field];
    set(field, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  const kondisiCfg = data.kondisiPulang ? KONDISI_PULANG_CONFIG[data.kondisiPulang] : null;
  const initials   = patient.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  const lama       = hariDirawat(patient.tglMasuk);
  const risiko     = calcRisikoReadmisi(data);

  return (
    <div className="flex flex-col gap-4 xl:flex-row">

      {/* ── Left: Form ── */}
      <div className="min-w-0 flex-1 space-y-3">

        {/* Phase banner */}
        <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5">
          <span className="shrink-0 rounded-full bg-sky-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Fase 1
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-sky-800">Hari 1–2 MRS — Asesmen Awal Pemulangan</p>
            <p className="text-[10px] text-sky-600">Dilakukan saat pasien masuk · Standar SNARS ARK 5</p>
          </div>
        </div>

        {/* Kondisi & Tanggal */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionLabel icon={Heart} label="Kondisi & Rencana Pemulangan" />
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-[11px] font-semibold text-slate-500">
                Kondisi Saat Pulang <span className="text-red-400">*</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {KONDISI_PULANG_LIST.map(k => {
                  const cfg = KONDISI_PULANG_CONFIG[k];
                  const sel = data.kondisiPulang === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => set("kondisiPulang", k)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                        sel
                          ? `${cfg.sel} border shadow-sm`
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white",
                      )}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="max-w-xs">
              <p className="mb-1 text-[11px] font-semibold text-slate-500">Rencana Tanggal KRS</p>
              <input
                type="date"
                value={data.tanggalRencanaKRS}
                onChange={e => set("tanggalRencanaKRS", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>
        </div>

        {/* Caregiver */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionLabel icon={User} label="Caregiver / Penanggung Jawab" />
          <div className="space-y-3">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-500">Nama <span className="text-red-400">*</span></p>
                <input
                  value={data.caregiverNama}
                  onChange={e => set("caregiverNama", e.target.value)}
                  placeholder="Nama penanggung jawab..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-500">Hubungan</p>
                <select
                  value={data.caregiverHubungan}
                  onChange={e => set("caregiverHubungan", e.target.value as HubunganCaregiver)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Pilih...</option>
                  {HUBUNGAN_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">Kemampuan Merawat</p>
              <div className="flex flex-wrap gap-1.5">
                {KEMAMPUAN_LIST.map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set("caregiverKemampuan", k)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                      data.caregiverKemampuan === k
                        ? `${KEMAMPUAN_CONFIG[k]} border shadow-sm`
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300",
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Kebutuhan Pasca Pulang */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionLabel icon={Home} label="Kebutuhan Pasca Pulang" />
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => set("kebutuhanHomecare", !data.kebutuhanHomecare)}
              className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100 active:bg-slate-200"
            >
              <div>
                <p className="text-xs font-semibold text-slate-700">Perlu Home Care</p>
                <p className="text-[11px] text-slate-400">Perawatan oleh nakes di rumah</p>
              </div>
              <Toggle checked={data.kebutuhanHomecare} />
            </button>
            <AnimatePresence initial={false}>
              {data.kebutuhanHomecare && (
                <motion.div
                  key="homecare-options"
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1.5 px-1 py-2">
                    {HOMECARE_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleOption("jenisHomecare", opt)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                          data.jenisHomecare.includes(opt)
                            ? "border-sky-300 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => set("kebutuhanAlatBantu", !data.kebutuhanAlatBantu)}
              className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100 active:bg-slate-200"
            >
              <div>
                <p className="text-xs font-semibold text-slate-700">Perlu Alat Bantu</p>
                <p className="text-[11px] text-slate-400">Peralatan medis / mobilitas</p>
              </div>
              <Toggle checked={data.kebutuhanAlatBantu} />
            </button>
            <AnimatePresence initial={false}>
              {data.kebutuhanAlatBantu && (
                <motion.div
                  key="alatbantu-options"
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1.5 px-1 py-2">
                    {ALAT_BANTU_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleOption("alatBantu", opt)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                          data.alatBantu.includes(opt)
                            ? "border-sky-300 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Skrining Risiko Re-admisi */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionLabel icon={Activity} label="Skrining Risiko Re-admisi" />
          <div className="space-y-3">

            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">Dukungan keluarga / caregiver di rumah</p>
              <div className="flex flex-wrap gap-1.5">
                {DUKUNGAN_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set("dukunganKeluarga", opt)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                      data.dukunganKeluarga === opt
                        ? `${DUKUNGAN_CONFIG[opt].sel} border shadow-sm`
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">Kepatuhan minum obat sebelumnya</p>
              <div className="flex flex-wrap gap-1.5">
                {KEPATUHAN_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set("kepatuhanObatSebelumnya", opt)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                      data.kepatuhanObatSebelumnya === opt
                        ? `${KEPATUHAN_CONFIG[opt].sel} border shadow-sm`
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">Riwayat rawat inap ulang dalam 30 hari terakhir</p>
              <div className="flex flex-wrap gap-1.5">
                {READMISI_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set("riwayatReadmisi", opt)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                      data.riwayatReadmisi === opt
                        ? `${READMISI_CONFIG[opt].sel} border shadow-sm`
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {risiko && (
                <motion.div
                  key="risiko-result"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg border px-3 py-2.5",
                    RISIKO_CONFIG[risiko].bg, RISIKO_CONFIG[risiko].border,
                  )}
                >
                  <div className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full", RISIKO_CONFIG[risiko].dot)} />
                  <div>
                    <p className={cn("text-xs font-bold", RISIKO_CONFIG[risiko].text)}>
                      Risiko Re-admisi: {risiko}
                    </p>
                    <p className={cn("text-[11px]", RISIKO_CONFIG[risiko].text)}>
                      {RISIKO_DESC[risiko]}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <p className="mb-1 text-[11px] font-semibold text-slate-500">Catatan Khusus</p>
              <textarea
                value={data.catatan}
                onChange={e => set("catatan", e.target.value)}
                rows={3}
                placeholder="Kondisi rumah, lingkungan, kendala khusus, catatan nakes..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </div>

          </div>
        </div>

      </div>

      {/* ── Right: Patient Summary ── */}
      <div className="w-full shrink-0 space-y-3 xl:w-72">

        {/* Patient info */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Informasi Pasien</p>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">{patient.name}</p>
              <p className="text-[11px] text-slate-500">
                {patient.gender === "L" ? "Laki-laki" : "Perempuan"} · {patient.age} thn · {patient.noRM}
              </p>
            </div>
          </div>
          <div className="space-y-0">
            {[
              { icon: Stethoscope, label: "Diagnosis", value: patient.diagnosis },
              { icon: Calendar,    label: "MRS",       value: `${patient.tglMasuk} · ${lama} dirawat` },
              { icon: User,        label: "DPJP",      value: patient.dpjp },
              { icon: BedDouble,   label: "Ruangan",   value: `${patient.ruangan} / ${patient.noBed} · ${patient.kelas.replace(/_/g, " ")}` },
              { icon: FileText,    label: "Kunjungan", value: patient.noKunjungan },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5 border-b border-slate-50 py-2 last:border-0">
                <Icon size={11} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="text-xs leading-tight text-slate-700">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kondisi pulang live preview */}
        <AnimatePresence>
          {kondisiCfg && (
            <motion.div
              key="kondisi-preview"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status Pemulangan</p>
              <div className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 ring-1",
                kondisiCfg.badge, kondisiCfg.ring,
              )}>
                <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", kondisiCfg.dot)} />
                <p className="text-sm font-bold">{data.kondisiPulang}</p>
              </div>
              {data.tanggalRencanaKRS && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Calendar size={10} />
                  Rencana KRS: {new Date(data.tanggalRencanaKRS).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Caregiver live preview */}
        <AnimatePresence>
          {data.caregiverNama && (
            <motion.div
              key="caregiver-preview"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Caregiver</p>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <User size={13} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{data.caregiverNama}</p>
                  <p className="text-[11px] text-slate-500">
                    {[data.caregiverHubungan, data.caregiverKemampuan].filter(Boolean).join(" · ") || "Info belum lengkap"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kebutuhan khusus summary */}
        <AnimatePresence>
          {(data.kebutuhanHomecare || data.kebutuhanAlatBantu) && (
            <motion.div
              key="kebutuhan-preview"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl border border-amber-100 bg-amber-50 p-3.5"
            >
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Kebutuhan Khusus</p>
              <div className="space-y-1">
                {data.kebutuhanHomecare && (
                  <p className="text-[11px] text-amber-800">
                    Home Care: {data.jenisHomecare.length > 0 ? data.jenisHomecare.join(", ") : "Jenis belum dipilih"}
                  </p>
                )}
                {data.kebutuhanAlatBantu && (
                  <p className="text-[11px] text-amber-800">
                    Alat Bantu: {data.alatBantu.length > 0 ? data.alatBantu.join(", ") : "Jenis belum dipilih"}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Risiko re-admisi preview */}
        <AnimatePresence>
          {risiko && (
            <motion.div
              key="risiko-preview"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={cn(
                "rounded-xl border p-3.5",
                RISIKO_CONFIG[risiko].bg, RISIKO_CONFIG[risiko].border,
              )}
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Risiko Re-admisi</p>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("h-3 w-3 shrink-0 rounded-full", RISIKO_CONFIG[risiko].dot)} />
                <p className={cn("text-sm font-bold", RISIKO_CONFIG[risiko].text)}>{risiko}</p>
              </div>
              <div className="space-y-1">
                {[
                  { label: "Dukungan", val: data.dukunganKeluarga },
                  { label: "Kepatuhan Obat", val: data.kepatuhanObatSebelumnya },
                  { label: "Readmisi 30hr", val: data.riwayatReadmisi },
                ].filter(r => r.val).map(({ label, val }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500">{label}</span>
                    <span className={cn("text-[10px] font-semibold", RISIKO_CONFIG[risiko].text)}>{val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
