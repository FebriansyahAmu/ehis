"use client";

// Komponen & helper form pengguna yang dipakai bersama oleh wizard (Tambah) dan
// form Edit. Field primitif (Field/FormSection/fieldCls/selectCls) di-reuse dari
// OrganizationForm agar konsisten lintas master.

import { useEffect } from "react";
import { AlertCircle, Stethoscope, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs";
import { type UserRole, type UserStatus, ROLE_CFG } from "./penggunaShared";

/** Kunci scroll body selama komponen (modal) ter-mount. */
export function useBodyScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
}

export const ROLE_OPTIONS: UserRole[] = [
  "Admin", "Dokter", "Perawat", "Apoteker", "Radiografer",
  "Analis", "SpPK", "SpRad", "Kasir", "Registrasi",
];

export const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "Aktif", label: "Aktif — dapat login" },
  { value: "Suspended", label: "Suspended — sementara diblokir" },
  { value: "Non_Aktif", label: "Non-Aktif — akun dinonaktifkan" },
];

/** Saran username dari nama (buang gelar belakang, 2 kata → firstname.lastname). */
export function slugUsername(nama: string): string {
  return nama
    .replace(/,.*$/, "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 2)
    .join(".")
    .replace(/[^a-z0-9.]/g, "");
}

export function initialsOf(nama: string): string {
  return nama
    .replace(/^(dr|drg|prof|ns|apt)\.?\s+/i, "")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function ErrorText({ msg }: { msg: string }) {
  return (
    <span className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-rose-600">
      <AlertCircle size={10} /> {msg}
    </span>
  );
}

// ── Kartu identitas pegawai (ringkasan read-only) ─────────────────────────────
export interface IdentityView {
  namaLengkap: string;
  namaTampil: string;
  nip: string;
  email: string;
  unitKerja: string;
  statusPegawai: string;
  isDokter: boolean;
}

export function IdentityCard({ view, tone = "teal" }: { view: IdentityView; tone?: "teal" | "slate" }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3.5 py-3",
        tone === "teal" ? "border-teal-200 bg-teal-50/40" : "border-slate-200 bg-slate-50/60",
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[11px] font-black text-teal-700 ring-1 ring-teal-100">
        {initialsOf(view.namaLengkap)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-bold text-slate-900">{view.namaTampil}</p>
          {view.isDokter && (
            <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-700">
              <Stethoscope size={9} /> Dokter
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
          NIP {view.nip || "—"}{view.email ? ` · ${view.email}` : ""}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
            {view.unitKerja}
          </span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
            {view.statusPegawai}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Grid pemilih peran (multi-select) ─────────────────────────────────────────
export function RoleGrid({
  roles, onToggle,
}: {
  roles: UserRole[];
  onToggle: (r: UserRole) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {ROLE_OPTIONS.map((r) => {
        const cfg = ROLE_CFG[r];
        const active = roles.includes(r);
        return (
          <button
            key={r}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(r)}
            className={cn(
              "relative rounded-lg border px-2.5 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-teal-300",
              active
                ? cn("border-transparent ring-2 ring-teal-300 ring-offset-1", cfg.bg, cfg.text)
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {active && (
              <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-600">
                <Check size={9} className="text-white" />
              </span>
            )}
            <p className="text-[11px] font-semibold">{cfg.label}</p>
            <p className="mt-0.5 text-[9px] leading-tight opacity-80">{cfg.desc}</p>
          </button>
        );
      })}
    </div>
  );
}

// ── Select status akun ────────────────────────────────────────────────────────
export function StatusSelect({
  value, onChange, className,
}: {
  value: UserStatus;
  onChange: (v: UserStatus) => void;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onChange={(v) => onChange(v as UserStatus)}
      options={STATUS_OPTIONS}
      className={className}
    />
  );
}
