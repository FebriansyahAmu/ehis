"use client";

import { motion } from "framer-motion";
import { Mail, Phone, Stethoscope, IdCard, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DokterRecord, type DokterStatus, type SpesialisCode,
  STATUS_CFG, SPESIALIS_LABEL,
} from "../dokterShared";
import { Field, FormSection, fieldCls, selectCls } from "../../ruangan/forms/OrganizationForm";

const STATUS_OPTIONS: DokterStatus[] = ["Aktif", "Cuti", "Non_Aktif"];
const SPESIALIS_OPTIONS: SpesialisCode[] = [
  "Umum", "SpJP", "SpPD", "SpA", "SpOG", "SpB", "SpAn", "SpS",
  "SpM", "SpEM", "SpKK", "SpKJ", "SpPK", "SpRad", "SpTHT", "SpU",
];

interface ProfilLisensiTabProps {
  form: DokterRecord;
  onUpdate: <K extends keyof DokterRecord>(key: K, value: DokterRecord[K]) => void;
  onUpdateSpesialis: (s: SpesialisCode) => void;
}

export default function ProfilLisensiTab({
  form, onUpdate, onUpdateSpesialis,
}: ProfilLisensiTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 gap-3 lg:grid-cols-2"
    >
      {/* Identitas */}
      <FormSection title="Identitas" icon={<IdCard size={11} />}>
        <div className="grid grid-cols-1 gap-3">
          <Field label="Nama Lengkap (dengan gelar)" required>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => onUpdate("nama", e.target.value)}
              required
              className={cn(fieldCls, "max-w-md")}
              placeholder="dr. Nama Lengkap, Sp.XX"
            />
          </Field>
          <Field label="NIK" required hint="16 digit">
            <input
              type="text"
              value={form.nik}
              onChange={(e) => onUpdate("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
              required
              inputMode="numeric"
              maxLength={16}
              className={cn(fieldCls, "max-w-xs font-mono")}
              placeholder="3171XXXXXXXXXXXX"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Lahir">
              <input
                type="date"
                value={form.tanggalLahir ?? ""}
                onChange={(e) => onUpdate("tanggalLahir", e.target.value)}
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
                      onClick={() => onUpdate("jenisKelamin", g)}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition",
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
        </div>
      </FormSection>

      {/* Profesi & Lisensi */}
      <FormSection title="Profesi & Lisensi" icon={<Stethoscope size={11} />}>
        <div className="grid grid-cols-1 gap-3">
          <Field label="Spesialis" required>
            <select
              value={form.spesialis ?? "Umum"}
              onChange={(e) => onUpdateSpesialis(e.target.value as SpesialisCode)}
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
                value={form.noSTR ?? ""}
                onChange={(e) => onUpdate("noSTR", e.target.value)}
                className={cn(fieldCls, "font-mono")}
                placeholder="00.0.0.0.0.00.000000"
              />
            </Field>
            <Field label="STR Berlaku Hingga">
              <input
                type="date"
                value={form.strBerlakuHingga ?? ""}
                onChange={(e) => onUpdate("strBerlakuHingga", e.target.value)}
                className={fieldCls}
              />
            </Field>
          </div>
          <Field label="Kualifikasi" hint="Auto-fill dari Spesialis, bisa di-override">
            <input
              type="text"
              value={form.kualifikasi ?? ""}
              onChange={(e) => onUpdate("kualifikasi", e.target.value)}
              className={cn(fieldCls, "max-w-md")}
            />
          </Field>
        </div>
      </FormSection>

      {/* SIP & Kontak — full width */}
      <div className="lg:col-span-2">
        <FormSection title="SIP & Kontak RS" icon={<BadgeCheck size={11} />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="No. SIP" required hint="DPMPTSP">
              <input
                type="text"
                value={form.noSIP}
                onChange={(e) => onUpdate("noSIP", e.target.value)}
                required
                className={cn(fieldCls, "font-mono")}
                placeholder="SIP/000/2024"
              />
            </Field>
            <Field label="SIP Berlaku Hingga">
              <input
                type="date"
                value={form.sipBerlakuHingga ?? ""}
                onChange={(e) => onUpdate("sipBerlakuHingga", e.target.value)}
                className={fieldCls}
              />
            </Field>
            <Field label="Email">
              <div className="relative">
                <Mail size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => onUpdate("email", e.target.value)}
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
                  onChange={(e) => onUpdate("telp", e.target.value)}
                  className={cn(fieldCls, "pl-7")}
                />
              </div>
            </Field>
            <div className="sm:col-span-2 lg:col-span-4">
              <Field label="Status Aktif">
                <div className="grid grid-cols-3 gap-1.5 sm:max-w-xs">
                  {STATUS_OPTIONS.map((s) => {
                    const cfg = STATUS_CFG[s];
                    const active = form.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onUpdate("status", s)}
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
          </div>
        </FormSection>
      </div>
    </motion.div>
  );
}
