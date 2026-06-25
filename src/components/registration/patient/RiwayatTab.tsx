"use client";

// Isi tab "Riwayat" — GABUNGAN alur + riwayat kunjungan jadi satu pohon perjalanan vertikal.
// Tiap node = satu kunjungan (urut terbaru dulu); node berurutan menggambarkan alur unit
// (mis. IGD → Rawat Inap). Node teratas/aktif dirender LEBIH BESAR (spotlight "Kunjungan
// Terakhir"). Tiap node EXPANDABLE (default terbuka) menampilkan: Penjamin (Umum/BPJS/…),
// No. SEP bila JKN, DPJP, asal (caraMasuk), diagnosa, cabang order layanan, dan KETERANGAN
// SPRI bila kunjungan sudah diterbitkan SPRI (walau No. Referensi belum ada).

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown,
  Hash,
  FileText,
  FileCheck2,
  ArrowRight,
  CornerDownRight,
  ClipboardList,
  ShieldCheck,
  Stethoscope,
  MapPin,
  DoorOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster, KunjunganRecord } from "@/lib/data";
import type { SpriDTO } from "@/lib/api/spri/spri";
import { UNIT_CFG, kunjunganStatusView } from "./config";

/** JKN = peserta BPJS (punya No. SEP). Penjamin string dari adapter: "BPJS Non-PBI"/"BPJS PBI". */
function isJKN(penjamin?: string): boolean {
  const p = (penjamin ?? "").toUpperCase();
  return p.includes("BPJS") || p.includes("JKN");
}

/** Identitas stabil per kunjungan untuk key + state collapse. */
const visitKey = (k: KunjunganRecord) => k.id || k.noKunjungan;

interface RiwayatTabProps {
  patient: PatientMaster;
  /** SPRI per kunjungan (key = kunjunganId IGD asal / riKunjunganId RI). Dari worklist admisi. */
  spriByKunjungan?: Record<string, SpriDTO>;
}

export function RiwayatTab({ patient, spriByKunjungan }: RiwayatTabProps) {
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
              spri={k.id ? spriByKunjungan?.[k.id] : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Node perjalanan (expandable, default terbuka; latest = lebih besar) ───────

function JourneyNode({
  k,
  isLast,
  isLatest,
  open,
  onToggle,
  spri,
}: {
  k: KunjunganRecord;
  isLast: boolean;
  isLatest: boolean;
  open: boolean;
  onToggle: () => void;
  spri?: SpriDTO;
}) {
  const uc = UNIT_CFG[k.unit];
  const UIcon = uc.icon;
  const sv = kunjunganStatusView(k);
  const orders = k.orderedServices ?? [];
  const asal = k.caraMasuk?.trim();
  const rujukan = k.dokumen?.rujukan === "Ada";
  const jkn = isJKN(k.penjamin);
  const dpjp = k.dokter && k.dokter !== "—" ? k.dokter : null;
  const ruangan = k.ruangan?.trim();
  const spriHasRef = !!spri?.noReferensi;

  return (
    <div className={cn("relative flex gap-3", isLatest ? "pb-4 last:pb-0" : "pb-3 last:pb-0")}>
      {/* Rail: dot unit + connector (latest = lebih besar) */}
      <div className="relative flex shrink-0 flex-col items-center">
        <span
          className={cn(
            "z-10 flex items-center justify-center rounded-lg ring-2 ring-white",
            isLatest ? "h-9 w-9" : "h-7 w-7",
            uc.bg,
          )}
        >
          <UIcon size={isLatest ? 16 : 12} className={uc.text} />
        </span>
        {!isLast && <span className="mt-1 w-0.5 flex-1 rounded-full bg-slate-200" />}
      </div>

      {/* Kartu node */}
      <div
        className={cn(
          "min-w-0 flex-1 overflow-hidden rounded-xl border",
          isLatest ? "border-sky-200 bg-sky-50/40 shadow-xs ring-1 ring-sky-100" : "border-slate-100 bg-white",
        )}
      >
        {/* Header: toggle expand/collapse + tombol Buka Rekam Medis (di bagian atas tiap node) */}
        <div className={cn("flex items-start gap-1.5", isLatest ? "px-3 py-2.5" : "px-2.5 py-2")}>
          <button
            onClick={onToggle}
            aria-expanded={open}
            className="flex min-w-0 flex-1 cursor-pointer items-start gap-1.5 rounded-md text-left transition hover:bg-black/[0.02]"
          >
            <div className="min-w-0 flex-1">
              {isLatest && (
                <p className="mb-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-sky-600">
                  <MapPin size={9} /> Kunjungan Terakhir
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn("font-bold text-slate-800", isLatest ? "text-sm" : "text-[11px]")}>{k.unit}</span>
                {ruangan && (
                  <span className={cn("inline-flex items-center gap-0.5 font-bold text-teal-700", isLatest ? "text-sm" : "text-[11px]")}>
                    <span className="text-slate-300">·</span>
                    <DoorOpen size={isLatest ? 13 : 11} /> {ruangan}
                  </span>
                )}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", sv.badge)}>{sv.label}</span>
                {spri && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                      spriHasRef ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                    )}
                  >
                    <FileCheck2 size={8} /> SPRI
                  </span>
                )}
                {!isLatest && <span className="ml-auto shrink-0 text-[9px] text-slate-400">{k.tanggal}</span>}
              </div>
              {isLatest && (
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {k.tanggal} · <span className="font-mono">{k.noKunjungan}</span>
                </p>
              )}
            </div>
          </button>

          {/* Buka Rekam Medis → worklist klinis unit (modul perawatan), tab baru */}
          {k.klinisPath && (
            <Link
              href={k.klinisPath}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka Rekam Medis di modul perawatan"
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-lg border border-indigo-200 bg-white font-semibold text-indigo-700 shadow-xs transition hover:border-indigo-300 hover:bg-indigo-50 active:scale-95",
                isLatest ? "px-2 py-1 text-[10px]" : "px-1.5 py-1 text-[9px]",
              )}
            >
              <FileText size={isLatest ? 12 : 10} />
              Rekam Medis
            </Link>
          )}

          <button
            onClick={onToggle}
            aria-label={open ? "Tutup detail" : "Buka detail"}
            className="shrink-0 cursor-pointer pt-0.5 text-slate-300 transition hover:text-slate-500"
          >
            <ChevronDown
              size={12}
              className={cn("transition-transform duration-200", open && "rotate-180")}
            />
          </button>
        </div>

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
              <div
                className={cn(
                  "space-y-2 border-t pt-2",
                  isLatest ? "border-sky-100 px-3 pb-3" : "border-slate-100 px-2.5 pb-2.5",
                )}
              >
                {/* Keterangan SPRI (sudah diterbitkan — walau No. Referensi belum ada) */}
                {spri && (
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2 py-1.5",
                      spriHasRef ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                        spriHasRef ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600",
                      )}
                    >
                      <FileCheck2 size={12} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[10px] font-bold", spriHasRef ? "text-emerald-800" : "text-amber-800")}>
                        SPRI Diterbitkan{spri.status === "Dikonsumsi" ? " · Teradmisi" : ""}
                      </p>
                      <p
                        className={cn(
                          "truncate font-mono text-[9px]",
                          spriHasRef ? "text-emerald-600" : "text-amber-700",
                        )}
                      >
                        {spriHasRef ? `No. Ref ${spri.noReferensi}` : "Menunggu No. Referensi BPJS"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/70 px-1.5 py-0.5 text-[8px] font-semibold text-slate-500">
                      {spri.jenisPerawatan}
                    </span>
                  </div>
                )}

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

                {/* DPJP + asal + rujukan */}
                {(dpjp || asal || rujukan) && (
                  <div className="flex flex-wrap items-center gap-1">
                    {dpjp && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                        <Stethoscope size={9} /> {dpjp}
                      </span>
                    )}
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
                  <p className={cn("leading-snug text-slate-600", isLatest ? "line-clamp-3 text-[11px]" : "line-clamp-2 text-[11px]")}>
                    {k.diagnosa}
                  </p>
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
