"use client";

// ANT3.3 — Hak Akses Antrian: matriks peran × izin. UI disiapkan; gating nyata
// menunggu RBAC backend. // TODO(RBAC-B0): sambungkan ke enforcement server-side.

import { useState } from "react";
import { ShieldCheck, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Role {
  kode: string;
  nama: string;
  desc: string;
}

interface Permission {
  kode: string;
  nama: string;
}

const ROLES: Role[] = [
  { kode: "admin", nama: "Admin Antrean", desc: "Kelola pengaturan & semua aksi" },
  { kode: "admisi", nama: "Petugas Admisi", desc: "Operasional loket harian" },
  { kode: "supervisor", nama: "Supervisor", desc: "Pantau & batalkan antrean" },
  { kode: "viewer", nama: "Viewer / Display", desc: "Hanya lihat board & display" },
];

const PERMISSIONS: Permission[] = [
  { kode: "loket", nama: "Buka / Tutup Loket" },
  { kode: "panggil", nama: "Panggil Antrean" },
  { kode: "respon", nama: "Respon Kedatangan" },
  { kode: "batal", nama: "Batal / No-show" },
  { kode: "pengaturan", nama: "Kelola Pengaturan" },
];

// Seed default matriks izin (kode role → set kode permission).
const DEFAULT: Record<string, string[]> = {
  admin: ["loket", "panggil", "respon", "batal", "pengaturan"],
  admisi: ["loket", "panggil", "respon", "batal"],
  supervisor: ["panggil", "batal"],
  viewer: [],
};

export function HakAksesTab() {
  const [matrix, setMatrix] = useState<Record<string, string[]>>(DEFAULT);

  const toggle = (role: string, perm: string) => {
    setMatrix((prev) => {
      const cur = prev[role] ?? [];
      const has = cur.includes(perm);
      return { ...prev, [role]: has ? cur.filter((p) => p !== perm) : [...cur, perm] };
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p className="m-xs text-amber-800">
          Matriks ini menyiapkan UI hak akses. <span className="font-semibold">Penegakan (enforcement) belum aktif</span> —
          akan disambungkan ke RBAC server-side pada fase backend (<span className="font-mono">TODO(RBAC-B0)</span>).
        </p>
      </div>

      <section className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-5 py-3 m-tiny font-bold uppercase tracking-wide text-slate-400">Peran</th>
              {PERMISSIONS.map((p) => (
                <th key={p.kode} className="px-4 py-3 text-center m-tiny font-bold uppercase tracking-wide text-slate-400">
                  {p.nama}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role) => (
              <tr key={role.kode} className="border-b border-slate-100 last:border-0 hover:bg-sky-50/30">
                <td className="px-5 py-3">
                  <p className="flex items-center gap-2 m-sm font-bold text-slate-800">
                    <ShieldCheck className="h-4 w-4 text-sky-500" /> {role.nama}
                  </p>
                  <p className="m-tiny text-slate-400">{role.desc}</p>
                </td>
                {PERMISSIONS.map((perm) => {
                  const on = (matrix[role.kode] ?? []).includes(perm.kode);
                  return (
                    <td key={perm.kode} className="px-4 py-3 text-center">
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={`${role.nama}: ${perm.nama}`}
                        onClick={() => toggle(role.kode, perm.kode)}
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition",
                          on ? "border-sky-500 bg-sky-500 text-white" : "border-slate-200 text-transparent hover:border-slate-300",
                        )}
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
