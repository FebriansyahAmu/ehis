"use client";

// Informed Consent (PMK 290/2008) — shared IGD/RI/RJ.
// Redesign 2026-06-13: (1) Tindakan = katalog ter-assign ruangan (tindakan-tersedia) + fallback manual;
// (2) dropdown native → Select bersama; (3) Tanggal+Waktu → DateTimePicker gabungan; (4) Nama Dokter =
// roster dokter ter-assign ruangan (/kunjungan/:id/petugas?profesi=Dokter). Persist masih lokal (domain
// medicalrecord.InformedConsent menyusul). Pasien mock (non-UUID) → roster fallback ke DPJP header.

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ShieldCheck, X, Info,
  CalendarClock, Edit3, Stethoscope, Search, Sparkles, Loader2,
  FilePlus2, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs";
import { DateTimePicker } from "@/components/shared/inputs/DateTimePicker";
import type { ICConsentResult } from "@/lib/informed-consent/types";
import InformedConsentModal from "@/components/shared/informed-consent/InformedConsentModal";
import { listTindakanTersedia, type TindakanTersediaDTO } from "@/lib/api/master/tindakanTersedia";
import { listPetugasKunjungan } from "@/lib/api/penugasanRuangan";
import { addInformedConsent, type InformedConsentInput } from "@/lib/api/informedConsent/informedConsent";
import { toast } from "@/lib/ui/toastStore";
import DaftarICPane from "@/components/shared/informed-consent/DaftarICPane";

// kunjunganId UUID → konsumsi roster ruangan (kunjungan nyata). Selain itu fallback demo.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Patient interface (IGD/RI/RJ memenuhi ini) ──
export interface ICPatient {
  /** kunjunganId — UUID → fetch roster dokter & katalog ruangan. */
  id: string;
  name: string;
  noRM: string;
  /** DPJP default (header) — opsi awal dropdown dokter saat roster belum/ tak tersedia. */
  dpjp?: string;
}

// ── Helpers waktu (datetime-local "YYYY-MM-DDTHH:mm", timezone-safe) ──
const pad = (n: number) => String(n).padStart(2, "0");
function nowLocalDT(): string {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
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
  title?: string; icon?: IconComponent; children: React.ReactNode;
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

const HUBUNGAN_TAB = [
  "Pasien Sendiri", "Suami / Istri", "Orang Tua", "Anak Kandung", "Saudara Kandung", "Wali Resmi",
];

// ── Tindakan combobox (katalog ter-assign + fallback manual) ──

interface TindakanValue {
  nama: string;
  tindakanId: string | null;
  kategori: string | null;
}

function TindakanCombobox({
  value, catalog, loading, onChange,
}: {
  value: TindakanValue;
  catalog: TindakanTersediaDTO[];
  loading: boolean;
  onChange: (v: TindakanValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);

  const q = value.nama.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return catalog.slice(0, 30);
    return catalog.filter((e) => `${e.nama} ${e.kode}`.toLowerCase().includes(q)).slice(0, 30);
  }, [q, catalog]);

  const exactMatch = useMemo(
    () => catalog.some((e) => e.nama.toLowerCase() === q),
    [catalog, q],
  );

  return (
    <div ref={wrapRef} className="relative">
      <Label required>Nama Tindakan / Prosedur</Label>
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={value.nama}
          onChange={(e) => { onChange({ nama: e.target.value, tindakanId: null, kategori: null }); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Cari katalog ruangan atau ketik manual…"
          className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Badge sumber nilai */}
      {value.nama.trim() && (
        <div className="mt-1 flex items-center gap-1.5">
          {value.tindakanId ? (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 size={9} /> Dari katalog{value.kategori ? ` · ${value.kategori.replace(/_/g, " ")}` : ""}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 ring-1 ring-amber-200">
              <Sparkles size={9} /> Input manual (di luar katalog)
            </span>
          )}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute left-0 right-0 top-[3.7rem] z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          >
            {loading ? (
              <p className="flex items-center justify-center gap-1.5 px-3 py-4 text-center text-[11px] text-slate-400">
                <Loader2 size={12} className="animate-spin" /> Memuat katalog ruangan…
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-3 text-center text-[11px] text-slate-400">
                Tak ada di katalog — nilai dipakai sebagai input manual
              </p>
            ) : (
              filtered.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => { onChange({ nama: e.nama, tindakanId: e.id, kategori: e.kategori }); setOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-indigo-50"
                >
                  {e.kode
                    ? <span className="w-14 shrink-0 font-mono text-[10px] font-bold text-slate-400">{e.kode}</span>
                    : <span className="w-14 shrink-0 text-[9px] italic text-slate-300">tanpa kode</span>}
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{e.nama}</span>
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                    {e.kategori.replace(/_/g, " ")}
                  </span>
                </button>
              ))
            )}
            {!loading && q && !exactMatch && (
              <div className="border-t border-slate-100 px-3 py-2">
                <p className="text-[10px] text-slate-400">
                  Tekan di luar untuk memakai <span className="font-semibold text-amber-600">&ldquo;{value.nama}&rdquo;</span> sebagai input manual.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────

export default function InformedConsentTab({ patient }: { patient: ICPatient }) {
  const isPersisted = UUID_RE.test(patient.id);

  const [showICModal, setShowICModal] = useState(false);
  const [icResult,    setIcResult]    = useState<ICConsentResult | null>(null);
  const [view,        setView]        = useState<"buat" | "daftar">("buat");
  const [saving,      setSaving]      = useState(false);
  // Nomor formulir di-generate sekali (lazy init → impure Math.random tak dipanggil saat render).
  const [noFormulir] = useState(
    () => `IC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
  );
  const [form, setForm] = useState({
    tindakan:          "",
    tindakanId:        null as string | null,
    kategori:          null as string | null,
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
    namaDokter:        patient.dpjp ?? "",
    waktu:             nowLocalDT(),
  });
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // ── Katalog tindakan ter-assign (master, bukan kunjungan-scoped) ──
  const [catalog, setCatalog] = useState<TindakanTersediaDTO[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  useEffect(() => {
    const ac = new AbortController();
    listTindakanTersedia({}, ac.signal)
      .then((dtos) => setCatalog(dtos))
      .catch((e) => { if (!(e instanceof DOMException && e.name === "AbortError")) setCatalog([]); })
      .finally(() => { if (!ac.signal.aborted) setCatalogLoading(false); });
    return () => ac.abort();
  }, []);

  // ── Roster dokter ter-assign ruangan kunjungan ──
  const [dokterRoster, setDokterRoster] = useState<string[]>([]);
  useEffect(() => {
    if (!isPersisted) return; // pasien demo → opsi cukup DPJP default + nilai tersimpan
    const ac = new AbortController();
    listPetugasKunjungan(patient.id, "Dokter", ac.signal)
      .then((items) => setDokterRoster(items.map((p) => p.namaTampil)))
      .catch((e) => { if (!(e instanceof DOMException && e.name === "AbortError")) setDokterRoster([]); });
    return () => ac.abort();
  }, [patient.id, isPersisted]);

  // Sertakan DPJP default + nilai tersimpan walau tak ada di roster (dokter lintas-ruangan / record lama).
  const dokterOptions = useMemo(() => {
    const set = new Set(dokterRoster);
    if (patient.dpjp) set.add(patient.dpjp);
    if (form.namaDokter) set.add(form.namaDokter);
    return [...set].sort((a, b) => a.localeCompare(b, "id"));
  }, [dokterRoster, patient.dpjp, form.namaDokter]);

  const setTindakan = useCallback((v: TindakanValue) => {
    setForm((p) => ({ ...p, tindakan: v.nama, tindakanId: v.tindakanId, kategori: v.kategori }));
  }, []);

  const canSave =
    form.tindakan.trim() !== "" &&
    form.keputusan !== "" &&
    form.namaDokter.trim() !== "" &&
    form.namaPasienWali.trim() !== "";

  const handleSave = async () => {
    if (!canSave || saving) return;
    const keputusan = form.keputusan as "setuju" | "menolak";

    // Pasien demo (non-UUID) → simpan lokal (perilaku lama).
    if (!isPersisted) {
      toast.info("Pasien demo — persetujuan tidak tersimpan ke database");
      return;
    }

    const payload: InformedConsentInput = {
      noFormulir,
      tindakanId: form.tindakanId ?? undefined,
      tindakanNama: form.tindakan,
      tindakanKategori: form.kategori ?? undefined,
      tujuan: form.tujuan || undefined,
      manfaat: form.manfaat || undefined,
      risiko: form.risiko,
      risikoLain: form.risikoLain || undefined,
      alternatif: form.alternatif || undefined,
      konsekuensiTolak: form.konsekuensiTolak || undefined,
      pertanyaanPasien: form.pertanyaanPasien || undefined,
      keputusan,
      alasanTolak: form.alasanTolak || undefined,
      penandaHubungan: form.hubungan,
      penandaNama: form.namaPasienWali,
      saksi1: form.namaWitness1 || undefined,
      saksi2: form.namaWitness2 || undefined,
      namaDokter: form.namaDokter,
      signatureMethod: icResult?.signatureMethod,
      signatureData: icResult?.signatureImagePng,
      signedAt: icResult ? new Date(icResult.consentedAt) : undefined,
      waktuPersetujuan: new Date(form.waktu),
    };

    try {
      setSaving(true);
      await addInformedConsent(patient.id, payload);
      toast.success(keputusan === "menolak" ? "Penolakan tindakan dicatat" : "Persetujuan tersimpan");
      setView("daftar"); // pindah ke sub-menu Daftar agar IC yang baru tersimpan langsung terlihat
    } catch {
      toast.error("Gagal menyimpan persetujuan");
    } finally {
      setSaving(false);
    }
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
        <span className="ml-auto shrink-0 font-mono text-[11px] font-bold text-sky-600">{noFormulir}</span>
      </div>

      {/* Sub-menu: Buat | Daftar & Cetak */}
      <div className="flex gap-1 self-start rounded-xl bg-slate-100 p-1">
        {([
          { id: "buat", label: "Buat Persetujuan", icon: FilePlus2 },
          { id: "daftar", label: "Daftar & Cetak", icon: ClipboardList },
        ] as const).map((t) => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] font-semibold transition",
                active ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <t.icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {view === "daftar" ? (
        <DaftarICPane
          kunjunganId={patient.id}
          isPersisted={isPersisted}
          patient={{ name: patient.name, noRM: patient.noRM }}
        />
      ) : (
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Left: Detail tindakan */}
        <div className="flex flex-col gap-3">

          <Block title="Detail Tindakan / Prosedur" icon={Stethoscope} accent="sky">
            <TindakanCombobox
              value={{ nama: form.tindakan, tindakanId: form.tindakanId, kategori: form.kategori }}
              catalog={catalog}
              loading={catalogLoading}
              onChange={setTindakan}
            />
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
                <Select
                  value={form.hubungan}
                  onChange={(v) => setF("hubungan", v)}
                  options={HUBUNGAN_TAB}
                  placeholder="Hubungan dengan pasien"
                />
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

          <Block title="Dokter, Saksi & Waktu" icon={CalendarClock} accent="slate">
            <div>
              <Label required>Nama Dokter / DPJP</Label>
              <Select
                value={form.namaDokter}
                onChange={(v) => setF("namaDokter", v)}
                options={dokterOptions}
                icon={Stethoscope}
                placeholder={isPersisted ? "Pilih dokter ter-assign ruangan…" : "Pilih dokter…"}
              />
              {isPersisted && dokterRoster.length === 0 && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Belum ada dokter ter-assign ruangan ini — opsi memakai DPJP header.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TI label="Saksi 1" value={form.namaWitness1}
                onChange={(v) => setF("namaWitness1", v)} placeholder="Nama saksi..." />
              <TI label="Saksi 2" value={form.namaWitness2}
                onChange={(v) => setF("namaWitness2", v)} placeholder="Nama saksi..." />
            </div>
            <div>
              <Label>Tanggal &amp; Waktu Persetujuan</Label>
              <DateTimePicker value={form.waktu} onChange={(v) => setF("waktu", v)} />
            </div>
          </Block>

          <div className="flex gap-2">
            <button
              type="button" onClick={handleSave} disabled={!canSave || saving}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40",
                form.keputusan === "menolak" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700",
              )}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              {saving ? "Menyimpan…" : form.keputusan === "menolak" ? "Catat Penolakan" : "Simpan Persetujuan"}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
