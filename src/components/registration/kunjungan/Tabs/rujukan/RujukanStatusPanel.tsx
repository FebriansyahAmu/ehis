"use client";

// Panel status Rujukan ⇄ SEP (tab Surat Rujukan). Menampilkan rujukan tertaut, SEP aktif, dan
// diagnosa klinis terkini; mendeteksi ketidaksesuaian SEP.diagAwal vs Rujukan.diagnosaKode dan
// menawarkan "Sinkronkan" satu klik → SEP tetap sesuai rujukan & diagnosa (jawaban case-2).

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, FileText, Info, Link2, Loader2,
  RefreshCw, ShieldCheck, Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getIcdName } from "./rujukanTypes";
import type { RujukanLinkState } from "./useRujukanLink";

// ─── Mini card ────────────────────────────────────────────────

function MiniCard({
  icon: Icon, label, value, sub, tone = "slate",
}: {
  icon: IconComponent;
  label: string;
  value: string;
  sub?: string;
  tone?: "slate" | "emerald" | "sky" | "amber";
}) {
  const toneCls = {
    slate:   "text-slate-400",
    emerald: "text-emerald-500",
    sky:     "text-sky-500",
    amber:   "text-amber-500",
  }[tone];
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon size={11} className={cn("shrink-0", toneCls)} />
        <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      </div>
      <p className="mt-1 truncate text-[11px] font-bold text-slate-700" title={value}>{value}</p>
      {sub && <p className="truncate text-[9.5px] text-slate-400" title={sub}>{sub}</p>}
    </div>
  );
}

// ─── RujukanStatusPanel ───────────────────────────────────────

export function RujukanStatusPanel({ state }: { state: RujukanLinkState }) {
  const { loading, rujukan, sep, primaryDx, linking, err, link } = state;

  const rujukanDx = rujukan?.diagnosaKode ?? null;
  const sepDiag   = sep?.diagAwal ?? null;

  // Drift utama: SEP.diagAwal HARUS = Rujukan.diagnosaKode (aturan BPJS).
  const sepDrift  = !!sep && !!rujukan && (sepDiag ?? "") !== (rujukanDx ?? "");
  // Info lunak: diagnosa klinis terkini berbeda dari rujukan (pertimbangkan revisi rujukan).
  const clinicalDiff = !!primaryDx.kode && !!rujukanDx && primaryDx.kode !== rujukanDx;

  const outerTone = sepDrift
    ? "border-amber-200 bg-amber-50/50"
    : rujukan
      ? "border-emerald-200 bg-emerald-50/40"
      : "border-slate-200 bg-slate-50/60";

  const statusPill = sepDrift
    ? { cls: "bg-amber-100 text-amber-700 ring-amber-200", icon: AlertTriangle, label: "Perlu Sinkron" }
    : rujukan
      ? { cls: "bg-emerald-100 text-emerald-700 ring-emerald-200", icon: CheckCircle2, label: "Selaras" }
      : { cls: "bg-slate-100 text-slate-500 ring-slate-200", icon: Link2, label: "Belum Tertaut" };
  const PillIcon = statusPill.icon;

  const rujukanValue = rujukan
    ? rujukan.noRujukan
    : "Belum ada rujukan tertaut";
  const rujukanSub = rujukan
    ? (rujukanDx ? `${rujukanDx} — ${rujukan.diagnosaNama ?? getIcdName(rujukanDx)}` : "tanpa diagnosa")
    : "pilih / buat rujukan di bawah";

  const sepValue = sep ? (sep.noSep ?? "SEP draft (belum terbit)") : "SEP belum terbit";
  const sepSub   = sep ? (sepDiag ? `diagAwal: ${sepDiag} — ${getIcdName(sepDiag)}` : "diagAwal kosong") : "terbitkan di tab SEP / Ubah Penjamin";

  const dxValue = primaryDx.kode ? primaryDx.kode : "Belum terkoding";
  const dxSub   = primaryDx.kode ? (primaryDx.nama ?? getIcdName(primaryDx.kode)) : "diagnosa utama rekam medis";

  const handleSync = () => {
    if (!rujukan) return;
    link({
      sumber:      (rujukan.sumber as "RujukanMasuk" | "KontrolPascaRanap" | "RujukanIGD"),
      asalRujukan: (rujukan.asalRujukan === "Faskes2" ? "Faskes2" : "Faskes1"),
      noRujukan:   rujukan.noRujukan,
      tglRujukan:  rujukan.tglRujukan ?? undefined,
      ppkRujukan:  rujukan.ppkRujukan ?? undefined,
      diagnosaKode: rujukan.diagnosaKode ?? undefined,
      diagnosaNama: rujukan.diagnosaNama ?? undefined,
      poliTujuan:  rujukan.poliTujuan ?? undefined,
      noSepAsal:   rujukan.noSepAsal ?? undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-[11px] text-slate-400">
        <Loader2 size={13} className="animate-spin text-sky-500" /> Memuat status rujukan &amp; SEP…
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-2xl border p-3.5 transition-colors", outerTone)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200">
          <Link2 size={13} className="text-sky-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-slate-800">Status Rujukan &amp; SEP</p>
          <p className="text-[9.5px] text-slate-400">SEP tertaut pada satu rujukan — diagnosa harus selaras</p>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold ring-1", statusPill.cls)}>
          <PillIcon size={11} /> {statusPill.label}
        </span>
      </div>

      {/* Three mini-cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MiniCard icon={FileText}    label="Rujukan Tertaut"  value={rujukanValue} sub={rujukanSub} tone={rujukan ? "sky" : "slate"} />
        <MiniCard icon={ShieldCheck} label="SEP Aktif"        value={sepValue}     sub={sepSub}     tone={sep ? (sepDrift ? "amber" : "emerald") : "slate"} />
        <MiniCard icon={Stethoscope} label="Diagnosa Klinis"  value={dxValue}      sub={dxSub}      tone={primaryDx.kode ? "sky" : "slate"} />
      </div>

      {/* Drift banner — SEP tidak sesuai rujukan */}
      <AnimatePresence>
        {sepDrift && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertTriangle size={14} className="shrink-0 text-amber-600" />
              <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-amber-800">
                <span className="font-bold">SEP tidak sesuai rujukan.</span> diagAwal SEP (<span className="font-mono">{sepDiag ?? "—"}</span>){" "}
                ≠ diagnosa rujukan (<span className="font-mono">{rujukanDx ?? "—"}</span>).
              </p>
              <button
                type="button"
                onClick={handleSync}
                disabled={linking}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[10.5px] font-bold text-white transition hover:bg-amber-700 active:scale-95 disabled:opacity-60"
              >
                {linking ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                {linking ? "Menyinkronkan…" : "Sinkronkan"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Soft note — diagnosa klinis berbeda dari rujukan */}
      {!sepDrift && clinicalDiff && (
        <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2">
          <Info size={12} className="mt-px shrink-0 text-sky-500" />
          <p className="text-[10.5px] leading-relaxed text-sky-700">
            Diagnosa klinis terkini (<span className="font-mono">{primaryDx.kode}</span>) berbeda dari diagnosa rujukan
            (<span className="font-mono">{rujukanDx}</span>). Bila perlu, pilih/buat rujukan baru di bawah agar SEP mengikuti.
          </p>
        </div>
      )}

      {/* Error */}
      {err && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700 ring-1 ring-rose-100">
          <AlertTriangle size={13} className="shrink-0" /> {err}
        </div>
      )}
    </div>
  );
}
