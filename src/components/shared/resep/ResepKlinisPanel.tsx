"use client";

import { Activity, Baby, AlertTriangle, Droplets, ShieldAlert } from "lucide-react";
import { Select } from "@/components/shared/inputs/Select";
import { cn } from "@/lib/utils";
import {
  GINJAL_OPTIONS, MENYUSUI_OPTIONS, KEHAMILAN_OPTIONS, KONDISI_NETRAL,
  type KondisiKlinis,
} from "./resepShared";

// ── Kondisi klinis pasien (decision support peresepan) ────

function isNetral(field: keyof KondisiKlinis, v: string) {
  return v === KONDISI_NETRAL[field];
}

export function KondisiKlinisPanel({
  gender, value, onChange,
}: {
  gender?: "L" | "P";
  value: KondisiKlinis;
  onChange: (next: KondisiKlinis) => void;
}) {
  const showWanita = gender !== "L"; // tampilkan kehamilan & menyusui untuk perempuan / gender tak diketahui
  const set = <K extends keyof KondisiKlinis>(k: K, v: string) => onChange({ ...value, [k]: v });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-2.5 flex items-center gap-1.5">
        <Activity size={13} className="text-teal-500" />
        <p className="text-xs font-semibold text-slate-700">Kondisi Klinis Pasien</p>
        <span className="text-slate-300">·</span>
        <span className="text-[11px] text-slate-400">memengaruhi dosis &amp; keamanan obat</span>
      </div>

      <div className={cn("grid grid-cols-1 gap-3", showWanita ? "sm:grid-cols-3" : "sm:grid-cols-1")}>
        <div>
          <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <Droplets size={11} className="text-slate-400" /> Fungsi Ginjal
          </p>
          <Select
            value={value.ginjal}
            onChange={(v) => set("ginjal", v)}
            options={[...GINJAL_OPTIONS]}
            className={cn(!isNetral("ginjal", value.ginjal) && "border-amber-300 bg-amber-50/40")}
          />
        </div>

        {showWanita && (
          <>
            <div>
              <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <Baby size={11} className="text-slate-400" /> Status Kehamilan
              </p>
              <Select
                value={value.kehamilan}
                onChange={(v) => set("kehamilan", v)}
                options={[...KEHAMILAN_OPTIONS]}
                className={cn(value.kehamilan.startsWith("Hamil") && "border-rose-300 bg-rose-50/40")}
              />
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <Baby size={11} className="text-slate-400" /> Status Menyusui
              </p>
              <Select
                value={value.menyusui}
                onChange={(v) => set("menyusui", v)}
                options={[...MENYUSUI_OPTIONS]}
                className={cn(value.menyusui === "Sedang Menyusui" && "border-rose-300 bg-rose-50/40")}
              />
            </div>
          </>
        )}
      </div>

      {(value.kehamilan.startsWith("Hamil") || value.menyusui === "Sedang Menyusui") && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-rose-600">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
          Perhatikan kategori keamanan obat untuk {value.kehamilan.startsWith("Hamil") ? "kehamilan" : "ibu menyusui"}.
        </p>
      )}
    </div>
  );
}

// ── Banner alergi obat (dari anamnesis) ───────────────────

export function AlergiObatBanner({ allergens }: { allergens: string[] }) {
  if (allergens.length === 0) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
      <ShieldAlert size={13} className="mt-0.5 shrink-0 text-rose-500" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-rose-600">Alergi Obat Tercatat</p>
        <p className="text-[11px] text-rose-700">
          {allergens.join(" · ")}
          <span className="ml-1 font-normal text-rose-400">— sistem memperingatkan bila obat sejenis dipilih</span>
        </p>
      </div>
    </div>
  );
}

// ── Peringatan inline saat obat terpilih cocok alergen ────

export function AlergiMatchWarning({ allergen, reactions = [] }: { allergen: string; reactions?: string[] }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 ring-1 ring-rose-200">
      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-600" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-rose-700">
          <span className="font-bold">Peringatan alergi:</span> obat ini berpotensi memicu reaksi alergi
          terhadap <span className="font-bold">{allergen}</span> yang tercatat pada anamnesis pasien.
          Pastikan indikasi &amp; pertimbangkan alternatif.
        </p>
        {reactions.length > 0 && (
          <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-rose-700">
            <span className="font-semibold uppercase tracking-wide">Efek tercatat:</span>
            {reactions.map((r) => (
              <span key={r} className="rounded bg-rose-200/70 px-1.5 py-0.5 font-medium">{r}</span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
