"use client";

import { useState } from "react";
import { Home, BedDouble, Truck, HeartOff, UserX, CheckCircle } from "lucide-react";
import type { IGDPatientDetail, Disposisi } from "@/app/lib/data";
import { cn } from "@/app/lib/utils";

const OPTIONS: {
  id: NonNullable<Disposisi>;
  label: string;
  desc: string;
  icon: React.ElementType;
  idle: string;
  active: string;
}[] = [
  { id: "Pulang",     label: "Pulang",     desc: "Pasien dipulangkan",        icon: Home,     idle: "hover:border-emerald-300 hover:bg-emerald-50", active: "border-emerald-400 bg-emerald-50 text-emerald-800" },
  { id: "Rawat_Inap", label: "Rawat Inap", desc: "Transfer ke rawat inap",    icon: BedDouble,idle: "hover:border-indigo-300 hover:bg-indigo-50",   active: "border-indigo-400 bg-indigo-50 text-indigo-800"   },
  { id: "Rujuk",      label: "Rujuk",      desc: "Dirujuk ke fasilitas lain", icon: Truck,    idle: "hover:border-amber-300 hover:bg-amber-50",     active: "border-amber-400 bg-amber-50 text-amber-800"      },
  { id: "APS",        label: "APS",        desc: "Atas permintaan sendiri",   icon: UserX,    idle: "hover:border-orange-300 hover:bg-orange-50",   active: "border-orange-400 bg-orange-50 text-orange-800"   },
  { id: "Meninggal",  label: "Meninggal",  desc: "Pasien meninggal",          icon: HeartOff, idle: "hover:border-rose-300 hover:bg-rose-50",       active: "border-rose-400 bg-rose-50 text-rose-800"         },
];

const LABEL_MAP: Record<NonNullable<Disposisi>, string> = {
  Pulang: "Pulang", Rawat_Inap: "Rawat Inap", Rujuk: "Dirujuk",
  APS: "Atas Permintaan Sendiri", Meninggal: "Meninggal",
};

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</p>;
}

function TextInput({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <input type="text" placeholder={placeholder}
        className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
    </div>
  );
}

export default function DisposisiTab({ patient }: { patient: IGDPatientDetail }) {
  const [selected, setSelected] = useState<NonNullable<Disposisi> | null>(
    patient.disposisi ?? null,
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Status banner */}
      {selected ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 shadow-sm">
          <CheckCircle size={15} className="shrink-0 text-emerald-600" />
          <p className="text-xs font-semibold text-emerald-800">
            Disposisi ditetapkan:&nbsp;<span>{LABEL_MAP[selected]}</span>
            <span className="ml-2 font-normal text-emerald-600">— dapat diubah jika diperlukan</span>
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 shadow-sm">
          <p className="text-xs font-medium text-amber-700">
            Disposisi belum ditetapkan — pilih keputusan akhir di bawah
          </p>
        </div>
      )}

      {/* Option cards */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-700">Keputusan Akhir IGD</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 lg:grid-cols-5">
          {OPTIONS.map(({ id, label, desc, icon: Icon, idle, active }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border-2 py-3 text-center transition",
                selected === id ? active : cn("border-slate-200 bg-white text-slate-500", idle),
              )}
            >
              <Icon size={18} className={selected === id ? "text-current" : "text-slate-400"} />
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-[10px] leading-tight opacity-60">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Conditional extra fields */}
      {(selected === "Rawat_Inap" || selected === "Rujuk") && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold text-slate-700">
            {selected === "Rawat_Inap" ? "Detail Rawat Inap" : "Detail Rujukan"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {selected === "Rawat_Inap" ? (
              <>
                <TextInput label="Ruangan / Bangsal Tujuan" placeholder="Contoh: ICU, Bedah Umum..." />
                <TextInput label="Kelas Rawat" placeholder="Kelas 1 / 2 / 3 / VIP" />
              </>
            ) : (
              <TextInput label="Fasilitas Tujuan Rujukan" placeholder="Nama rumah sakit tujuan..." />
            )}
          </div>
        </div>
      )}

      {/* Notes + Save */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Label>Catatan Tambahan</Label>
        <textarea rows={3} placeholder="Catatan disposisi..."
          className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
        <div className="mt-3 flex justify-end">
          <button type="button"
            className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700">
            Simpan Disposisi
          </button>
        </div>
      </div>
    </div>
  );
}
