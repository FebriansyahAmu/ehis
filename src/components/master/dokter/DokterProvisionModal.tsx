"use client";

// Provisioning profil Dokter — alur 2 langkah (B.10 #4 · DK5). TIDAK ada "Tambah dokter dari
// nol": identitas datang dari Pegawai. (1) cari & pilih pegawai profesi-dokter yang BELUM punya
// profil (GET /master/dokter/tanpa-profil) → (2) lengkapi kredensial klinis (POST /master/dokter).
// Palet teal/slate + rose error. a11y: role=dialog, Escape menutup, fokus awal ke search.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X, Search, Stethoscope, UserSearch, Loader2, ArrowLeft, ArrowRight,
  IdCard, BadgeCheck, Building2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldCls, selectCls, Field } from "../ruangan/forms/OrganizationForm";
import { ApiError } from "@/lib/api/client";
import {
  listTanpaProfil, createDokter,
  type DokterTanpaProfilDTO, type DokterDTO, type CreateDokterInput,
} from "@/lib/api/dokter";
import {
  SPESIALIS_LABEL, SPESIALIS_OPTIONS, STATUS_OPTIONS, STATUS_CFG,
  namaInitials, type SpesialisKode, type StatusPraktik,
} from "./dokterShared";

interface CredForm {
  spesialisKode: SpesialisKode;
  kualifikasi: string;
  noStr: string;
  strBerlakuHingga: string;
  noSip: string;
  sipBerlakuHingga: string;
  statusPraktik: StatusPraktik;
}

const EMPTY_FORM: CredForm = {
  spesialisKode: "Umum",
  kualifikasi: "",
  noStr: "",
  strBerlakuHingga: "",
  noSip: "",
  sipBerlakuHingga: "",
  statusPraktik: "Aktif",
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** Dipanggil setelah profil berhasil dibuat — parent menyisipkan ke list + select. */
  onCreated: (dokter: DokterDTO) => void;
}

export default function DokterProvisionModal({ open, onClose, onCreated }: Props) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [step, setStep] = useState<1 | 2>(1);
  const [cands, setCands] = useState<DokterTanpaProfilDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<DokterTanpaProfilDTO | null>(null);
  const [form, setForm] = useState<CredForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Reset + fetch saat dibuka.
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setPicked(null);
    setForm(EMPTY_FORM);
    setSearch("");
    setSubmitErr(null);
    const ctrl = new AbortController();
    setLoading(true);
    setLoadErr(null);
    listTanpaProfil(ctrl.signal)
      .then((rows) => setCands(rows))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setLoadErr(e instanceof ApiError ? e.message : "Gagal memuat daftar pegawai dokter");
      })
      .finally(() => setLoading(false));
    const t = setTimeout(() => searchRef.current?.focus(), 60);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [open]);

  // Escape menutup (kecuali submitting).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cands;
    return cands.filter(
      (c) =>
        c.namaTampil.toLowerCase().includes(q) ||
        c.nip.toLowerCase().includes(q) ||
        (c.profesi?.toLowerCase().includes(q) ?? false) ||
        (c.unitKerja?.toLowerCase().includes(q) ?? false),
    );
  }, [cands, search]);

  function pick(c: DokterTanpaProfilDTO) {
    setPicked(c);
    setForm(EMPTY_FORM);
    setSubmitErr(null);
    setStep(2);
  }

  function setField<K extends keyof CredForm>(key: K, value: CredForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Ganti spesialis → auto-isi kualifikasi (cermin server) selama belum diketik manual.
  function setSpesialis(s: SpesialisKode) {
    setForm((f) => ({
      ...f,
      spesialisKode: s,
      kualifikasi: !f.kualifikasi || f.kualifikasi === SPESIALIS_LABEL[f.spesialisKode]
        ? SPESIALIS_LABEL[s]
        : f.kualifikasi,
    }));
  }

  async function submit() {
    if (!picked) return;
    setSubmitting(true);
    setSubmitErr(null);
    const input: CreateDokterInput = {
      pegawaiId: picked.pegawaiId,
      spesialisKode: form.spesialisKode,
      statusPraktik: form.statusPraktik,
      kualifikasi: form.kualifikasi.trim() || undefined,
      noStr: form.noStr.trim() || undefined,
      strBerlakuHingga: form.strBerlakuHingga || undefined,
      noSip: form.noSip.trim() || undefined,
      sipBerlakuHingga: form.sipBerlakuHingga || undefined,
    };
    try {
      const created = await createDokter(input);
      onCreated(created);
    } catch (e) {
      setSubmitErr(e instanceof ApiError ? e.message : "Gagal menyimpan profil dokter");
      setSubmitting(false);
    }
  }

  if (!mounted || !open) return null;

  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.97, y: 8 },
      };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => !submitting && onClose()}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Lengkapi profil dokter"
          className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          {...card}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white px-5 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-teal-200">
              <Stethoscope size={16} className="text-teal-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800">Lengkapi Profil Dokter</p>
              <p className="text-[10px] text-slate-500">
                {step === 1
                  ? "Pilih pegawai berprofesi dokter yang belum punya profil klinis"
                  : "Isi kredensial klinis (STR · SIP · spesialisasi)"}
              </p>
            </div>
            <StepDots step={step} />
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
              aria-label="Tutup"
            >
              <X size={15} />
            </button>
          </div>

          {step === 1 ? (
            <Step1Pick
              search={search}
              onSearch={setSearch}
              searchRef={searchRef}
              loading={loading}
              loadErr={loadErr}
              filtered={filtered}
              total={cands.length}
              onPick={pick}
            />
          ) : (
            <Step2Form
              picked={picked!}
              form={form}
              onField={setField}
              onSpesialis={setSpesialis}
              submitting={submitting}
              submitErr={submitErr}
              onBack={() => !submitting && setStep(1)}
              onSubmit={submit}
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}

// ── Step indicator ─────────────────────────────────────────
function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2].map((s) => (
        <span
          key={s}
          className={cn(
            "h-1.5 rounded-full transition-all",
            step === s ? "w-5 bg-teal-500" : step > s ? "w-1.5 bg-teal-300" : "w-1.5 bg-slate-200",
          )}
        />
      ))}
    </div>
  );
}

// ── Step 1: pilih pegawai ──────────────────────────────────
function Step1Pick({
  search, onSearch, searchRef, loading, loadErr, filtered, total, onPick,
}: {
  search: string;
  onSearch: (v: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  loading: boolean;
  loadErr: string | null;
  filtered: DokterTanpaProfilDTO[];
  total: number;
  onPick: (c: DokterTanpaProfilDTO) => void;
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="shrink-0 px-5 pb-2 pt-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari nama / NIP / unit kerja…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[12px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-slate-400">
            <Loader2 size={20} className="animate-spin text-teal-500" />
            <p className="text-[11px]">Memuat daftar…</p>
          </div>
        ) : loadErr ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <AlertCircle size={20} className="text-rose-500" />
            <p className="text-[11px] text-rose-600">{loadErr}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
              <UserSearch size={18} className="text-slate-400" />
            </span>
            <p className="text-[12px] font-semibold text-slate-600">
              {total === 0 ? "Semua dokter sudah punya profil" : "Tidak ada hasil"}
            </p>
            <p className="max-w-xs text-[10px] leading-relaxed text-slate-400">
              {total === 0
                ? "Tambahkan pegawai berprofesi Dokter / Dokter Gigi / Dokter Spesialis lebih dulu di menu Pengguna."
                : "Ubah kata kunci pencarian."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {filtered.map((c) => (
              <li key={c.pegawaiId}>
                <button
                  type="button"
                  onClick={() => onPick(c)}
                  className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-teal-50 focus-visible:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-600 group-hover:bg-teal-200 group-hover:text-teal-800">
                    {namaInitials(c.namaTampil)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-bold text-slate-800">{c.namaTampil}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{c.profesi ?? "—"}</span>
                      {c.unitKerja && (
                        <span className="inline-flex items-center gap-0.5 text-slate-400">
                          <Building2 size={9} /> {c.unitKerja}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[9px] text-slate-400">NIP {c.nip}</span>
                  </span>
                  <ArrowRight size={13} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Step 2: kredensial klinis ──────────────────────────────
function Step2Form({
  picked, form, onField, onSpesialis, submitting, submitErr, onBack, onSubmit,
}: {
  picked: DokterTanpaProfilDTO;
  form: CredForm;
  onField: <K extends keyof CredForm>(key: K, value: CredForm[K]) => void;
  onSpesialis: (s: SpesialisKode) => void;
  submitting: boolean;
  submitErr: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex min-h-0 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3.5">
        {/* Pegawai terpilih (read-only — identitas dari master Pegawai, G4) */}
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[10px] font-black text-teal-700 ring-1 ring-teal-200">
            {namaInitials(picked.namaTampil)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-slate-800">{picked.namaTampil}</p>
            <p className="truncate text-[10px] text-slate-500">
              {picked.profesi ?? "—"} · NIP {picked.nip}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-teal-700 ring-1 ring-teal-200">
            <IdCard size={9} /> Identitas terkunci
          </span>
        </div>

        {/* Spesialis + kualifikasi */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Spesialis" required>
            <select
              value={form.spesialisKode}
              onChange={(e) => onSpesialis(e.target.value as SpesialisKode)}
              className={selectCls}
            >
              {SPESIALIS_OPTIONS.map((s) => (
                <option key={s} value={s}>{SPESIALIS_LABEL[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Status Praktik" required>
            <select
              value={form.statusPraktik}
              onChange={(e) => onField("statusPraktik", e.target.value as StatusPraktik)}
              className={selectCls}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_CFG[s].label}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Kualifikasi" hint="Auto-isi dari spesialis — bisa di-override">
              <input
                type="text"
                value={form.kualifikasi}
                onChange={(e) => onField("kualifikasi", e.target.value)}
                className={fieldCls}
                placeholder={SPESIALIS_LABEL[form.spesialisKode]}
              />
            </Field>
          </div>
        </div>

        {/* STR */}
        <div className="mt-3 rounded-xl border border-slate-200 p-3">
          <div className="mb-2.5 flex items-center gap-1.5">
            <BadgeCheck size={12} className="text-slate-500" />
            <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-600">STR (KKI)</h4>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="No. STR">
              <input
                type="text"
                value={form.noStr}
                onChange={(e) => onField("noStr", e.target.value)}
                className={cn(fieldCls, "font-mono")}
                placeholder="00.0.0.0.0.00.000000"
              />
            </Field>
            <Field label="STR Berlaku Hingga">
              <input
                type="date"
                value={form.strBerlakuHingga}
                onChange={(e) => onField("strBerlakuHingga", e.target.value)}
                className={fieldCls}
              />
            </Field>
          </div>
        </div>

        {/* SIP */}
        <div className="mt-3 rounded-xl border border-slate-200 p-3">
          <div className="mb-2.5 flex items-center gap-1.5">
            <BadgeCheck size={12} className="text-slate-500" />
            <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-600">SIP (DPMPTSP)</h4>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="No. SIP">
              <input
                type="text"
                value={form.noSip}
                onChange={(e) => onField("noSip", e.target.value)}
                className={cn(fieldCls, "font-mono")}
                placeholder="SIP/000/2024"
              />
            </Field>
            <Field label="SIP Berlaku Hingga">
              <input
                type="date"
                value={form.sipBerlakuHingga}
                onChange={(e) => onField("sipBerlakuHingga", e.target.value)}
                className={fieldCls}
              />
            </Field>
          </div>
        </div>

        {submitErr && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{submitErr}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
        >
          <ArrowLeft size={12} />
          Kembali
        </button>
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition active:scale-[0.98]",
            submitting ? "cursor-not-allowed bg-teal-400" : "bg-teal-600 hover:bg-teal-700",
          )}
        >
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
          {submitting ? "Menyimpan…" : "Simpan Profil"}
        </button>
      </div>
    </form>
  );
}
