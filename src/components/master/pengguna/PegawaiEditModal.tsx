"use client";

// Modal "Ubah Data Pegawai" — fetch detail (GET /master/pegawai/:id) lalu PATCH dengan
// version guard. NIK read-only (masked, PII). Outside-click menggetarkan modal (bukan menutup).
// Konten mount-per-pegawai (key=pegawaiId) → fetch bersih tiap buka, state dari hasil fetch.

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from "framer-motion";
import { X, IdCard, ShieldCheck, Loader2, Check, AlertCircle, Stethoscope, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, FormSection, fieldCls } from "../ruangan/forms/OrganizationForm";
import { DatePicker, Select } from "@/components/shared/inputs";
import { ErrorText, useBodyScrollLock } from "./penggunaFormShared";
import {
  type StatusPegawai,
  STATUS_PEGAWAI_OPTS, AGAMA_OPTS, PROFESI_OPTS, isDoctorProfesi, UNIT_KERJA_OPTS,
} from "./penggunaShared";
import { getPegawai, updatePegawai, type PegawaiDTO, type UpdatePegawaiInput } from "@/lib/api/pegawai";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";

interface PegawaiEditModalProps {
  open: boolean;
  pegawaiId: string | null;
  onClose: () => void;
  /** Dipanggil setelah simpan sukses (refresh daftar). */
  onSaved?: () => void;
}

interface FormState {
  nip: string;
  namaLengkap: string;
  gelarDepan: string;
  gelarBelakang: string;
  jenisKelamin: "L" | "P";
  agama: string;
  tempatLahir: string;
  tanggalLahir: string;
  statusPegawai: StatusPegawai;
  profesi: string;
  unitKerja: string;
  alamat: string;
  noHp: string;
  email: string;
}

const opt = (v: string): string | undefined => {
  const t = v.trim();
  return t ? t : undefined;
};

function dtoToForm(d: PegawaiDTO): FormState {
  return {
    nip: d.nip,
    namaLengkap: d.namaLengkap,
    gelarDepan: d.gelarDepan ?? "",
    gelarBelakang: d.gelarBelakang ?? "",
    jenisKelamin: d.jenisKelamin,
    agama: d.agama ?? "",
    tempatLahir: d.tempatLahir ?? "",
    tanggalLahir: d.tanggalLahir ?? "",
    statusPegawai: (d.statusPegawai as StatusPegawai) ?? "ASN",
    profesi: d.profesi ?? "",
    unitKerja: d.unitKerja ?? "",
    alamat: d.alamat ?? "",
    noHp: d.noHp ?? "",
    email: d.email ?? "",
  };
}

function apiErrorToFields(err: unknown): { fields: Record<string, string>; message: string } {
  if (err instanceof ApiError) {
    const fields: Record<string, string> = {};
    for (const fe of err.fieldErrors()) if (fe.path) fields[fe.path] = fe.message;
    return { fields, message: err.message };
  }
  return { fields: {}, message: "Terjadi kesalahan tak terduga. Coba lagi." };
}

export default function PegawaiEditModal({ open, pegawaiId, onClose, onSaved }: PegawaiEditModalProps) {
  const shake = useAnimationControls();
  const reduceMotion = useReducedMotion();

  const handleOutsideClick = () => {
    if (reduceMotion) return;
    shake.start({ x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.4, ease: "easeInOut" } });
  };

  return (
    <AnimatePresence>
      {open && pegawaiId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleOutsideClick}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[92vh] w-[min(94vw,820px)]"
            >
              <motion.div
                animate={shake}
                role="dialog"
                aria-modal="true"
                className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5"
              >
                <EditContent key={pegawaiId} pegawaiId={pegawaiId} onClose={onClose} onSaved={onSaved} />
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function EditContent({
  pegawaiId, onClose, onSaved,
}: {
  pegawaiId: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  useBodyScrollLock();

  const [dto, setDto] = useState<PegawaiDTO | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const d = await getPegawai(pegawaiId, ac.signal);
        setDto(d);
        setForm(dtoToForm(d));
        setLoading(false);
      } catch (err) {
        if (ac.signal.aborted) return;
        setFormError(err instanceof ApiError ? err.message : "Gagal memuat data pegawai");
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [pegawaiId]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));
  const clearError = (key: string) => setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));

  function validate(f: FormState): Record<string, string> {
    const e: Record<string, string> = {};
    if (!f.nip.trim()) e.nip = "NIP wajib diisi.";
    if (!f.namaLengkap.trim()) e.namaLengkap = "Nama lengkap wajib diisi.";
    if (!f.profesi) e.profesi = "Pilih jenis profesi.";
    if (f.tanggalLahir && new Date(`${f.tanggalLahir}T00:00:00`) > new Date()) {
      e.tanggalLahir = "Tidak boleh di masa depan.";
    }
    if (f.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = "Format email tidak valid.";
    if (f.noHp.trim() && f.noHp.trim().length < 6) e.noHp = "Minimal 6 digit.";
    return e;
  }

  async function save() {
    if (!form || !dto) return;
    const e = validate(form);
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      const input: UpdatePegawaiInput = {
        nip: form.nip.trim(),
        namaLengkap: form.namaLengkap.trim(),
        gelarDepan: opt(form.gelarDepan),
        gelarBelakang: opt(form.gelarBelakang),
        jenisKelamin: form.jenisKelamin,
        agama: opt(form.agama),
        tempatLahir: opt(form.tempatLahir),
        tanggalLahir: opt(form.tanggalLahir),
        statusPegawai: form.statusPegawai,
        profesi: opt(form.profesi),
        unitKerja: opt(form.unitKerja),
        alamat: opt(form.alamat),
        noHp: opt(form.noHp),
        email: opt(form.email),
        expectedVersion: dto.version,
      };
      const updated = await updatePegawai(pegawaiId, input);
      toast.success("Data pegawai diperbarui", updated.namaTampil);
      onSaved?.();
      onClose();
    } catch (err) {
      const { fields, message } = apiErrorToFields(err);
      setErrors((prev) => ({ ...prev, ...fields }));
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  const errCls = "border-rose-300 focus:border-rose-400 focus:ring-rose-100";

  return (
    <>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 ring-2 ring-sky-100">
            <IdCard size={18} className="text-sky-600" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-slate-900">Ubah Data Pegawai</p>
            <p className="text-[11px] text-slate-500">
              {dto ? dto.namaTampil : "Memuat data pegawai…"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="rounded-lg p-2 text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {formError && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-medium text-rose-700">
            <AlertCircle size={13} className="mt-px shrink-0" />
            <span className="flex-1">{formError}</span>
          </div>
        )}

        {loading || !form ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs">Memuat data pegawai…</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <FormSection title="Identitas" icon={<IdCard size={11} />}>
              <div className="flex flex-col gap-3.5">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label="NIK" hint="Terkunci (data sensitif)">
                    <div className="relative">
                      <input
                        value={dto?.nikMasked ?? "—"}
                        readOnly
                        disabled
                        className={cn(fieldCls, "cursor-not-allowed bg-slate-50 font-mono text-slate-400")}
                      />
                      <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </Field>
                  <Field label="NIP" required>
                    <input
                      value={form.nip}
                      onChange={(e) => { update("nip", e.target.value); clearError("nip"); }}
                      className={cn(fieldCls, "font-mono", errors.nip && errCls)}
                    />
                    {errors.nip && <ErrorText msg={errors.nip} />}
                  </Field>
                </div>

                <Field label="Nama Lengkap" required>
                  <input
                    value={form.namaLengkap}
                    onChange={(e) => { update("namaLengkap", e.target.value); clearError("namaLengkap"); }}
                    className={cn(fieldCls, errors.namaLengkap && errCls)}
                  />
                  {errors.namaLengkap && <ErrorText msg={errors.namaLengkap} />}
                </Field>

                <div className="grid grid-cols-2 gap-3.5">
                  <Field label="Gelar Depan" hint="Mis. dr., Ns.">
                    <input value={form.gelarDepan} onChange={(e) => update("gelarDepan", e.target.value)} className={fieldCls} placeholder="dr." />
                  </Field>
                  <Field label="Gelar Belakang" hint="Mis. Sp.JP, S.Kep">
                    <input value={form.gelarBelakang} onChange={(e) => update("gelarBelakang", e.target.value)} className={fieldCls} placeholder="Sp.JP" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label="Jenis Kelamin" required>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["L", "P"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => update("jenisKelamin", g)}
                          className={cn(
                            "rounded-lg border px-2 py-1.5 text-[11px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-sky-300",
                            form.jenisKelamin === g
                              ? "border-sky-300 bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                          )}
                        >
                          {g === "L" ? "Laki-laki" : "Perempuan"}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Agama">
                    <Select value={form.agama} onChange={(v) => update("agama", v)} options={AGAMA_OPTS} placeholder="Pilih agama" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label="Tempat Lahir">
                    <input value={form.tempatLahir} onChange={(e) => update("tempatLahir", e.target.value)} className={fieldCls} placeholder="Jakarta" />
                  </Field>
                  <Field label="Tanggal Lahir">
                    <DatePicker value={form.tanggalLahir} onChange={(v) => { update("tanggalLahir", v); clearError("tanggalLahir"); }} />
                    {errors.tanggalLahir && <ErrorText msg={errors.tanggalLahir} />}
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Kepegawaian" icon={<ShieldCheck size={11} />}>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                <Field label="Jenis Profesi" required>
                  <Select
                    value={form.profesi}
                    onChange={(v) => { update("profesi", v); clearError("profesi"); }}
                    options={PROFESI_OPTS}
                    icon={Stethoscope}
                    placeholder="Pilih profesi"
                  />
                  {errors.profesi
                    ? <ErrorText msg={errors.profesi} />
                    : isDoctorProfesi(form.profesi) && (
                        <span className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-sky-600">
                          <Stethoscope size={10} /> Tertaut sebagai Practitioner (Dokter)
                        </span>
                      )}
                </Field>
                <Field label="Status Pegawai" required>
                  <Select value={form.statusPegawai} onChange={(v) => update("statusPegawai", v as StatusPegawai)} options={STATUS_PEGAWAI_OPTS} />
                </Field>
                <Field label="Unit Kerja">
                  <Select value={form.unitKerja} onChange={(v) => update("unitKerja", v)} options={UNIT_KERJA_OPTS} placeholder="Pilih unit" />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Kontak (opsional)" icon={<IdCard size={11} />}>
              <div className="flex flex-col gap-3.5">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label="No. HP">
                    <input
                      value={form.noHp}
                      onChange={(e) => { update("noHp", e.target.value); clearError("noHp"); }}
                      className={cn(fieldCls, errors.noHp && errCls)}
                      placeholder="0812-0000-0000"
                    />
                    {errors.noHp && <ErrorText msg={errors.noHp} />}
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => { update("email", e.target.value); clearError("email"); }}
                      className={cn(fieldCls, errors.email && errCls)}
                      placeholder="nama@rsharapansehat.id"
                    />
                    {errors.email && <ErrorText msg={errors.email} />}
                  </Field>
                </div>
                <Field label="Alamat">
                  <input value={form.alamat} onChange={(e) => update("alamat", e.target.value)} className={fieldCls} placeholder="Jl. Mawar No. 1, Jakarta" />
                </Field>
              </div>
            </FormSection>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading || !form}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm outline-none transition hover:bg-sky-700 active:scale-[0.98] disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          {saving ? <><Loader2 size={13} className="animate-spin" /> Menyimpan…</> : <><Check size={13} /> Simpan Perubahan</>}
        </button>
      </div>
    </>
  );
}
