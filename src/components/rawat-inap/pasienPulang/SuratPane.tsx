"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type JenisSurat, type PasienPulangData, type SuratPulang,
} from "./pasienPulangShared";

type Props = {
  data:     PasienPulangData;
  onChange: (d: PasienPulangData) => void;
};

const SURAT_INFO: Record<JenisSurat, { icon: string; priority: "wajib" | "opsional" | "kondisional" }> = {
  "Surat Kontrol":            { icon: "📋", priority: "wajib"      },
  "Surat Keterangan Sakit":   { icon: "🏥", priority: "opsional"   },
  "Surat Keterangan Dirawat": { icon: "📄", priority: "opsional"   },
  "Surat Rujukan Balik":      { icon: "↩️", priority: "kondisional" },
  "Surat Kematian":           { icon: "📝", priority: "kondisional" },
};

const PRIORITY_CONFIG: Record<"wajib" | "opsional" | "kondisional", { badge: string; label: string }> = {
  wajib:       { badge: "bg-red-100 text-red-700",    label: "Wajib"       },
  opsional:    { badge: "bg-slate-100 text-slate-500", label: "Opsional"    },
  kondisional: { badge: "bg-amber-100 text-amber-700", label: "Kondisional" },
};

function isVisible(surat: SuratPulang, data: PasienPulangData): boolean {
  if (surat.jenis === "Surat Rujukan Balik") return data.adaRujukanFKTP;
  if (surat.jenis === "Surat Kematian")      return data.status === "Meninggal";
  return true;
}

function SuratCard({
  surat, data, onChange,
}: {
  surat:    SuratPulang;
  data:     PasienPulangData;
  onChange: (updated: SuratPulang) => void;
}) {
  const info     = SURAT_INFO[surat.jenis];
  const priority = PRIORITY_CONFIG[info.priority];

  function terbitkan() {
    const now = new Date().toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    onChange({ ...surat, diterbitkan: true, diterbitkanAt: now });
  }

  function batalkan() {
    onChange({ ...surat, diterbitkan: false, diterbitkanAt: "" });
  }

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border p-4 transition-all duration-200",
        surat.diterbitkan
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg leading-none">{info.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[13px] font-semibold text-slate-700">{surat.jenis}</p>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide", priority.badge)}>
              {priority.label}
            </span>
            {surat.diterbitkan && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                <CheckCircle2 size={8} /> Diterbitkan
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">{surat.keterangan}</p>
          {surat.diterbitkan && surat.diterbitkanAt && (
            <p className="mt-1 text-[10px] text-emerald-600">Diterbitkan: {surat.diterbitkanAt}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {surat.diterbitkan ? (
            <>
              <button
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <Printer size={11} /> Cetak
              </button>
              <button
                onClick={batalkan}
                className="rounded-lg px-2.5 py-1.5 text-[11px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                Batalkan
              </button>
            </>
          ) : (
            <button
              onClick={terbitkan}
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-orange-600 active:scale-95"
            >
              Terbitkan
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function SuratPane({ data, onChange }: Props) {
  function updateSurat(updated: SuratPulang) {
    onChange({ ...data, surat: data.surat.map(s => s.id === updated.id ? updated : s) });
  }

  const visible   = data.surat.filter(s => isVisible(s, data));
  const hidden    = data.surat.filter(s => !isVisible(s, data));
  const issued    = visible.filter(s => s.diterbitkan).length;
  const wajibList = visible.filter(s => SURAT_INFO[s.jenis].priority === "wajib");
  const wajibDone = wajibList.filter(s => s.diterbitkan).length;

  return (
    <div className="flex flex-col gap-4 xl:flex-row">

      {/* ── Left: Surat list ── */}
      <div className="min-w-0 flex-1 space-y-3">

        {/* Context note */}
        {hidden.length > 0 && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
            <p className="text-[11px] text-slate-500">
              {hidden.map(s => s.jenis).join(" dan ")} tidak ditampilkan karena kondisi tidak relevan
              {data.status !== "Meninggal" && !data.adaRujukanFKTP && " (status bukan Meninggal, tidak ada rujukan FKTP)"}.
            </p>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
            <FileText size={24} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-400">Tidak ada surat yang relevan untuk status kepulangan ini</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(surat => (
              <SuratCard key={surat.id} surat={surat} data={data} onChange={updateSurat} />
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Summary sidebar ── */}
      <div className="w-full shrink-0 xl:w-64">
        <div className="space-y-3">

          {/* Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress Surat</p>
            <div className="mb-2 flex items-end justify-between">
              <p className="text-2xl font-bold text-slate-800">{issued}</p>
              <p className="text-[11px] text-slate-400">dari {visible.length} surat</p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: visible.length > 0 ? `${Math.round((issued / visible.length) * 100)}%` : "0%" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            {wajibList.length > 0 && (
              <p className={cn(
                "mt-2 text-[11px] font-semibold",
                wajibDone === wajibList.length ? "text-emerald-600" : "text-amber-600",
              )}>
                {wajibDone === wajibList.length
                  ? "Semua surat wajib sudah diterbitkan"
                  : `Surat wajib: ${wajibDone}/${wajibList.length} selesai`
                }
              </p>
            )}
          </div>

          {/* Status list */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status Surat</p>
            <div className="space-y-2">
              {visible.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                  {s.diterbitkan
                    ? <CheckCircle2 size={11} className="shrink-0 text-emerald-500" />
                    : <div className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        SURAT_INFO[s.jenis].priority === "wajib" ? "bg-red-300" : "bg-slate-300",
                      )} />
                  }
                  <p className={cn(
                    "truncate text-[11px]",
                    s.diterbitkan ? "text-slate-400 line-through" : "text-slate-700",
                  )}>
                    {s.jenis}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Info panel */}
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
            <p className="text-[10px] font-semibold text-sky-700">Catatan</p>
            <p className="mt-1 text-[10px] text-sky-600">
              Surat yang sudah diterbitkan dapat dicetak langsung dari sistem. Pastikan Surat Kontrol selalu diberikan kepada setiap pasien yang pulang.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
