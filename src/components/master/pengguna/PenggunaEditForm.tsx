"use client";

// Form Edit pengguna (akun sudah ada) — 1 layar. Identitas pegawai TERKUNCI;
// ubah username, reset password (opsional), peran, dan status.

import { useState } from "react";
import { X, UserCog2, KeyRound, ShieldCheck, CheckCircle2, Eye, EyeOff, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PenggunaRecord, type UserRole, type UserStatus,
  PEGAWAI_MOCK, namaTampilPegawai,
} from "./penggunaShared";
import {
  ErrorText, IdentityCard, RoleGrid, StatusSelect, useBodyScrollLock, type IdentityView,
} from "./penggunaFormShared";
import { Field, FormSection, fieldCls } from "../ruangan/forms/OrganizationForm";
import { toast } from "@/lib/ui/toastStore";

interface PenggunaEditFormProps {
  initial: PenggunaRecord;
  onClose: () => void;
  onSubmit: (next: PenggunaRecord) => void;
}

export default function PenggunaEditForm({ initial, onClose, onSubmit }: PenggunaEditFormProps) {
  useBodyScrollLock();

  const [username, setUsername] = useState(initial.username);
  const [roles, setRoles] = useState<UserRole[]>(initial.roles);
  const [status, setStatus] = useState<UserStatus>(initial.status);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) => setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));

  const peg = PEGAWAI_MOCK.find((p) => p.id === initial.pegawaiId);
  const identity: IdentityView = peg
    ? {
        namaLengkap: peg.namaLengkap, namaTampil: namaTampilPegawai(peg), nip: peg.nip,
        email: peg.email, unitKerja: peg.unitKerja, statusPegawai: peg.statusPegawai, isDokter: peg.isDokter,
      }
    : {
        namaLengkap: initial.nama, namaTampil: initial.nama, nip: "—",
        email: initial.email, unitKerja: "—", statusPegawai: "—", isDokter: !!initial.dokterId,
      };

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = "Username wajib diisi.";
    else if (!/^[a-z0-9.]+$/.test(username)) e.username = "Hanya huruf kecil, angka, titik.";
    if (password) {
      if (password.length < 8) e.password = "Minimal 8 karakter.";
      else if (confirm !== password) e.confirm = "Konfirmasi password tidak cocok.";
    }
    if (roles.length === 0) e.roles = "Pilih minimal 1 peran.";
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit({ ...initial, username: username.trim(), roles, status });
    toast.success("Perubahan tersimpan", `${identity.namaTampil} · @${username.trim()}`);
    onClose();
  }

  const errCls = "border-rose-300 focus:border-rose-400 focus:ring-rose-100";

  return (
    <>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 ring-2 ring-teal-100">
            <UserCog2 size={18} className="text-teal-600" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-slate-900">Edit Pengguna</p>
            <p className="text-[11px] text-slate-500">Ubah akun login, peran, dan status</p>
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

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <Lock size={10} /> Identitas pegawai (terkunci)
              </p>
              <IdentityCard view={identity} tone="slate" />
            </div>

            <FormSection title="Kredensial Akun" icon={<KeyRound size={11} />}>
              <div className="flex flex-col gap-3.5">
                <Field label="Username" required hint="Huruf kecil, angka, titik">
                  <input
                    value={username}
                    onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/\s+/g, ".")); clearError("username"); }}
                    className={cn(fieldCls, "font-mono", errors.username && errCls)}
                    autoComplete="off"
                  />
                  {errors.username && <ErrorText msg={errors.username} />}
                </Field>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label="Password Baru" hint="Kosongkan bila tidak diubah">
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                        autoComplete="new-password"
                        className={cn(fieldCls, "pr-9 font-mono", errors.password && errCls)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 outline-none transition hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-slate-300"
                      >
                        {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {errors.password && <ErrorText msg={errors.password} />}
                  </Field>

                  <Field label="Konfirmasi Password">
                    <input
                      type={showPw ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); clearError("confirm"); }}
                      autoComplete="new-password"
                      className={cn(fieldCls, "font-mono", errors.confirm && errCls)}
                      placeholder="••••••••"
                    />
                    {errors.confirm
                      ? <ErrorText msg={errors.confirm} />
                      : confirm.length > 0 && confirm === password && (
                          <span className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                            <Check size={10} /> Password cocok
                          </span>
                        )}
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Peran & Status" icon={<ShieldCheck size={11} />}>
              <Field label="Peran / Role" required hint="Boleh lebih dari satu — hak akses = gabungan semua peran">
                <RoleGrid roles={roles} onToggle={(r) => { setRoles((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r])); clearError("roles"); }} />
                {errors.roles && <ErrorText msg={errors.roles} />}
              </Field>
              <div className="mt-3.5">
                <Field label="Status Akun">
                  <StatusSelect value={status} onChange={setStatus} className="max-w-sm" />
                </Field>
              </div>
            </FormSection>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm outline-none transition hover:bg-teal-700 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            <CheckCircle2 size={13} /> Simpan Perubahan
          </button>
        </div>
      </form>
    </>
  );
}
