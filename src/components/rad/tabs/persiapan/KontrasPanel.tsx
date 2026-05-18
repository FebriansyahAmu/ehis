"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { type KontrasInfo, type KontrasJenis } from "../../radShared";

// ── Kontraindikasi warning ────────────────────────────────

const KONTRAINDIKASI = [
  "GFR < 30 mL/min (risiko CIN)",
  "Riwayat alergi berat kontras iodinasi",
  "Penggunaan metformin (tahan 48 jam pasca CT)",
  "Miastenia gravis (kontraindikasi relatif)",
  "Hipertiroid tidak terkontrol",
];

const JENIS_OPTS: { value: KontrasJenis; label: string; sub: string }[] = [
  { value: "Iodinasi_IV",    label: "Iodinasi IV",    sub: "CT, Angiografi"    },
  { value: "Iodinasi_Oral",  label: "Iodinasi Oral",  sub: "CT Abdomen, GI"   },
  { value: "Iodinasi_Rektal",label: "Iodinasi Rektal",sub: "Colon in Loop"     },
  { value: "Gadolinium",     label: "Gadolinium",     sub: "MRI"               },
];

// ── Main ──────────────────────────────────────────────────

interface KontrasPanelProps {
  kontras: KontrasInfo;
  onChange: (k: KontrasInfo) => void;
  locked?: boolean;
}

export default function KontrasPanel({ kontras, onChange, locked = false }: KontrasPanelProps) {
  const upd = (patch: Partial<KontrasInfo>) => onChange({ ...kontras, ...patch });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} className="shrink-0 text-amber-600" />
        <p className="text-sm font-bold text-amber-800">Manajemen Media Kontras</p>
        <span className="ml-auto text-[10px] text-amber-600">ACR Manual on Contrast Media · PMK 24/2020</span>
      </div>

      {/* Jenis kontras */}
      <div>
        <p className="mb-2 text-[11px] font-bold text-slate-600">Jenis Kontras</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {JENIS_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={locked}
              onClick={() => upd({ jenis: opt.value })}
              className={cn(
                "rounded-xl border p-2.5 text-left text-[11px] transition-all",
                kontras.jenis === opt.value
                  ? "border-amber-400 bg-amber-100 shadow-sm"
                  : "border-slate-200 bg-white hover:border-amber-300",
                locked && "opacity-60 cursor-not-allowed",
              )}
            >
              <p className="font-bold text-slate-800">{opt.label}</p>
              <p className="text-[10px] text-slate-400">{opt.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Dosis + kecepatan */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-600">Dosis / Volume</label>
          <input
            type="text"
            disabled={locked}
            placeholder="mis. 80 mL"
            value={kontras.dosis ?? ""}
            onChange={(e) => upd({ dosis: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:opacity-60"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-600">Kecepatan Injeksi</label>
          <input
            type="text"
            disabled={locked}
            placeholder="mis. 2.5 mL/s"
            value={kontras.kecepatan ?? ""}
            onChange={(e) => upd({ kecepatan: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Toggles: premedikasi + konsent */}
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          { key: "premedikasi",   label: "Premedikasi Diberikan",       sub: "Steroid 13-7-1 jam + difenhidramin"  },
          { key: "konsentSigned", label: "Informed Consent Ditandatangani", sub: "Formulir kontras + risiko"       },
        ] as { key: keyof KontrasInfo; label: string; sub: string }[]).map(({ key, label, sub }) => {
          const val = kontras[key] as boolean;
          return (
            <button
              key={key}
              type="button"
              disabled={locked}
              onClick={() => upd({ [key]: !val })}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                val
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-emerald-200",
                locked && "opacity-60 cursor-not-allowed",
              )}
            >
              <div className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                val ? "border-emerald-500 bg-emerald-500" : "border-slate-300",
              )}>
                {val && <CheckCircle2 size={13} className="text-white" />}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-700">{label}</p>
                <p className="text-[10px] text-slate-400">{sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Reaksi intra-prosedur */}
      <div>
        <label className="mb-2 block text-[11px] font-bold text-slate-600">Reaksi Intra-Prosedur</label>
        <div className="flex flex-wrap gap-2">
          {(["Tidak Ada", "Ringan", "Sedang", "Berat"] as const).map((grade) => (
            <button
              key={grade}
              type="button"
              disabled={locked}
              onClick={() => upd({ reaksiIntra: grade })}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-semibold transition-all",
                kontras.reaksiIntra === grade
                  ? grade === "Tidak Ada"
                    ? "border-emerald-400 bg-emerald-500 text-white"
                    : grade === "Ringan"
                    ? "border-amber-400 bg-amber-500 text-white"
                    : grade === "Sedang"
                    ? "border-orange-400 bg-orange-500 text-white"
                    : "border-rose-400 bg-rose-500 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                locked && "opacity-60 cursor-not-allowed",
              )}
            >
              {grade}
            </button>
          ))}
        </div>
        {kontras.reaksiIntra !== "Tidak Ada" && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2">
            <AlertTriangle size={12} className="mt-0.5 shrink-0 text-rose-600" />
            <p className="text-[11px] text-rose-700 font-medium">
              Dokumentasikan reaksi di CPPT dan laporkan ke DPJP. Siapkan protokol penanganan anafilaksis.
            </p>
          </div>
        )}
      </div>

      {/* Kontraindikasi checklist */}
      <div className="rounded-xl border border-amber-200 bg-white p-3">
        <div className="flex items-center gap-2 mb-2">
          <Info size={12} className="text-amber-600" />
          <p className="text-[10px] font-bold text-amber-700">Periksa Kontraindikasi</p>
        </div>
        <ul className="flex flex-col gap-1">
          {KONTRAINDIKASI.map((k) => (
            <li key={k} className="flex items-start gap-2 text-[10px] text-slate-600">
              <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full border border-amber-300 bg-amber-50" />
              {k}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
