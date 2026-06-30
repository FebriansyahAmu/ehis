"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, FileText, Check, Loader2, AlertTriangle, User,
} from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  type AnamnesisRIData, type SosialData, type SpiritualData,
  ASESMEN_AWAL_MOCK,
} from "./asesmenAwalShared";
import AnamnesisSebelumnya from "@/components/shared/medical-records/AnamnesisSebelumnya";
import AnamnesisTemplatePicker, { type AnamnesisTemplateDTO } from "@/components/shared/medical-records/AnamnesisTemplatePicker";
import { getAnamnesis, saveAnamnesis } from "@/lib/api/asesmenMedis/anamnesis";
import type { SumberAnamnesis, AnamnesisInput } from "@/lib/schemas/asesmenMedis/anamnesis";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";

// id kunjungan DB = UUID; id demo/seed ("ri-1") → tak tersimpan ke DB.
const ANAMNESIS_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUMBER_OPTS: SumberAnamnesis[] = ["Pasien", "Keluarga", "Pengantar", "Rekam Medis"];

// ── Primitives ────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

function TA({ label, value, onChange, placeholder, rows = 2, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
    </div>
  );
}

const INPUT_CLS = "h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-50";
const SEL_CLS   = INPUT_CLS;

function Block({ title, badge, children }: { title?: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          {badge && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">{badge}</span>}
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

// ── Sosial & Spiritual section (collapsible) ──────────────

const HAMBATAN_KOMUNIKASI = [
  "Bahasa Berbeda", "Gangguan Pendengaran", "Gangguan Bicara",
  "Buta Huruf", "Gangguan Kognitif", "Tidak Ada Hambatan",
];

function SosialSpiritualAccordion({
  sosial, onSosialChange, spiritual, onSpiritualChange,
}: {
  sosial: SosialData; onSosialChange: (v: SosialData) => void;
  spiritual: SpiritualData; onSpiritualChange: (v: SpiritualData) => void;
}) {
  const [open, setOpen] = useState(false);

  const setSos = <K extends keyof SosialData>(k: K, v: SosialData[K]) =>
    onSosialChange({ ...sosial, [k]: v });
  const setSpi = <K extends keyof SpiritualData>(k: K, v: SpiritualData[K]) =>
    onSpiritualChange({ ...spiritual, [k]: v });

  const toggleHambatan = (h: string) =>
    setSos("hambatanKomunikasi", sosial.hambatanKomunikasi.includes(h)
      ? sosial.hambatanKomunikasi.filter(x => x !== h)
      : [...sosial.hambatanKomunikasi, h]);

  const isSosDone = sosial.pekerjaan !== "" || sosial.dukunganKeluarga !== "";
  const isSpiDone = spiritual.agama !== "";

  return (
    <div className="rounded-xl border border-sky-100 bg-sky-50/40">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100">
          <FileText size={13} className="text-sky-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-sky-800">Asesmen Psikososial & Spiritual</p>
          <p className="text-[11px] text-sky-600">SNARS AP 1.1 — HPK 1.1 · Opsional — lengkapi bila relevan</p>
        </div>
        <div className="flex items-center gap-2">
          {(isSosDone || isSpiDone) && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <Check size={9} /> Terisi
            </span>
          )}
          {open ? <ChevronUp size={15} className="text-sky-500" /> : <ChevronDown size={15} className="text-sky-500" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-sky-100 px-4 pb-4 pt-3">
              <div className="grid gap-4 md:grid-cols-2">

                {/* Sosial */}
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Kondisi Sosial</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Pekerjaan</Label><input value={sosial.pekerjaan} onChange={e => setSos("pekerjaan", e.target.value)} placeholder="Wiraswasta, PNS..." className={INPUT_CLS} /></div>
                    <div><Label>Pendidikan Terakhir</Label><input value={sosial.pendidikan} onChange={e => setSos("pendidikan", e.target.value)} placeholder="S1, SMA..." className={INPUT_CLS} /></div>
                    <div><Label>Status Pernikahan</Label>
                      <select value={sosial.statusPernikahan} onChange={e => setSos("statusPernikahan", e.target.value)} className={SEL_CLS}>
                        <option value="">— Pilih —</option>
                        {["Belum Menikah", "Menikah", "Janda / Duda", "Cerai"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div><Label>Tinggal Bersama</Label><input value={sosial.tinggalBersama} onChange={e => setSos("tinggalBersama", e.target.value)} placeholder="Keluarga, sendiri..." className={INPUT_CLS} /></div>
                  </div>
                  <div>
                    <Label>Dukungan Keluarga</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["Kuat", "Cukup", "Lemah", "Tidak Ada"] as SosialData["dukunganKeluarga"][]).filter(Boolean).map(v => (
                        <button key={v} type="button" onClick={() => setSos("dukunganKeluarga", v)}
                          className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                            sosial.dukunganKeluarga === v
                              ? v === "Kuat" ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : v === "Cukup" ? "border-sky-400 bg-sky-50 text-sky-700"
                                : v === "Lemah" ? "border-amber-400 bg-amber-50 text-amber-700"
                                : "border-rose-400 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Kondisi Ekonomi</Label>
                    <div className="flex gap-2">
                      {(["Mampu", "Cukup", "Kurang"] as SosialData["kondisiEkonomi"][]).filter(Boolean).map(v => (
                        <button key={v} type="button" onClick={() => setSos("kondisiEkonomi", v)}
                          className={cn("flex-1 rounded-lg border py-1.5 text-xs font-semibold transition",
                            sosial.kondisiEkonomi === v ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Hambatan Komunikasi</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {HAMBATAN_KOMUNIKASI.map(h => {
                        const sel = sosial.hambatanKomunikasi.includes(h);
                        return (
                          <button key={h} type="button" onClick={() => toggleHambatan(h)}
                            className={cn("rounded-md border px-2.5 py-1 text-xs font-medium transition",
                              sel ? "border-sky-300 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-500 hover:bg-sky-50/40")}>
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label>Catatan Sosial</Label>
                    <textarea rows={2} value={sosial.catatanSosial} onChange={e => setSos("catatanSosial", e.target.value)}
                      placeholder="Kondisi rumah, akses pelayanan, dll..."
                      className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
                  </div>
                </div>

                {/* Spiritual */}
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Kebutuhan Spiritual</p>
                  <div>
                    <Label>Agama / Kepercayaan</Label>
                    <select value={spiritual.agama} onChange={e => setSpi("agama", e.target.value)} className={SEL_CLS}>
                      <option value="">— Pilih —</option>
                      {["Islam", "Kristen Protestan", "Katolik", "Hindu", "Buddha", "Konghucu", "Kepercayaan Lain"].map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Memiliki Kebutuhan Spiritual / Religius?</Label>
                    <div className="flex gap-2">
                      {([true, false] as const).map(v => (
                        <button key={String(v)} type="button" onClick={() => setSpi("kebutuhanSpiritual", v)}
                          className={cn("flex-1 rounded-lg border py-1.5 text-xs font-semibold transition",
                            spiritual.kebutuhanSpiritual === v
                              ? v ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-400 bg-slate-100 text-slate-700"
                              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                          {v ? "Ya" : "Tidak"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <AnimatePresence>
                    {spiritual.kebutuhanSpiritual && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                        <div>
                          <Label>Detail Kebutuhan</Label>
                          <textarea rows={2} value={spiritual.detailKebutuhan} onChange={e => setSpi("detailKebutuhan", e.target.value)}
                            placeholder="Kebutuhan khusus, ritual ibadah, kunjungan pemuka agama..."
                            className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div>
                    <Label>Penolakan Prosedur Medis Berbasis Kepercayaan?</Label>
                    <div className="flex gap-2">
                      {([true, false] as const).map(v => (
                        <button key={String(v)} type="button" onClick={() => setSpi("penolakanProsedur", v)}
                          className={cn("flex-1 rounded-lg border py-1.5 text-xs font-semibold transition",
                            spiritual.penolakanProsedur === v
                              ? v ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-400 bg-slate-100 text-slate-700"
                              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                          {v ? "Ya" : "Tidak"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <AnimatePresence>
                    {spiritual.penolakanProsedur && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                        <div>
                          <Label>Detail Penolakan</Label>
                          <textarea rows={2} value={spiritual.detailPenolakan} onChange={e => setSpi("detailPenolakan", e.target.value)}
                            placeholder="Misal: menolak transfusi darah, menolak prosedur tertentu..."
                            className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div>
                    <Label>Catatan Spiritual</Label>
                    <textarea rows={2} value={spiritual.catatanSpiritual} onChange={e => setSpi("catatanSpiritual", e.target.value)}
                      placeholder="Keterangan tambahan kebutuhan spiritual pasien..."
                      className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────

interface AnamnesisPaneRIProps {
  patient: RawatInapPatientDetail;
  onComplete?: (done: boolean) => void;
}

// ── Main component ────────────────────────────────────────

export default function AnamnesisPaneRI({ patient, onComplete }: AnamnesisPaneRIProps) {
  const mock = ASESMEN_AWAL_MOCK[patient.noRM];

  const EMPTY_SOS: typeof mock extends { sosial: infer S } ? S : object = {
    pekerjaan: "", pendidikan: "", statusPernikahan: "", tinggalBersama: "",
    dukunganKeluarga: "" as const, hambatanKomunikasi: [], kondisiEkonomi: "" as const, catatanSosial: "",
  };
  const EMPTY_SPI = {
    agama: "", kebutuhanSpiritual: null as boolean | null, detailKebutuhan: "",
    penolakanProsedur: null as boolean | null, detailPenolakan: "", catatanSpiritual: "",
  };

  const [form, setForm] = useState<AnamnesisRIData>({
    keluhanUtama:   mock?.keluhanUtama   ?? "",
    rps:            mock?.rps            ?? "",
    onsetDurasi:    mock?.onsetDurasi    ?? "",
    faktorPemberat: mock?.faktorPemberat ?? "",
    faktorPemerut:  mock?.faktorPemerut  ?? "",
    statusGeneralis: mock?.statusGeneralis ?? "",
    obatSaatIni:    mock?.obatSaatIni    ?? (patient.obatSaatIni ?? ""),
    sosial:         mock?.sosial         ?? (EMPTY_SOS as AnamnesisRIData["sosial"]),
    spiritual:      mock?.spiritual      ?? (EMPTY_SPI as AnamnesisRIData["spiritual"]),
    savedAt: "",
  });

  const { session } = useSession();
  const isPersisted = ANAMNESIS_UUID_RE.test(patient.id);

  const [sumber, setSumber] = useState<SumberAnamnesis>("Pasien");
  const [loading, setLoading] = useState(isPersisted);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Muat anamnesis terbaru dari DB (kunjungan nyata, UUID). Demo (non-UUID) → tetap mock.
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getAnamnesis(patient.id, ac.signal)
      .then((dto) => {
        if (ac.signal.aborted || !dto) return;
        setSumber((dto.sumberAnamnesis as SumberAnamnesis) ?? "Pasien");
        setForm((f) => ({
          ...f,
          keluhanUtama: dto.keluhanUtama,
          rps: dto.rps,
          onsetDurasi: dto.onsetDurasi ?? "",
          faktorPemberat: dto.faktorPemberat ?? "",
          faktorPemerut: dto.faktorPeringan ?? "",
          statusGeneralis: dto.statusGeneralis,
          obatSaatIni: dto.obatSaatIni ?? "",
          sosial: (dto.sosial as AnamnesisRIData["sosial"]) ?? f.sosial,
          spiritual: (dto.spiritual as AnamnesisRIData["spiritual"]) ?? f.spiritual,
        }));
        setSavedAt(dto.createdAt);
        onComplete?.(dto.keluhanUtama.trim().length > 3 && dto.rps.trim().length > 10 && dto.statusGeneralis.trim().length > 3);
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (!ac.signal.aborted) setError("Gagal memuat anamnesis dari rekam medis.");
      })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [patient.id, isPersisted, onComplete]);

  async function handleSave() {
    if (!isPersisted) { setError("Pasien demo — anamnesis tidak tersimpan ke database."); return; }
    if (!form.keluhanUtama.trim() || !form.rps.trim() || !form.statusGeneralis.trim()) {
      setError("Lengkapi Keluhan Utama, RPS, dan Status Generalis (wajib).");
      return;
    }
    setSaving(true); setError(null);
    try {
      const dto = await saveAnamnesis(patient.id, {
        sumberAnamnesis: sumber,
        keluhanUtama: form.keluhanUtama,
        rps: form.rps,
        onsetDurasi: form.onsetDurasi || undefined,
        mekanismeCedera: undefined, // RI tak fokus trauma; isi bila relevan
        faktorPemberat: form.faktorPemberat || undefined,
        faktorPeringan: form.faktorPemerut || undefined,
        statusGeneralis: form.statusGeneralis,
        obatSaatIni: form.obatSaatIni || undefined,
        sosial: form.sosial as AnamnesisInput["sosial"],
        spiritual: form.spiritual as AnamnesisInput["spiritual"],
      });
      setSavedAt(dto.createdAt);
      toast.success("Asesmen anamnesis tersimpan", `${patient.name} · tercatat ke rekam medis.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan anamnesis.");
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof AnamnesisRIData>(k: K, v: AnamnesisRIData[K]) => {
    const updated = { ...form, [k]: v };
    setForm(updated);
    const done = updated.keluhanUtama.trim().length > 3 && updated.rps.trim().length > 10 && updated.statusGeneralis.trim().length > 3;
    onComplete?.(done);
  };

  function applyTemplate(t: AnamnesisTemplateDTO) {
    const updated = {
      ...form,
      keluhanUtama:    t.keluhanUtama,
      rps:             t.rps,
      onsetDurasi:     t.onsetDurasi,
      faktorPemberat:  t.faktorPemberat,
      faktorPemerut:   t.faktorPemerut,
      statusGeneralis: t.statusGeneralis,
    };
    setForm(updated);
    onComplete?.(updated.keluhanUtama.trim().length > 3 && updated.rps.trim().length > 10 && updated.statusGeneralis.trim().length > 3);
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">

      {/* Left: form */}
      <div className="flex flex-col gap-3 md:flex-1 md:min-w-0">

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            <Loader2 size={13} className="animate-spin" /> Memuat anamnesis dari rekam medis…
          </div>
        )}

        {/* Sumber anamnesis — dipilih langsung (selaras IGD): siapa pemberi keterangan */}
        <div className="flex flex-wrap gap-2">
          <p className="w-full text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Sumber Anamnesis<span className="ml-0.5 text-rose-400">*</span>
          </p>
          {SUMBER_OPTS.map((s) => (
            <button key={s} type="button" onClick={() => setSumber(s)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                sumber === s
                  ? "border-sky-400 bg-sky-50 text-sky-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:bg-sky-50/40",
              )}>
              {s}
            </button>
          ))}
        </div>

        {/* Keluhan & RPS */}
        <Block title="Keluhan & Anamnesis" badge="Wajib">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Lengkapi riwayat penyakit sekarang</span>
            <AnamnesisTemplatePicker modul="RI" onApply={applyTemplate} />
          </div>
          <TA label="Keluhan Utama" required value={form.keluhanUtama} onChange={v => set("keluhanUtama", v)}
            placeholder="Keluhan utama yang membawa pasien masuk RS..." />
          <TA label="Riwayat Penyakit Sekarang (RPS)" rows={4} required value={form.rps} onChange={v => set("rps", v)}
            placeholder="Kronologis keluhan: kapan mulai, bagaimana perkembangannya, gejala penyerta, sudah berobat sebelumnya..." />
          <div className="grid gap-3 sm:grid-cols-3">
            <TA label="Onset / Durasi" value={form.onsetDurasi} onChange={v => set("onsetDurasi", v)} placeholder="Mendadak, ± 2 hari..." />
            <TA label="Faktor Pemberat" value={form.faktorPemberat} onChange={v => set("faktorPemberat", v)} placeholder="Aktivitas, posisi..." />
            <TA label="Faktor Peringan" value={form.faktorPemerut} onChange={v => set("faktorPemerut", v)} placeholder="Istirahat, obat..." />
          </div>
        </Block>

        {/* Status Generalis */}
        <Block title="Status Generalis" badge="Wajib">
          <p className="text-[11px] text-slate-400">Deskripsi singkat keadaan umum pasien saat masuk. Pemeriksaan fisik lengkap di tab Pemeriksaan Fisik.</p>
          <TA label="Keadaan Umum" rows={2} required value={form.statusGeneralis} onChange={v => set("statusGeneralis", v)}
            placeholder="Tampak sakit sedang/berat, kesadaran, tanda vital awal, posisi pasien..." />
        </Block>

        {/* Obat Saat Ini */}
        <Block title="Obat yang Sedang Diminum">
          <TA label="Daftar Obat" rows={3} value={form.obatSaatIni} onChange={v => set("obatSaatIni", v)}
            placeholder="Nama obat, dosis, frekuensi, rute — satu per baris..." />
          <p className="text-[11px] text-slate-400">Riwayat detail obat dengan indikasi ada di sub-tab Riwayat → Pemberian Obat.</p>
        </Block>

        {/* Sosial & Spiritual accordion */}
        <SosialSpiritualAccordion
          sosial={form.sosial}
          onSosialChange={v => set("sosial", v)}
          spiritual={form.spiritual}
          onSpiritualChange={v => set("spiritual", v)}
        />

        <div className="flex flex-col items-end gap-2 pt-1">
          {error && (
            <div role="alert" className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
          {!error && savedAt && (
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
              <Check size={13} className="shrink-0" /> Tersimpan · {savedAt.slice(0, 16).replace("T", " ")} WIB
            </div>
          )}
          {!isPersisted && !error && (
            <p className="text-[11px] text-amber-600">Pasien demo — perubahan tidak tersimpan ke database.</p>
          )}
          <div className="flex items-center gap-3">
            {isPersisted && (
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <User size={12} className="text-slate-400" />
                Dicatat oleh <span className="font-semibold text-slate-700">{session?.namaTampil ?? "—"}</span>
              </span>
            )}
            <button type="button" onClick={handleSave} disabled={saving}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-medium text-white shadow-sm transition",
                saving ? "cursor-not-allowed bg-slate-300" : "bg-sky-600 hover:bg-sky-700",
              )}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? "Menyimpan…" : "Simpan Anamnesis"}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Anamnesis Sebelumnya (longitudinal lintas kunjungan, read-only) */}
      <AnamnesisSebelumnya kunjunganId={patient.id} className="md:w-80 md:shrink-0" />

    </div>
  );
}
