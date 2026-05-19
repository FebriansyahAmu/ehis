"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, UserCog2, Mail, Phone, KeyRound, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PenggunaRecord, type UserRole, type UserStatus,
  ROLE_CFG, UNIT_LIST, newUserId,
} from "./penggunaShared";
import { Field, FormSection, fieldCls, selectCls } from "../ruangan/forms/OrganizationForm";

interface PenggunaFormModalProps {
  open: boolean;
  initial: PenggunaRecord | null;
  onClose: () => void;
  onSubmit: (next: PenggunaRecord) => void;
}

const ROLE_OPTIONS: UserRole[] = [
  "Admin", "Dokter", "Perawat", "Apoteker", "Radiografer",
  "SpPK", "SpRad", "Kasir", "Registrasi",
];
const STATUS_OPTIONS: UserStatus[] = ["Aktif", "Suspended", "Non_Aktif"];

function emptyRecord(): PenggunaRecord {
  return {
    id: newUserId(),
    username: "",
    nama: "",
    email: "",
    telp: "",
    role: "Perawat",
    unitAssignment: [],
    status: "Aktif",
    lastLogin: null,
    createdAt: new Date().toISOString(),
  };
}

export default function PenggunaFormModal({
  open, initial, onClose, onSubmit,
}: PenggunaFormModalProps) {
  const [form, setForm] = useState<PenggunaRecord>(initial ?? emptyRecord());
  const [password, setPassword] = useState("");
  const isEdit = !!initial;

  useEffect(() => {
    if (open) {
      setForm(initial ?? emptyRecord());
      setPassword("");
    }
  }, [open, initial]);

  const update = <K extends keyof PenggunaRecord>(key: K, value: PenggunaRecord[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggleUnit = (kode: string) => {
    const has = form.unitAssignment.includes(kode);
    update("unitAssignment", has
      ? form.unitAssignment.filter((u) => u !== kode)
      : [...form.unitAssignment, kode]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pengguna-form-title"
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 ring-2 ring-teal-100">
                  {isEdit ? <UserCog2 size={16} className="text-teal-600" /> : <UserPlus size={16} className="text-teal-600" />}
                </span>
                <div>
                  <p id="pengguna-form-title" className="text-sm font-bold text-slate-900">
                    {isEdit ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Akun internal EHIS — akses ke modul rumah sakit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form body — scrollable */}
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="flex flex-col gap-3.5">
                  <FormSection title="Identitas Akun">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Nama Lengkap" required>
                        <input
                          type="text"
                          value={form.nama}
                          onChange={(e) => update("nama", e.target.value)}
                          required
                          className={fieldCls}
                          placeholder="Mis. Siti Maryani, S.Kep"
                        />
                      </Field>
                      <Field label="Username" required>
                        <input
                          type="text"
                          value={form.username}
                          onChange={(e) => update("username", e.target.value.toLowerCase().replace(/\s+/g, "."))}
                          required
                          className={cn(fieldCls, "font-mono lowercase")}
                          placeholder="siti.maryani"
                          pattern="^[a-z0-9.]+$"
                        />
                      </Field>
                      <Field label="Email" required>
                        <div className="relative">
                          <Mail size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            required
                            className={cn(fieldCls, "pl-7")}
                            placeholder="nama@rsharapansehat.id"
                          />
                        </div>
                      </Field>
                      <Field label="Telepon">
                        <div className="relative">
                          <Phone size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            value={form.telp ?? ""}
                            onChange={(e) => update("telp", e.target.value)}
                            className={cn(fieldCls, "pl-7")}
                            placeholder="0812-0000-0000"
                          />
                        </div>
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection title={isEdit ? "Reset Password (opsional)" : "Password Awal"} icon={<KeyRound size={11} />}>
                    <Field label={isEdit ? "Password Baru" : "Password"} required={!isEdit} hint={isEdit ? "Kosongkan jika tidak ingin mengubah" : "Minimal 8 karakter, kombinasi huruf & angka"}>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={!isEdit}
                        minLength={isEdit ? 0 : 8}
                        autoComplete="new-password"
                        className={cn(fieldCls, "font-mono")}
                      />
                    </Field>
                  </FormSection>

                  <FormSection title="Peran & Status">
                    <Field label="Role / Peran" required>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {ROLE_OPTIONS.map((r) => {
                          const cfg = ROLE_CFG[r];
                          const active = form.role === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => update("role", r)}
                              className={cn(
                                "rounded-lg border px-2.5 py-2 text-left transition",
                                active
                                  ? cn("border-transparent ring-2 ring-offset-1 ring-teal-300", cfg.bg, cfg.text)
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                              )}
                            >
                              <p className="text-[11px] font-semibold">{cfg.label}</p>
                              <p className="mt-0.5 text-[9px] leading-tight opacity-80">{cfg.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </Field>

                    <div className="mt-3">
                      <Field label="Status Akun">
                        <select
                          value={form.status}
                          onChange={(e) => update("status", e.target.value as UserStatus)}
                          className={selectCls}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", "-")}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection title="Penugasan Unit">
                    <div className="flex flex-wrap gap-1.5">
                      {UNIT_LIST.map((u) => {
                        const active = form.unitAssignment.includes(u.kode);
                        return (
                          <button
                            key={u.kode}
                            type="button"
                            onClick={() => toggleUnit(u.kode)}
                            className={cn(
                              "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition",
                              active
                                ? "border-teal-300 bg-teal-50 text-teal-700"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                            )}
                          >
                            {active && <CheckCircle2 size={10} />}
                            {u.nama}
                          </button>
                        );
                      })}
                    </div>
                    {form.unitAssignment.length === 0 && (
                      <p className="mt-2 text-[10px] text-amber-600">
                        Pilih minimal 1 unit. Pengguna tanpa unit tidak bisa akses modul apapun.
                      </p>
                    )}
                  </FormSection>
                </div>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={form.unitAssignment.length === 0}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm transition",
                    form.unitAssignment.length > 0
                      ? "bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98]"
                      : "cursor-not-allowed bg-slate-200 text-slate-400",
                  )}
                >
                  <CheckCircle2 size={12} />
                  {isEdit ? "Simpan Perubahan" : "Buat Pengguna"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
