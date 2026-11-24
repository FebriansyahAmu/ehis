"use client";

// Satu kode ruangan/SMF penjamin (mis. BPJS "INT — Penyakit Dalam") beserta ruangan RS yang
// terhubung sebagai chip. Chip: status = tombol toggle (aria-pressed, teks Aktif/Nonaktif — bukan
// warna saja) + tombol lepas. Kode tanpa mapping aktif ditandai "Belum dipetakan" (amber).

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { MappingRuanganRecord, PenjaminKelas } from "@/lib/master/penjaminStore";
import { LOC_BY_ID, kelasLokasi, locType } from "./prShared";
import { RuanganCombobox } from "./RuanganCombobox";

export function KodeRuanganCard({ kelas, mappings, onToggle, onRemove, onAdd }: {
  kelas: PenjaminKelas;
  /** Mapping milik kode ini (sudah tersaring status bila filter aktif). */
  mappings: MappingRuanganRecord[];
  onToggle: (m: MappingRuanganRecord) => void;
  onRemove: (m: MappingRuanganRecord) => void;
  onAdd: (kelasId: string, ruanganId: string) => void;
}) {
  const aktif = mappings.filter((m) => m.status === "Aktif").length;
  const kosong = aktif === 0;
  const terhubung = new Set(mappings.map((m) => m.ruanganId));
  const kodeLabel = `${kelas.kode} — ${kelas.nama}`;

  return (
    <article
      aria-label={kodeLabel}
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-white p-3.5 shadow-xs transition-[border-color,box-shadow] hover:shadow-sm",
        kosong ? "border-amber-200" : "border-slate-200",
      )}
    >
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", kosong ? "bg-amber-400" : "bg-emerald-500")} />

      <header className="flex items-start gap-2.5 pl-1">
        <span className="shrink-0 rounded-md bg-slate-900 px-1.5 py-0.5 font-mono m-xs font-bold tracking-wide text-white">
          {kelas.kode}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="truncate m-sm font-semibold text-slate-900">{kelas.nama}</h4>
          {kelas.deskripsi && <p className="truncate m-tiny text-slate-500">{kelas.deskripsi}</p>}
        </div>
        {kosong ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 m-tiny font-semibold text-amber-800 ring-1 ring-amber-200">
            <AlertCircle className="size-3" aria-hidden="true" /> Belum dipetakan
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 m-tiny font-semibold tabular-nums text-emerald-800 ring-1 ring-emerald-200">
            {aktif} ruangan
          </span>
        )}
      </header>

      <ul aria-label={`Ruangan terhubung ke ${kelas.kode}`} className="flex flex-wrap items-center gap-1.5 pl-1">
        <AnimatePresence initial={false}>
          {mappings.map((m) => {
            const loc = LOC_BY_ID.get(m.ruanganId);
            const t = locType(loc?.locationType ?? "");
            const Icon = t.icon;
            const on = m.status === "Aktif";
            const nama = loc?.name ?? "Ruangan tidak ditemukan";
            const kls = loc ? kelasLokasi(loc) : null;
            return (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "inline-flex max-w-full items-center gap-1.5 rounded-lg border py-1 pr-1 pl-2 transition-colors",
                  on ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50",
                )}
              >
                <Icon className={cn("size-3.5 shrink-0", on ? "text-emerald-600" : "text-slate-400")} aria-hidden="true" />
                <span className="min-w-0 truncate">
                  <span className={cn("m-xs font-medium", on ? "text-slate-800" : "text-slate-500 line-through decoration-slate-300")}>
                    {nama}
                  </span>
                  <span className="ml-1 font-mono m-tiny text-slate-400">
                    {loc?.kode}{kls ? ` · ${kls}` : ""}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onToggle(m)}
                  aria-pressed={on}
                  aria-label={`Mapping aktif: ${nama}`}
                  title={on ? "Nonaktifkan mapping" : "Aktifkan mapping"}
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 m-mini font-bold uppercase tracking-wide transition",
                    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600",
                    on ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "bg-slate-200 text-slate-600 hover:bg-slate-300",
                  )}
                >
                  {on ? "Aktif" : "Nonaktif"}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(m)}
                  aria-label={`Lepas ${nama} dari ${kelas.kode}`}
                  title="Lepas ruangan"
                  className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-rose-600"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
        <li>
          <RuanganCombobox
            kodeLabel={kodeLabel}
            terhubung={terhubung}
            onPick={(ruanganId) => onAdd(kelas.id, ruanganId)}
            compact={mappings.length > 0}
          />
        </li>
      </ul>
    </article>
  );
}
