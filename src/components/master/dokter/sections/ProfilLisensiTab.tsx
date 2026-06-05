"use client";

import { motion } from "framer-motion";
import {
  Mail, Phone, Stethoscope, IdCard, BadgeCheck, Lock, Calendar, AlertTriangle, Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_CFG, STATUS_OPTIONS, SPESIALIS_LABEL, SPESIALIS_OPTIONS, fmtDate,
  type DokterDTO, type DokterEditForm, type SpesialisKode, type StatusPraktik,
} from "../dokterShared";
import { Field, FormSection, fieldCls, selectCls } from "../../ruangan/forms/OrganizationForm";

interface ProfilLisensiTabProps {
  /** Sumber identitas read-only (master Pegawai) + flag expired. */
  dokter: DokterDTO;
  /** Kredensial yang sedang diedit. */
  form: DokterEditForm;
  onField: <K extends keyof DokterEditForm>(key: K, value: DokterEditForm[K]) => void;
  onSpesialis: (s: SpesialisKode) => void;
}

/** Baris identitas read-only (label + nilai). */
function ReadonlyRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
        {icon}
        {value || <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}

export default function ProfilLisensiTab({
  dokter, form, onField, onSpesialis,
}: ProfilLisensiTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 gap-3 lg:grid-cols-2"
    >
      {/* Identitas — READ-ONLY (sumber: master Pegawai, G4) */}
      <FormSection title="Identitas" icon={<IdCard size={11} />}>
        <div className="mb-2.5 flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-500">
          <Lock size={10} className="text-slate-400" />
          Identitas dikelola di <span className="font-semibold text-slate-600">menu Pengguna / Pegawai</span> — read-only di sini.
        </div>
        <div className="grid grid-cols-1 gap-3">
          <ReadonlyRow label="Nama Lengkap" value={dokter.namaTampil} />
          <div className="grid grid-cols-2 gap-3">
            <ReadonlyRow label="NIK" value={<span className="font-mono">{dokter.nikMasked ?? "—"}</span>} />
            <ReadonlyRow label="NIP" value={<span className="font-mono">{dokter.nip}</span>} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ReadonlyRow
              label="Tanggal Lahir"
              value={fmtDate(dokter.tanggalLahir)}
              icon={<Calendar size={11} className="text-slate-400" />}
            />
            <ReadonlyRow label="Jenis Kelamin" value={dokter.jenisKelamin === "L" ? "Laki-laki" : dokter.jenisKelamin === "P" ? "Perempuan" : "—"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ReadonlyRow label="Email" value={dokter.email} icon={<Mail size={11} className="text-slate-400" />} />
            <ReadonlyRow label="Telepon" value={dokter.noHp} icon={<Phone size={11} className="text-slate-400" />} />
          </div>
          <ReadonlyRow label="Profesi" value={dokter.profesi} />
        </div>
      </FormSection>

      {/* Profesi & Lisensi — editable kredensial klinis */}
      <FormSection title="Profesi & Lisensi" icon={<Stethoscope size={11} />}>
        <div className="grid grid-cols-1 gap-3">
          <Field label="Spesialis" required>
            <select
              value={form.spesialisKode}
              onChange={(e) => onSpesialis(e.target.value as SpesialisKode)}
              className={cn(selectCls, "max-w-xs")}
            >
              {SPESIALIS_OPTIONS.map((s) => (
                <option key={s} value={s}>{SPESIALIS_LABEL[s]}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="No. STR" hint="KKI">
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
                className={cn(fieldCls, dokter.strExpired && "border-rose-300 text-rose-600")}
              />
            </Field>
          </div>
          {dokter.strExpired && (
            <p className="-mt-1 flex items-center gap-1 text-[10px] font-medium text-rose-600">
              <AlertTriangle size={10} /> STR sudah kedaluwarsa
            </p>
          )}
          <Field label="Kualifikasi" hint="Auto-fill dari Spesialis, bisa di-override">
            <input
              type="text"
              value={form.kualifikasi}
              onChange={(e) => onField("kualifikasi", e.target.value)}
              className={cn(fieldCls, "max-w-md")}
              placeholder={SPESIALIS_LABEL[form.spesialisKode]}
            />
          </Field>
        </div>
      </FormSection>

      {/* SIP, Status & Integrasi — full width */}
      <div className="lg:col-span-2">
        <FormSection title="SIP · Status Praktik · Integrasi" icon={<BadgeCheck size={11} />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="No. SIP" hint="DPMPTSP">
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
                className={cn(fieldCls, dokter.sipExpired && "border-rose-300 text-rose-600")}
              />
            </Field>
            <Field label="IHS Practitioner ID" hint="SatuSehat (opsional)">
              <div className="relative">
                <Link2 size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.ihsPractitionerId}
                  onChange={(e) => onField("ihsPractitionerId", e.target.value)}
                  className={cn(fieldCls, "pl-7 font-mono")}
                  placeholder="N10000xxxx"
                />
              </div>
            </Field>
            <Field label="Status Praktik">
              <div className="grid grid-cols-3 gap-1.5">
                {STATUS_OPTIONS.map((s) => {
                  const cfg = STATUS_CFG[s];
                  const active = form.statusPraktik === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onField("statusPraktik", s as StatusPraktik)}
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
          </div>
          {dokter.sipExpired && (
            <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-rose-600">
              <AlertTriangle size={10} /> SIP sudah kedaluwarsa
            </p>
          )}
        </FormSection>
      </div>
    </motion.div>
  );
}
