"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Zap, FileText, Heart, Plus, CheckCircle2,
  AlertTriangle, User, BookOpen, ShieldCheck, Activity,
  X, Info, Calendar, Edit3, Stethoscope, Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IGDPatientDetail } from "@/lib/data";
import type { ICConsentResult } from "@/lib/informed-consent/types";
import InformedConsentModal from "@/components/shared/informed-consent/InformedConsentModal";

// ── Shared primitives ─────────────────────────────────────

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
  indigo:  { header: "border-indigo-100 bg-indigo-50/60",  icon: "text-indigo-400",  title: "text-indigo-800"  },
  emerald: { header: "border-emerald-100 bg-emerald-50/60", icon: "text-emerald-500", title: "text-emerald-800" },
  amber:   { header: "border-amber-100 bg-amber-50/60",    icon: "text-amber-500",   title: "text-amber-800"   },
  rose:    { header: "border-rose-100 bg-rose-50/60",      icon: "text-rose-500",    title: "text-rose-800"    },
  sky:     { header: "border-sky-100 bg-sky-50/60",        icon: "text-sky-500",     title: "text-sky-800"     },
  slate:   { header: "border-slate-200 bg-slate-50/60",    icon: "text-slate-400",   title: "text-slate-700"   },
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

function ChipSelect<T extends string>({
  label, options, value, onChange, multi = false, required, activeClass,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | T[];
  onChange: (v: T | T[]) => void;
  multi?: boolean;
  required?: boolean;
  activeClass?: string;
}) {
  const isSelected = (v: T) =>
    multi ? (value as T[]).includes(v) : value === v;

  const toggle = (v: T) => {
    if (multi) {
      const arr = value as T[];
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else {
      onChange(v);
    }
  };

  return (
    <div>
      <Label required={required}>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all",
              isSelected(opt.value)
                ? (activeClass ?? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200")
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 1. PASIEN & KELUARGA
// ─────────────────────────────────────────────────────────

const TOPIK_EDUKASI = [
  "Diagnosis & Kondisi Saat Ini",
  "Rencana Pengobatan / Terapi",
  "Efek Samping Obat",
  "Prosedur / Tindakan Medis",
  "Diet & Nutrisi",
  "Aktivitas & Mobilisasi",
  "Perawatan Luka / Stoma",
  "Kontrol Ulang / Follow-up",
  "Pencegahan Infeksi & PHBS",
  "Kebersihan & Perawatan Diri",
  "Penggunaan Alat Bantu",
  "Hak & Kewajiban Pasien",
];

const MEDIA_EDUKASI = [
  "Verbal / Lisan",
  "Leaflet / Brosur",
  "Booklet",
  "Demonstrasi Langsung",
  "Video Edukasi",
  "Poster / Gambar",
  "Aplikasi Digital",
];

const METODE_EDUKASI = [
  "Ceramah",
  "Diskusi Dua Arah",
  "Demonstrasi",
  "Simulasi / Roleplay",
  "Tanya Jawab",
];

const HAMBATAN_KOMUNIKASI = [
  "Tidak Ada",
  "Bahasa / Komunikasi",
  "Gangguan Pendengaran",
  "Gangguan Penglihatan",
  "Gangguan Kognitif",
  "Emosional / Psikologis",
  "Fisik / Kelemahan Umum",
  "Tingkat Pendidikan",
];

type Pemahaman = "paham" | "perlu_ulang" | "tidak_paham";

interface EduPKEntry {
  id: string;
  waktu: string;
  penerima: string;
  topik: string[];
  media: string[];
  metode: string;
  hambatan: string[];
  pemahaman: Pemahaman;
  petugas: string;
  catatan: string;
}

const PEMAHAMAN_CFG: Record<Pemahaman, { label: string; active: string; badge: string }> = {
  paham:       { label: "Paham / Mengerti",       active: "border-emerald-400 bg-emerald-50 text-emerald-700", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  perlu_ulang: { label: "Perlu Pengulangan",       active: "border-amber-400 bg-amber-50 text-amber-700",       badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"       },
  tidak_paham: { label: "Tidak / Belum Paham",     active: "border-rose-400 bg-rose-50 text-rose-700",          badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200"           },
};

function PasienKeluargaPane() {
  const [entries, setEntries] = useState<EduPKEntry[]>([]);
  const [form, setForm] = useState({
    penerima:          "Pasien" as "Pasien" | "Keluarga" | "Wali",
    namaPenerima:      "",
    hubungan:          "",
    topik:             [] as string[],
    media:             [] as string[],
    metode:            "",
    hambatan:          [] as string[],
    catatanHambatan:   "",
    pemahaman:         "" as Pemahaman | "",
    rencanaTindakLanjut: "",
    petugas:           "",
    tanggal:           new Date().toISOString().split("T")[0],
    waktu:             new Date().toTimeString().slice(0, 5),
    catatan:           "",
  });
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const canAdd = form.topik.length > 0 && form.pemahaman !== "" && form.petugas.trim() !== "";

  const handleAdd = () => {
    if (!canAdd) return;
    const penerimaTeks =
      form.penerima === "Pasien"
        ? "Pasien"
        : `${form.penerima}: ${form.namaPenerima}${form.hubungan ? ` (${form.hubungan})` : ""}`;
    setEntries((p) => [
      {
        id: `pk-${Date.now()}`,
        waktu: `${form.tanggal} ${form.waktu}`,
        penerima: penerimaTeks,
        topik: form.topik,
        media: form.media,
        metode: form.metode,
        hambatan: form.hambatan,
        pemahaman: form.pemahaman as Pemahaman,
        petugas: form.petugas,
        catatan: form.catatan,
      },
      ...p,
    ]);
    setForm((p) => ({
      ...p,
      topik: [], media: [], metode: "", hambatan: [],
      pemahaman: "", petugas: "", catatan: "", rencanaTindakLanjut: "",
    }));
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* ── Form ── */}
      <div className="flex flex-col gap-3 lg:flex-1 lg:min-w-0">

        <Block title="Identitas Penerima Edukasi" icon={User} accent="indigo">
          <div>
            <Label required>Penerima Edukasi</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["Pasien", "Keluarga", "Wali"] as const).map((p) => (
                <button
                  key={p} type="button"
                  onClick={() => setF("penerima", p)}
                  className={cn(
                    "rounded-lg border py-2 text-xs font-semibold transition",
                    form.penerima === p
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {form.penerima !== "Pasien" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <TI label="Nama Penerima" required value={form.namaPenerima}
                onChange={(v) => setF("namaPenerima", v)} placeholder="Nama lengkap..." />
              <TI label="Hubungan dengan Pasien" value={form.hubungan}
                onChange={(v) => setF("hubungan", v)} placeholder="Suami / Istri / Anak / Orang Tua..." />
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <TI label="Tanggal" type="date" value={form.tanggal} onChange={(v) => setF("tanggal", v)} />
            <TI label="Waktu" type="time" value={form.waktu} onChange={(v) => setF("waktu", v)} />
          </div>
        </Block>

        <Block title="Materi & Metode Edukasi" icon={BookOpen} accent="sky">
          <ChipSelect
            label="Topik Edukasi" required
            options={TOPIK_EDUKASI.map((t) => ({ value: t, label: t }))}
            value={form.topik} onChange={(v) => setF("topik", v as string[])} multi
            activeClass="border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200"
          />
          <ChipSelect
            label="Media yang Digunakan"
            options={MEDIA_EDUKASI.map((m) => ({ value: m, label: m }))}
            value={form.media} onChange={(v) => setF("media", v as string[])} multi
            activeClass="border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200"
          />
          <ChipSelect
            label="Metode Penyampaian"
            options={METODE_EDUKASI.map((m) => ({ value: m, label: m }))}
            value={form.metode} onChange={(v) => setF("metode", v as string)}
          />
          <ChipSelect
            label="Hambatan Komunikasi"
            options={HAMBATAN_KOMUNIKASI.map((h) => ({ value: h, label: h }))}
            value={form.hambatan} onChange={(v) => setF("hambatan", v as string[])} multi
            activeClass="border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-200"
          />
          {form.hambatan.length > 0 && !form.hambatan.includes("Tidak Ada") && (
            <TA label="Keterangan Hambatan" rows={2} value={form.catatanHambatan}
              onChange={(v) => setF("catatanHambatan", v)}
              placeholder="Jelaskan hambatan yang ditemukan dan solusi yang dilakukan..." />
          )}
        </Block>

        <Block title="Evaluasi Pemahaman" icon={CheckCircle2} accent="emerald">
          <div>
            <Label required>Tingkat Pemahaman Setelah Edukasi</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["paham", "perlu_ulang", "tidak_paham"] as Pemahaman[]).map((val) => {
                const cfg = PEMAHAMAN_CFG[val];
                return (
                  <button
                    key={val} type="button"
                    onClick={() => setF("pemahaman", val)}
                    className={cn(
                      "rounded-lg border px-2 py-2.5 text-center text-[11px] font-semibold leading-tight transition",
                      form.pemahaman === val ? cfg.active : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                    )}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          {(form.pemahaman === "perlu_ulang" || form.pemahaman === "tidak_paham") && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                <AlertTriangle size={11} />
                Rencana Re-edukasi Diperlukan
              </p>
              <TA label="Rencana Tindak Lanjut" rows={2} value={form.rencanaTindakLanjut}
                onChange={(v) => setF("rencanaTindakLanjut", v)}
                placeholder="Jadwal pengulangan, media alternatif, konsultasi..." />
            </div>
          )}
          <TA label="Catatan Tambahan" rows={2} value={form.catatan}
            onChange={(v) => setF("catatan", v)}
            placeholder="Respon pasien/keluarga, kondisi khusus, catatan penting..." />
        </Block>

        <Block title="Petugas Pelaksana" accent="slate">
          <TI label="Nama Petugas / Edukator" required value={form.petugas}
            onChange={(v) => setF("petugas", v)} placeholder="Nama lengkap + gelar..." />
          <button
            type="button" onClick={handleAdd} disabled={!canAdd}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={13} />
            Simpan Catatan Edukasi
          </button>
        </Block>
      </div>

      {/* ── History ── */}
      <div className="flex flex-col gap-3 lg:w-80 lg:shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-700">
            Riwayat Edukasi
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {entries.length}
            </span>
          </p>
        </div>
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center shadow-sm">
            <BookOpen size={20} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-400">Belum ada catatan edukasi</p>
            <p className="text-[10px] text-slate-300">Isi form dan simpan untuk mulai</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {entries.map((e) => {
                const cfg = PEMAHAMAN_CFG[e.pemahaman];
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold text-slate-400">{e.waktu}</span>
                      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", cfg.badge)}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] font-semibold text-slate-700">{e.penerima}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {e.topik.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-600">{t}</span>
                      ))}
                      {e.topik.length > 3 && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">+{e.topik.length - 3} lainnya</span>
                      )}
                    </div>
                    {e.catatan && <p className="mt-1.5 text-[11px] italic text-slate-400 leading-relaxed">{e.catatan}</p>}
                    <p className="mt-2 text-[10px] text-slate-400">{e.petugas}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 2. EMERGENCY
// ─────────────────────────────────────────────────────────

const TANDA_BAHAYA = [
  "Nyeri Dada / Sesak Nafas",
  "Penurunan Kesadaran / Pingsan",
  "Perdarahan Tidak Terkontrol",
  "Demam Tinggi (> 38.5°C)",
  "Mual / Muntah Persisten",
  "Kejang",
  "Kulit Pucat / Sianosis",
  "Luka Tidak Sembuh / Infeksi",
  "Nyeri Tidak Tertahankan",
  "Sesak saat Istirahat",
  "Bengkak Mendadak",
  "Pusing / Kehilangan Keseimbangan",
];

const TIPE_INSTRUKSI = [
  "Instruksi Discharge",
  "Follow-up / Kontrol",
  "Emergency Response",
  "Edukasi Pra-Tindakan",
  "Tindak Lanjut Rawat Inap",
];

interface EmergencyEntry {
  id: string;
  waktu: string;
  tipe: string;
  instruksi: string;
  tandaBahaya: string[];
  followUpDate: string;
  kontakEmergency: string;
  petugas: string;
}

function EmergencyPane() {
  const [entries, setEntries] = useState<EmergencyEntry[]>([]);
  const [form, setForm] = useState({
    tipe:             "Instruksi Discharge",
    instruksi:        "",
    instruksiObat:    "",
    diet:             "",
    aktivitas:        "",
    tandaBahaya:      [] as string[],
    followUpDate:     "",
    followUpLokasi:   "",
    kontakEmergency:  "",
    catatan:          "",
    petugas:          "",
  });
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!form.instruksi.trim() || !form.petugas.trim()) return;
    setEntries((p) => [
      {
        id: `em-${Date.now()}`,
        waktu: new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }),
        tipe: form.tipe,
        instruksi: form.instruksi,
        tandaBahaya: form.tandaBahaya,
        followUpDate: form.followUpDate,
        kontakEmergency: form.kontakEmergency,
        petugas: form.petugas,
      },
      ...p,
    ]);
    setForm((p) => ({
      ...p, instruksi: "", instruksiObat: "", diet: "", aktivitas: "",
      tandaBahaya: [], followUpDate: "", followUpLokasi: "", kontakEmergency: "", catatan: "", petugas: "",
    }));
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-3 lg:flex-1 lg:min-w-0">

        <Block title="Tipe Instruksi" icon={Zap} accent="amber">
          <div>
            <Label required>Jenis Instruksi</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TIPE_INSTRUKSI.map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => setF("tipe", t)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-center text-[11px] font-medium leading-tight transition",
                    form.tipe === t
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </Block>

        <Block title="Instruksi Utama" icon={Edit3} accent="indigo">
          <TA label="Instruksi untuk Pasien / Keluarga" required rows={3} value={form.instruksi}
            onChange={(v) => setF("instruksi", v)}
            placeholder="Tuliskan instruksi lengkap dan jelas untuk pasien/keluarga di rumah..." />
          <div className="grid gap-2 sm:grid-cols-2">
            <TA label="Instruksi Obat" rows={3} value={form.instruksiObat}
              onChange={(v) => setF("instruksiObat", v)}
              placeholder={"Nama obat, dosis, waktu minum\nContoh: Amlodipin 5 mg — 1x sehari pagi"} />
            <TA label="Diet & Nutrisi" rows={3} value={form.diet}
              onChange={(v) => setF("diet", v)}
              placeholder="Pantangan makanan, diet khusus, asupan cairan..." />
          </div>
          <TA label="Aktivitas & Mobilisasi" rows={2} value={form.aktivitas}
            onChange={(v) => setF("aktivitas", v)}
            placeholder="Batasan aktivitas, istirahat yang dianjurkan, olahraga..." />
        </Block>

        <Block title="Tanda Bahaya — Kapan Harus Segera ke IGD" icon={AlertTriangle} accent="rose">
          <p className="text-[11px] leading-relaxed text-slate-500">
            Pilih kondisi yang mengharuskan pasien <strong className="text-rose-700">segera kembali ke IGD</strong> atau menghubungi layanan darurat:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TANDA_BAHAYA.map((opt) => {
              const sel = form.tandaBahaya.includes(opt);
              return (
                <button
                  key={opt} type="button"
                  onClick={() => setF("tandaBahaya", sel ? form.tandaBahaya.filter((x) => x !== opt) : [...form.tandaBahaya, opt])}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                    sel
                      ? "border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      : "border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600",
                  )}
                >
                  {sel && <X size={9} />}
                  {opt}
                </button>
              );
            })}
          </div>
        </Block>

        <Block title="Follow-up & Kontak Darurat" icon={Calendar} accent="sky">
          <div className="grid gap-2 sm:grid-cols-2">
            <TI label="Tanggal Kontrol Berikutnya" type="date"
              value={form.followUpDate} onChange={(v) => setF("followUpDate", v)} />
            <TI label="Lokasi / Poli Tujuan Kontrol" value={form.followUpLokasi}
              onChange={(v) => setF("followUpLokasi", v)} placeholder="Poli Jantung, IGD, Puskesmas..." />
          </div>
          <TI label="Kontak Darurat / Hotline RS" value={form.kontakEmergency}
            onChange={(v) => setF("kontakEmergency", v)} placeholder="Nomor IGD, hotline, nomor dokter..." />
        </Block>

        <Block title="Petugas" accent="slate">
          <TI label="Nama Petugas" required value={form.petugas}
            onChange={(v) => setF("petugas", v)} placeholder="Nama lengkap + gelar..." />
          <button
            type="button" onClick={handleAdd}
            disabled={!form.instruksi.trim() || !form.petugas.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={13} />
            Simpan Instruksi Emergency
          </button>
        </Block>
      </div>

      {/* History */}
      <div className="flex flex-col gap-3 lg:w-80 lg:shrink-0">
        <p className="text-xs font-semibold text-slate-700">
          Riwayat Instruksi
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{entries.length}</span>
        </p>
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center shadow-sm">
            <Zap size={20} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-400">Belum ada instruksi</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{e.tipe}</span>
                  <span className="font-mono text-[10px] text-slate-400">{e.waktu}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-700 line-clamp-3">{e.instruksi}</p>
                {e.tandaBahaya.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {e.tandaBahaya.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-600">{t}</span>
                    ))}
                    {e.tandaBahaya.length > 2 && (
                      <span className="text-[10px] text-slate-400">+{e.tandaBahaya.length - 2} lainnya</span>
                    )}
                  </div>
                )}
                <p className="mt-2 text-[10px] text-slate-400">{e.petugas}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 3. INFORMED CONSENT
// ─────────────────────────────────────────────────────────

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

function InformedConsentPane({ patient }: { patient: IGDPatientDetail }) {
  const [showICModal,  setShowICModal]  = useState(false);
  const [icResult,     setIcResult]     = useState<ICConsentResult | null>(null);
  const [records, setRecords] = useState<ConsentRecord[]>([]);
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
                {/* Setuju */}
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
                {/* Menolak */}
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

              {/* Tanda Tangan Pasien/Wali — IC Modal trigger */}
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

              {/* Tanda Tangan Dokter/DPJP — tetap statis */}
              <div className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-2 py-5 text-center">
                <Edit3 size={14} className="text-slate-300" />
                <p className="text-[10px] font-semibold text-slate-400">Tanda Tangan Dokter/DPJP</p>
                <p className="text-[10px] font-medium text-slate-500">{form.namaDokter || "—"}</p>
              </div>
            </div>

            {/* IC Modal */}
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

          {/* Saved records */}
          {records.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Tersimpan</p>
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
                    <p className={cn("text-[11px] font-semibold truncate", r.keputusan === "setuju" ? "text-emerald-800" : "text-rose-800")}>
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

// ─────────────────────────────────────────────────────────
// 4. END OF LIFE
// ─────────────────────────────────────────────────────────

type CodeStatus = "full_code" | "dnr" | "dnar" | "comfort_only";

const CODE_STATUS: {
  value: CodeStatus; label: string; sub: string; desc: string;
  border: string; active: string; labelColor: string;
}[] = [
  {
    value: "full_code",
    label: "Full Code",
    sub: "Resusitasi Penuh",
    desc: "Semua tindakan life-saving dilakukan termasuk CPR, intubasi, dan defibrilasi.",
    border: "border-emerald-200",
    active: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200",
    labelColor: "text-emerald-700",
  },
  {
    value: "dnr",
    label: "DNR",
    sub: "Do Not Resuscitate",
    desc: "CPR dan tindakan resusitasi tidak dilakukan. Tindakan kenyamanan tetap diberikan.",
    border: "border-rose-200",
    active: "border-rose-500 bg-rose-50 ring-2 ring-rose-200",
    labelColor: "text-rose-700",
  },
  {
    value: "dnar",
    label: "DNAR",
    sub: "Do Not Attempt Resuscitation",
    desc: "Tidak ada upaya resusitasi. Berbeda dengan DNR dalam aspek komunikasi klinis.",
    border: "border-rose-200",
    active: "border-rose-500 bg-rose-50 ring-2 ring-rose-200",
    labelColor: "text-rose-700",
  },
  {
    value: "comfort_only",
    label: "Comfort Care",
    sub: "Perawatan Paliatif Penuh",
    desc: "Fokus eksklusif pada kenyamanan, pengendalian gejala, dan kualitas hidup.",
    border: "border-sky-200",
    active: "border-sky-500 bg-sky-50 ring-2 ring-sky-200",
    labelColor: "text-sky-700",
  },
];

const TERAPI_OPTIONS = [
  "CPR / Resusitasi Jantung Paru",
  "Ventilasi Mekanik / Intubasi",
  "Defibrilasi / Kardioversi",
  "Infus / Cairan Intravena",
  "Nutrisi Parenteral / NGT",
  "Hemodialisis / CRRT",
  "Transfusi Darah / Produk Darah",
  "Antibiotik Intravena",
  "Kemoterapi / Radioterapi",
  "Operasi / Tindakan Invasif",
];

interface FamilyMeeting {
  id: string;
  tanggal: string;
  peserta: string;
  topik: string;
  keputusan: string;
}

function EndOfLifePane() {
  const [codeStatus, setCodeStatus] = useState<CodeStatus | "">("");
  const [form, setForm] = useState({
    alasanKode:           "",
    pengambilKeputusan:   "Pasien Sendiri",
    namaWali:             "",
    hubunganWali:         "",
    kontakWali:           "",
    advanceDirective:     false,
    terapiDiinginkan:     [] as string[],
    terapiDitolak:        [] as string[],
    tujuanPerawatan:      "",
    gejalaDitangani:      "",
    kebutuhanSpiritual:   "",
    petugasPaliatif:      "",
    tanggalDNR:           "",
    dokterDNR:            "",
    catatanDNR:           "",
  });
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const [meetings, setMeetings] = useState<FamilyMeeting[]>([]);
  const [mForm, setMForm] = useState({ tanggal: new Date().toISOString().split("T")[0], peserta: "", topik: "", keputusan: "" });
  const setMF = <K extends keyof typeof mForm>(k: K, v: string) =>
    setMForm((p) => ({ ...p, [k]: v }));

  const addMeeting = () => {
    if (!mForm.peserta.trim() || !mForm.topik.trim()) return;
    setMeetings((p) => [{ id: `fm-${Date.now()}`, ...mForm }, ...p]);
    setMForm({ tanggal: new Date().toISOString().split("T")[0], peserta: "", topik: "", keputusan: "" });
  };

  const isDNR     = codeStatus === "dnr" || codeStatus === "dnar";
  const isComfort = codeStatus === "comfort_only";
  const needsPalliative = isDNR || isComfort;

  return (
    <div className="flex flex-col gap-4">

      {/* Sensitive care banner */}
      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100">
          <Heart size={14} className="text-rose-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-rose-800">Perencanaan Perawatan Lanjutan (Advance Care Planning)</p>
          <p className="text-[11px] leading-relaxed text-rose-600">
            Dokumentasi ini harus diisi bersama tim medis senior, pasien, dan/atau keluarga.
            Setiap keputusan memerlukan persetujuan dan tanda tangan dari pihak berwenang.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">

        {/* Left: 3 cols */}
        <div className="flex flex-col gap-3 lg:col-span-3">

          <Block title="Status Kode Resusitasi" icon={Activity} accent="rose">
            <div className="grid grid-cols-2 gap-2">
              {CODE_STATUS.map((opt) => {
                const isActive = codeStatus === opt.value;
                return (
                  <button
                    key={opt.value} type="button"
                    onClick={() => setCodeStatus(opt.value)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      isActive ? opt.active : cn("bg-white hover:bg-slate-50", opt.border),
                    )}
                  >
                    <p className={cn("text-xs font-bold", isActive ? opt.labelColor : "text-slate-700")}>
                      {opt.label}
                    </p>
                    <p className={cn("text-[10px] font-medium mt-0.5", isActive ? opt.labelColor : "text-slate-500")}>
                      {opt.sub}
                    </p>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
            {codeStatus && (
              <TA label="Alasan / Dasar Keputusan Medis" rows={2} value={form.alasanKode}
                onChange={(v) => setF("alasanKode", v)}
                placeholder="Kondisi klinis, prognosis, pertimbangan etis dan medis..." />
            )}
          </Block>

          {/* DNR Detail */}
          <AnimatePresence>
            {isDNR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Block title="Detail Order DNR / DNAR" icon={AlertTriangle} accent="rose">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <TI label="Tanggal Berlaku Order" type="date" value={form.tanggalDNR}
                      onChange={(v) => setF("tanggalDNR", v)} />
                    <TI label="Dokter Penulis Order" value={form.dokterDNR}
                      onChange={(v) => setF("dokterDNR", v)} placeholder="dr. Nama, Sp.XX..." />
                  </div>
                  <TA label="Catatan Klinis Order DNR" rows={2} value={form.catatanDNR}
                    onChange={(v) => setF("catatanDNR", v)}
                    placeholder="Kondisi pemicu, pertimbangan klinis, persetujuan keluarga..." />
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] leading-relaxed text-rose-700">
                    <strong>Tindakan yang TIDAK dilakukan:</strong> RJP, kompresi dada, intubasi, defibrilasi.
                    <br />Tindakan kenyamanan, analgesia, dan oksigen tetap dapat diberikan sesuai indikasi.
                  </div>
                </Block>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terapi preferences */}
          <Block title="Preferensi Terapi Medis" icon={Stethoscope} accent="indigo">
            <p className="text-[11px] text-slate-500">
              Tandai sesuai keputusan bersama pasien/keluarga dan tim medis:
            </p>

            <div>
              <Label>Terapi yang <span className="font-bold text-emerald-600">DISETUJUI / DILANJUTKAN</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {TERAPI_OPTIONS.map((opt) => {
                  const sel = form.terapiDiinginkan.includes(opt);
                  return (
                    <button
                      key={opt} type="button"
                      onClick={() => setF("terapiDiinginkan", sel ? form.terapiDiinginkan.filter((x) => x !== opt) : [...form.terapiDiinginkan, opt])}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                        sel
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50",
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Terapi yang <span className="font-bold text-rose-600">DITOLAK / DIHENTIKAN</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {TERAPI_OPTIONS.map((opt) => {
                  const sel = form.terapiDitolak.includes(opt);
                  return (
                    <button
                      key={opt} type="button"
                      onClick={() => setF("terapiDitolak", sel ? form.terapiDitolak.filter((x) => x !== opt) : [...form.terapiDitolak, opt])}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                        sel
                          ? "border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                          : "border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:bg-rose-50",
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </Block>

          {/* Palliative care */}
          <AnimatePresence>
            {needsPalliative && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Block title="Rencana Perawatan Paliatif" icon={Heart} accent="sky">
                  <TA label="Tujuan Perawatan Saat Ini" rows={2} value={form.tujuanPerawatan}
                    onChange={(v) => setF("tujuanPerawatan", v)}
                    placeholder="Kenyamanan, pengendalian nyeri, quality of life, meninggal dengan damai..." />
                  <TA label="Gejala yang Dikelola" rows={2} value={form.gejalaDitangani}
                    onChange={(v) => setF("gejalaDitangani", v)}
                    placeholder="Nyeri, sesak nafas, mual, kecemasan, delirium..." />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <TI label="Kebutuhan Spiritual / Agama" value={form.kebutuhanSpiritual}
                      onChange={(v) => setF("kebutuhanSpiritual", v)}
                      placeholder="Islam, Kristen, Hindu, Bimroh..." />
                    <TI label="Tim Paliatif / Konsultan" value={form.petugasPaliatif}
                      onChange={(v) => setF("petugasPaliatif", v)}
                      placeholder="Nama tim / RS paliatif rujukan..." />
                  </div>
                </Block>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: 2 cols */}
        <div className="flex flex-col gap-3 lg:col-span-2">

          <Block title="Pengambil Keputusan / Wali Medis" icon={Users} accent="indigo">
            <div>
              <Label>Keputusan Dibuat Oleh</Label>
              <div className="flex flex-col gap-1.5">
                {["Pasien Sendiri", "Keluarga / Wali Sah", "Komite Etik RS"].map((p) => (
                  <button
                    key={p} type="button"
                    onClick={() => setF("pengambilKeputusan", p)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition",
                      form.pengambilKeputusan === p
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                    )}
                  >
                    <span className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      form.pengambilKeputusan === p ? "bg-indigo-500" : "bg-slate-300",
                    )} />
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {form.pengambilKeputusan !== "Pasien Sendiri" && (
              <div className="flex flex-col gap-2">
                <TI label="Nama Wali / Keluarga" value={form.namaWali}
                  onChange={(v) => setF("namaWali", v)} placeholder="Nama lengkap..." />
                <TI label="Hubungan dengan Pasien" value={form.hubunganWali}
                  onChange={(v) => setF("hubunganWali", v)} placeholder="Anak, Suami, Istri, Saudara..." />
                <TI label="No. Telepon" value={form.kontakWali}
                  onChange={(v) => setF("kontakWali", v)} placeholder="+62..." />
              </div>
            )}
          </Block>

          <Block title="Advance Directive / Wasiat Hidup" icon={FileText} accent="slate">
            <button
              type="button"
              onClick={() => setF("advanceDirective", !form.advanceDirective)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
                form.advanceDirective
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              <div className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                form.advanceDirective ? "bg-indigo-500" : "bg-slate-200",
              )}>
                <span className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                  form.advanceDirective ? "translate-x-4" : "translate-x-0.5",
                )} />
              </div>
              <div>
                <p className={cn("text-xs font-semibold", form.advanceDirective ? "text-indigo-800" : "text-slate-600")}>
                  Pasien Memiliki Advance Directive
                </p>
                <p className={cn("text-[10px]", form.advanceDirective ? "text-indigo-600" : "text-slate-400")}>
                  Dokumen wasiat hidup / instruksi medis sebelumnya telah dibuat
                </p>
              </div>
            </button>
            {form.advanceDirective && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-[11px] leading-relaxed text-indigo-700">
                Lampirkan dokumen advance directive asli. Pastikan tanggal pembuatan valid dan tanda tangan disaksikan.
              </div>
            )}
          </Block>

          {/* Family Meeting Log */}
          <Block title="Log Pertemuan Keluarga" icon={Users} accent="sky">
            <div className="flex flex-col gap-2">
              <TI label="Tanggal" type="date" value={mForm.tanggal} onChange={(v) => setMF("tanggal", v)} />
              <TI label="Peserta Hadir" value={mForm.peserta}
                onChange={(v) => setMF("peserta", v)}
                placeholder="dr. Nama, Ny. Wali, Tim Paliatif..." />
              <TI label="Topik Utama yang Dibahas" value={mForm.topik}
                onChange={(v) => setMF("topik", v)}
                placeholder="Prognosis, rencana perawatan, DNR..." />
              <TA label="Keputusan / Kesimpulan" rows={2} value={mForm.keputusan}
                onChange={(v) => setMF("keputusan", v)}
                placeholder="Keputusan bersama yang dicapai dalam pertemuan..." />
              <button
                type="button" onClick={addMeeting}
                disabled={!mForm.peserta.trim() || !mForm.topik.trim()}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 py-2 text-[11px] font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-40"
              >
                <Plus size={11} />
                Tambah Catatan Pertemuan
              </button>
            </div>

            {meetings.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                {meetings.map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-semibold text-slate-400">{m.tanggal}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-slate-700">{m.topik}</p>
                    <p className="text-[10px] text-slate-400">{m.peserta}</p>
                    {m.keputusan && <p className="mt-1 text-[11px] italic text-slate-500">{m.keputusan}</p>}
                  </div>
                ))}
              </div>
            )}
          </Block>

          {/* Save */}
          <button
            type="button"
            disabled={!codeStatus}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40",
              needsPalliative ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700",
            )}
          >
            <CheckCircle2 size={13} />
            Simpan Rencana Perawatan Lanjutan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────

const EDU_TABS = [
  { key: "pk",        label: "Pasien & Keluarga", icon: Users,    accent: "indigo" },
  { key: "emergency", label: "Emergency",          icon: Zap,      accent: "amber"  },
  { key: "consent",   label: "Informed Consent",   icon: FileText, accent: "sky"    },
  { key: "eol",       label: "End of Life",        icon: Heart,    accent: "rose"   },
] as const;

type EduTabKey = typeof EDU_TABS[number]["key"];

const ACTIVE_STYLES: Record<string, string> = {
  indigo: "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80",
  amber:  "bg-white text-amber-700 shadow-sm ring-1 ring-slate-200/80",
  sky:    "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/80",
  rose:   "bg-white text-rose-700 shadow-sm ring-1 ring-slate-200/80",
};

export default function EdukasiPane({ patient }: { patient: IGDPatientDetail }) {
  const [active, setActive] = useState<EduTabKey>("pk");

  return (
    <div className="flex flex-col gap-3">
      {/* Sub-tab nav */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60 p-1">
        {EDU_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
                isActive ? ACTIVE_STYLES[tab.accent] : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content with fade transition */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.15 }}
        >
          {active === "pk"        && <PasienKeluargaPane />}
          {active === "emergency" && <EmergencyPane />}
          {active === "consent"   && <InformedConsentPane patient={patient} />}
          {active === "eol"       && <EndOfLifePane />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
