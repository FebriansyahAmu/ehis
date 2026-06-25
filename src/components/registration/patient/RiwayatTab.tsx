"use client";

// Isi tab "Riwayat" di PatientRightPanel — GABUNGAN alur + riwayat kunjungan jadi satu pohon
// perjalanan vertikal. Tiap node = satu kunjungan (urut terbaru dulu); node berurutan
// menggambarkan alur unit (mis. IGD → Rawat Inap). Tiap node EXPANDABLE (default terbuka)
// menampilkan detail: Penjamin (Umum/BPJS/…), No. SEP bila JKN (BPJS), asal (caraMasuk),
// diagnosa, dan cabang order layanan (Lab/Rad/Farmasi). Node teratas/aktif = "Posisi Terkini".

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown,
  Hash,
  FileText,
  ArrowRight,
  CornerDownRight,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster, KunjunganRecord } from "@/lib/data";
import { UNIT_CFG, kunjunganStatusView } from "./config";

/** JKN = peserta BPJS (punya No. SEP). Penjamin string dari adapter: "BPJS Non-PBI"/"BPJS PBI". */
function isJKN(penjamin?: string): boolean {
  const p = (penjamin ?? "").toUpperCase();
  return p.includes("BPJS") || p.includes("JKN");
}

/** Identitas stabil per kunjungan untuk key + state collapse. */
const visitKey = (k: KunjunganRecord) => k.id || k.noKunjungan;

export function RiwayatTab({ patient }: { patient: PatientMaster }) {
  const visits = patient.riwayatKunjungan;
  // Default SEMUA terbuka → lacak yang DI-collapse (bukan yang di-expand).
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Posisi terkini = kunjungan aktif bila ada, else teratas (list di-urut terbaru dulu).
  const latestKey = useMemo(() => {
    const latest = visits.find((k) => k.status === "Aktif") ?? visits[0];
    return latest ? visitKey(latest) : "";
  }, [visits]);

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <ClipboardList size={24} className="text-slate-200" />
        <p className="text-xs text-slate-400">Belum ada pendaftaran</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="relative">
        {visits.map((k, i) => {
          const key = visitKey(k);
          return (
            <JourneyNode
              key={key}
              k={k}
              isLast={i === visits.length - 1}
              isLatest={key === latestKey}
              open={!collapsed.has(key)}
              onToggle={() => toggle(key)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Node perjalanan (expandable, default terbuka) ────────────

function JourneyNode({
  k,
  isLast,
  isLatest,
  open,
  onToggle,
}: {
  k: KunjunganRecord;
  isLast: boolean;
  isLatest: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const uc = UNIT_CFG[k.unit];
  const UIcon = uc.icon;
  const sv = kunjunganStatusView(k);
  const orders = k.orderedServices ?? [];
  const asal = k.caraMasuk?.trim();
  const rujukan = k.dokumen?.rujukan === "Ada";
  const jkn = isJKN(k.penjamin);

  return (
    <div className="relative flex gap-3 pb-3 last:pb-0">
      {/* Rail: dot unit + connector */}
      <div className="relative flex shrink-0 flex-col items-center">
        <span className={cn("z-10 flex h-7 w-7 items-center justify-center rounded-lg ring-2 ring-white", uc.bg)}>
          <UIcon size={12} className={uc.text} />
        </span>
        {!isLast && <span className="mt-1 w-0.5 flex-1 rounded-full bg-slate-200" />}
      </div>

      {/* Kartu node */}
      <div
        className={cn(
          "min-w-0 flex-1 overflow-hidden rounded-xl border bg-white",
          isLatest ? "border-sky-200 ring-1 ring-sky-100" : "border-slate-100",
        )}
      >
        {/* Header (klik = expand/collapse) */}
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center gap-1.5 px-2.5 py-2 text-left transition hover:bg-slate-50/70"
        >
          <span className="text-[11px] font-bold text-slate-800">{k.unit}</span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", sv.badge)}>{sv.label}</span>
          {isLatest && (
            <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">Posisi Terkini</span>
          )}
          <span className="ml-auto shrink-0 text-[9px] text-slate-400">{k.tanggal}</span>
          <ChevronDown
            size={12}
            className={cn("shrink-0 text-slate-300 transition-transform duration-200", open && "rotate-180")}
          />
        </button>

        {/* Detail (default terbuka) */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-2 border-t border-slate-100 px-2.5 pb-2.5 pt-2">
                {/* Penjamin + No. SEP (bila JKN) */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span className="text-[10px] text-slate-400">Penjamin</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                      jkn ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {jkn && <ShieldCheck size={9} />}
                    {k.penjamin ?? "—"}
                  </span>
                  {jkn && k.noPenjamin && (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-slate-400">
                      <Hash size={9} /> {k.noPenjamin}
                    </span>
                  )}
                  {jkn && k.noSEP && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-emerald-700">
                      <FileText size={8} /> SEP {k.noSEP}
                    </span>
                  )}
                </div>

                {/* Asal / rujukan */}
                {(asal || rujukan) && (
                  <div className="flex flex-wrap items-center gap-1">
                    {asal && (
                      <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600">
                        <CornerDownRight size={9} className="mr-0.5 inline" />
                        {asal}
                      </span>
                    )}
                    {rujukan && (
                      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                        Rujukan
                      </span>
                    )}
                  </div>
                )}

                {/* Diagnosa */}
                {k.diagnosa && k.diagnosa !== "—" && (
                  <p className="line-clamp-2 text-[11px] leading-snug text-slate-600">{k.diagnosa}</p>
                )}

                {/* Order layanan (cabang) */}
                {orders.length > 0 && (
                  <div className="space-y-1 border-l border-dashed border-slate-200 pl-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Order Layanan</p>
                    {orders.map((svc) => {
                      const sc = UNIT_CFG[svc.unit];
                      const SIcon = sc.icon;
                      return (
                        <div key={svc.unit} className="flex items-center gap-1.5">
                          <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded", sc.bg)}>
                            <SIcon size={8} className={sc.text} />
                          </span>
                          <span className="text-[10px] font-medium text-slate-600">{svc.unit}</span>
                          <span
                            className={cn(
                              "ml-auto rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                              svc.selesai ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
                            )}
                          >
                            {svc.selesai ? "Selesai" : "Proses"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Lihat detail */}
                {k.detailPath && (
                  <Link
                    href={k.detailPath}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 transition hover:text-indigo-800"
                  >
                    Lihat detail <ArrowRight size={9} />
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
