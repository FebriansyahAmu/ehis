"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  UserCog, Save, Trash2, Mail, Phone, Calendar,
  Building2, CheckCircle2, Clock, Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DokterRecord, type JadwalSlot, type DokterStatus, type SpesialisCode,
  STATUS_CFG, SPESIALIS_LABEL, POLI_LIST, HARI_LIST,
  getPoliNama,
} from "./dokterShared";
import { Field, FormSection, fieldCls, selectCls } from "../ruangan/forms/OrganizationForm";

interface DokterDetailProps {
  dokter: DokterRecord;
  onSave: (next: DokterRecord) => void;
  onDelete: (dokter: DokterRecord) => void;
}

const STATUS_OPTIONS: DokterStatus[] = ["Aktif", "Cuti", "Non_Aktif"];
const SPESIALIS_OPTIONS: SpesialisCode[] = [
  "Umum", "SpJP", "SpPD", "SpA", "SpOG", "SpB", "SpAn", "SpS",
  "SpM", "SpEM", "SpKK", "SpKJ", "SpPK", "SpRad", "SpTHT", "SpU",
];

export default function DokterDetail({ dokter, onSave, onDelete }: DokterDetailProps) {
  const [form, setForm] = useState<DokterRecord>(dokter);
  const [dirty, setDirty] = useState(false);

  // Reset form bila dokter berubah (user pilih dokter lain di list)
  useEffect(() => {
    setForm(dokter);
    setDirty(false);
  }, [dokter]);

  const update = <K extends keyof DokterRecord>(key: K, value: DokterRecord[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const togglePoli = (kode: string) => {
    const has = form.poliAssignment.includes(kode);
    update("poliAssignment", has
      ? form.poliAssignment.filter((p) => p !== kode)
      : [...form.poliAssignment, kode]);
  };

  const addJadwal = () => {
    update("jadwal", [...form.jadwal, { hari: "Senin", jamMulai: "08:00", jamSelesai: "12:00" }]);
  };

  const updateJadwal = (idx: number, patch: Partial<JadwalSlot>) => {
    update("jadwal", form.jadwal.map((j, i) => (i === idx ? { ...j, ...patch } : j)));
  };

  const removeJadwal = (idx: number) => {
    update("jadwal", form.jadwal.filter((_, i) => i !== idx));
  };

  const updateSpesialis = (s: SpesialisCode) => {
    setForm((f) => ({ ...f, spesialis: s, kualifikasi: SPESIALIS_LABEL[s] }));
    setDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setDirty(false);
  };

  const status = STATUS_CFG[form.status];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 ring-2 ring-teal-100">
            <UserCog size={18} className="text-teal-600" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">
              Dokter / Nakes
            </p>
            <h2 className="text-sm font-bold text-slate-900">{form.nama || "Dokter Baru"}</h2>
            {form.spesialis && (
              <p className="mt-0.5 text-[10px] text-slate-400">{SPESIALIS_LABEL[form.spesialis]}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(dokter)}
          className="flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          <Trash2 size={11} />
          Hapus
        </button>
      </div>

      {/* Section: Identitas */}
      <FormSection title="Identitas">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nama Lengkap (dengan gelar)" required>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => update("nama", e.target.value)}
              required
              className={fieldCls}
              placeholder="dr. Nama Lengkap, Sp.XX"
            />
          </Field>
          <Field label="NIK" required hint="16 digit">
            <input
              type="text"
              value={form.nik}
              onChange={(e) => update("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
              required
              inputMode="numeric"
              maxLength={16}
              className={cn(fieldCls, "font-mono")}
              placeholder="3171XXXXXXXXXXXX"
            />
          </Field>
          <Field label="Tanggal Lahir">
            <input
              type="date"
              value={form.tanggalLahir ?? ""}
              onChange={(e) => update("tanggalLahir", e.target.value)}
              className={fieldCls}
            />
          </Field>
          <Field label="Jenis Kelamin">
            <div className="grid grid-cols-2 gap-1.5">
              {(["L", "P"] as const).map((g) => {
                const active = form.jenisKelamin === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => update("jenisKelamin", g)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition",
                      active
                        ? "border-teal-300 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {g === "L" ? "Laki-laki" : "Perempuan"}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </FormSection>

      {/* Section: Profesi (STR + Spesialis) */}
      <FormSection title="Data Profesi" icon={<Stethoscope size={11} />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Spesialis" required>
            <select
              value={form.spesialis ?? "Umum"}
              onChange={(e) => updateSpesialis(e.target.value as SpesialisCode)}
              className={selectCls}
            >
              {SPESIALIS_OPTIONS.map((s) => (
                <option key={s} value={s}>{SPESIALIS_LABEL[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="No. STR" hint="Surat Tanda Registrasi (KKI)">
            <input
              type="text"
              value={form.noSTR ?? ""}
              onChange={(e) => update("noSTR", e.target.value)}
              className={cn(fieldCls, "font-mono")}
              placeholder="00.0.0.0.0.00.000000"
            />
          </Field>
          <Field label="STR Berlaku Hingga">
            <input
              type="date"
              value={form.strBerlakuHingga ?? ""}
              onChange={(e) => update("strBerlakuHingga", e.target.value)}
              className={fieldCls}
            />
          </Field>
          <Field label="Kualifikasi" hint="Auto-fill dari Spesialis, bisa di-override">
            <input
              type="text"
              value={form.kualifikasi ?? ""}
              onChange={(e) => update("kualifikasi", e.target.value)}
              className={fieldCls}
            />
          </Field>
        </div>
      </FormSection>

      {/* Section: SIP + Kontak RS */}
      <FormSection title="SIP & Kontak RS">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="No. SIP" required hint="Surat Izin Praktik dari DPMPTSP">
            <input
              type="text"
              value={form.noSIP}
              onChange={(e) => update("noSIP", e.target.value)}
              required
              className={cn(fieldCls, "font-mono")}
              placeholder="SIP/000/DPMPTSP/2024"
            />
          </Field>
          <Field label="SIP Berlaku Hingga">
            <input
              type="date"
              value={form.sipBerlakuHingga ?? ""}
              onChange={(e) => update("sipBerlakuHingga", e.target.value)}
              className={fieldCls}
            />
          </Field>
          <Field label="Email">
            <div className="relative">
              <Mail size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={cn(fieldCls, "pl-7")}
              />
            </div>
          </Field>
          <Field label="Telepon">
            <div className="relative">
              <Phone size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={form.telp}
                onChange={(e) => update("telp", e.target.value)}
                className={cn(fieldCls, "pl-7")}
              />
            </div>
          </Field>
          <Field label="Status">
            <div className="grid grid-cols-3 gap-1.5">
              {STATUS_OPTIONS.map((s) => {
                const cfg = STATUS_CFG[s];
                const active = form.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update("status", s)}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition",
                      active
                        ? cn("border-transparent ring-2 ring-offset-1", cfg.bg, cfg.text,
                            s === "Aktif" ? "ring-emerald-300" : s === "Cuti" ? "ring-amber-300" : "ring-slate-300")
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="sm:col-span-1">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Indikator
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
              <span className={cn("h-2 w-2 rounded-full", status.dot)} />
              <span className="text-[11px] font-semibold text-slate-700">{status.label}</span>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Section: Poli Assignment */}
      <FormSection title="Penugasan Poli / Unit" icon={<Building2 size={11} />}>
        <div className="flex flex-wrap gap-1.5">
          {POLI_LIST.map((p) => {
            const active = form.poliAssignment.includes(p.kode);
            return (
              <button
                key={p.kode}
                type="button"
                onClick={() => togglePoli(p.kode)}
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition",
                  active
                    ? "border-teal-300 bg-teal-50 text-teal-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {active && <CheckCircle2 size={10} />}
                {p.nama}
              </button>
            );
          })}
        </div>
        {form.poliAssignment.length > 0 && (
          <p className="mt-2 text-[10px] text-slate-500">
            Bertugas di {form.poliAssignment.length} unit:{" "}
            <span className="font-semibold text-slate-700">
              {form.poliAssignment.map(getPoliNama).join(", ")}
            </span>
          </p>
        )}
      </FormSection>

      {/* Section: Jadwal */}
      <FormSection title="Jadwal Praktik" icon={<Calendar size={11} />}>
        {form.jadwal.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-[11px] text-slate-500">
            Belum ada jadwal terdaftar
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {form.jadwal.map((j, i) => (
              <JadwalRow
                key={i}
                slot={j}
                onChange={(patch) => updateJadwal(i, patch)}
                onRemove={() => removeJadwal(i)}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addJadwal}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
        >
          <Clock size={11} />
          Tambah Slot Jadwal
        </button>
      </FormSection>

      {/* Submit */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-[10px] text-slate-400">
          {dirty ? "Perubahan belum disimpan" : "Tidak ada perubahan"}
        </p>
        <button
          type="submit"
          disabled={!dirty}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm transition",
            dirty
              ? "bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98]"
              : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
        >
          <Save size={12} />
          Simpan Perubahan
        </button>
      </div>
    </form>
  );
}

// ── Sub-components ──

function JadwalRow({
  slot, onChange, onRemove,
}: {
  slot: JadwalSlot;
  onChange: (patch: Partial<JadwalSlot>) => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2"
    >
      <select
        value={slot.hari}
        onChange={(e) => onChange({ hari: e.target.value as JadwalSlot["hari"] })}
        className={cn(selectCls, "flex-1")}
      >
        {HARI_LIST.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <input
        type="time"
        value={slot.jamMulai}
        onChange={(e) => onChange({ jamMulai: e.target.value })}
        className={cn(fieldCls, "w-24 font-mono")}
      />
      <span className="text-[10px] text-slate-400">—</span>
      <input
        type="time"
        value={slot.jamSelesai}
        onChange={(e) => onChange({ jamSelesai: e.target.value })}
        className={cn(fieldCls, "w-24 font-mono")}
      />
      <button
        type="button"
        onClick={onRemove}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
        aria-label="Hapus jadwal"
      >
        <Trash2 size={11} />
      </button>
    </motion.div>
  );
}
