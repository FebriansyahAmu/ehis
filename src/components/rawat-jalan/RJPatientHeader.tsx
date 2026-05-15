"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  X, CreditCard, Phone, Stethoscope, CalendarDays,
  ChevronRight, MapPin, Hash,
} from "lucide-react";
import type { RJPatientDetail, RJStatus } from "@/lib/data";
import { cn } from "@/lib/utils";
import { STATUS_CFG, POLI_CFG, PENJAMIN_CFG } from "./rjShared";

// ── Header status config ───────────────────────────────────

const HEADER_STATUS: Record<RJStatus, {
  stripe: string; topBar: string; identityWash: string; avatarRing: string; pulse?: boolean;
}> = {
  Menunggu_Skrining: { stripe: "bg-amber-400",   topBar: "bg-amber-50/50",   identityWash: "from-amber-50/30",   avatarRing: "ring-amber-200"   },
  Skrining:          { stripe: "bg-sky-500",      topBar: "bg-sky-50/50",     identityWash: "from-sky-50/30",     avatarRing: "ring-sky-200"     },
  Menunggu_Dokter:   { stripe: "bg-orange-500",   topBar: "bg-orange-50/50",  identityWash: "from-orange-50/30",  avatarRing: "ring-orange-200"  },
  Sedang_Diperiksa:  { stripe: "bg-sky-500",      topBar: "bg-sky-50/50",     identityWash: "from-sky-50/30",     avatarRing: "ring-sky-200",   pulse: true },
  Selesai:           { stripe: "bg-emerald-500",  topBar: "bg-emerald-50/40", identityWash: "from-emerald-50/20", avatarRing: "ring-emerald-200" },
};

// ── InfoChip ──────────────────────────────────────────────

function InfoChip({ icon: Icon, value, cls }: {
  icon: React.ElementType; value: React.ReactNode; cls: string;
}) {
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs shadow-sm ring-1",
      cls,
    )}>
      <Icon size={11} className="shrink-0" />
      {value}
    </span>
  );
}

// ── Antrian card ──────────────────────────────────────────

function AntrianCard({ nomor, status, poli }: { nomor: number; status: RJStatus; poli: string }) {
  const sc = STATUS_CFG[status];
  return (
    <div className="relative w-36 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-slate-700 to-slate-900 shadow-md">
      <Hash size={64} className="pointer-events-none absolute -right-3 -bottom-3 text-white/[0.06]" />
      <div className="relative flex flex-col px-3 py-2.5">
        <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
          <Hash size={9} /> Antrian
        </span>
        <p className="text-3xl font-black leading-none text-white tabular-nums">{nomor}</p>
        <span className={cn(
          "mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
          sc.badge,
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", sc.dot,
            status !== "Selesai" && "animate-pulse"
          )} />
          {sc.label}
        </span>
        <p className="mt-auto pt-1.5 text-[9px] tracking-wide text-slate-400/70">{poli}</p>
      </div>
    </div>
  );
}

// ── Dokter card ───────────────────────────────────────────

function DokterCard({ dokter, waktu, tanggal }: { dokter: string; waktu: string; tanggal: string }) {
  return (
    <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-linear-to-br from-sky-500 to-sky-700 shadow-md">
      <Stethoscope size={72} className="pointer-events-none absolute -right-4 -top-4 rotate-12 text-white/[0.07]" />
      <div className="relative flex h-full flex-col px-3 py-2.5">
        <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-sky-100">
          <Stethoscope size={9} /> Dokter
        </span>
        <p className="truncate text-sm font-bold leading-tight text-white">{dokter}</p>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <div className="flex items-center gap-1 text-[10px] text-sky-100">
            <CalendarDays size={9} />
            <span>{tanggal}</span>
          </div>
          <span className="text-sky-200/60">·</span>
          <span className="text-[10px] font-semibold text-white">{waktu}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RJPatientHeader({ patient }: { patient: RJPatientDetail }) {
  const hdr = HEADER_STATUS[patient.status];
  const sc  = STATUS_CFG[patient.status];
  const pc  = POLI_CFG[patient.poli];
  const pj  = PENJAMIN_CFG[patient.penjamin];

  const initials = patient.name
    .split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

  const penjaminLabel = pj.label + (patient.noBpjs ? ` · ${patient.noBpjs}` : "");

  return (
    <header className="shrink-0 shadow-sm">
      <div className="flex">

        {/* ── Status stripe ── */}
        <div className={cn("w-1.5 shrink-0", hdr.stripe)}>
          {hdr.pulse && (
            <div className="flex h-full items-center justify-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Breadcrumb */}
          <div className={cn(
            "flex items-center gap-2 border-b border-slate-100 px-3 py-2 md:px-4",
            hdr.topBar,
          )}>
            <Link href="/ehis-care/rawat-jalan"
              className="text-xs text-slate-400 transition hover:text-slate-600">
              Rawat Jalan
            </Link>
            <ChevronRight size={11} className="shrink-0 text-slate-300" />
            <span className={cn("rounded-lg px-1.5 py-0.5 text-[9px] font-bold", pc.badge)}>
              {pc.label}
            </span>
            <ChevronRight size={11} className="shrink-0 text-slate-300" />
            <span className="font-mono text-xs font-semibold text-slate-500">{patient.noRM}</span>

            <span className={cn(
              "ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              sc.badge,
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", sc.dot,
                patient.status !== "Selesai" && "animate-pulse"
              )} />
              {sc.label}
            </span>

            <Link
              href="/ehis-care/rawat-jalan"
              className="ml-auto flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-700"
              aria-label="Tutup"
            >
              <X size={12} />
            </Link>
          </div>

          {/* Identity section */}
          <div className="relative bg-white">
            <div className={cn(
              "pointer-events-none absolute inset-0 bg-linear-to-r",
              hdr.identityWash, "to-transparent"
            )} />

            <div className="relative grid grid-cols-1 gap-2 px-3 py-2.5 md:grid-cols-[1fr_300px] md:gap-3 md:px-4">

              {/* Left: avatar + name + info chips */}
              <motion.div
                className="flex flex-col gap-2"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black ring-2",
                    hdr.avatarRing,
                    patient.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
                  )}>
                    {initials}
                    {hdr.pulse && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-bold tracking-tight text-slate-900 md:text-lg">
                      {patient.name}
                    </h1>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{patient.age} thn</span>
                      <span className="text-slate-300">·</span>
                      <span>{patient.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500">{patient.noRM}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500">{patient.tanggalLahir}</span>
                    </p>
                  </div>
                </div>

                {/* Info chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <InfoChip
                    icon={CreditCard}
                    value={penjaminLabel}
                    cls="bg-emerald-50 ring-emerald-200 text-emerald-800"
                  />
                  <InfoChip
                    icon={Phone}
                    value={`${patient.namaKeluarga} (${patient.hubunganKeluarga})`}
                    cls="bg-amber-50 ring-amber-200 text-amber-800"
                  />
                  <InfoChip
                    icon={MapPin}
                    value={patient.alamat}
                    cls="bg-teal-50 ring-teal-200 text-teal-800"
                  />
                </div>
              </motion.div>

              {/* Right: Antrian + Dokter cards */}
              <motion.div
                className="hidden gap-2 md:flex"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
              >
                <AntrianCard
                  nomor={patient.nomorAntrian}
                  status={patient.status}
                  poli={pc.label}
                />
                <DokterCard
                  dokter={patient.dokter}
                  waktu={patient.waktuDaftar}
                  tanggal={patient.tanggalKunjungan}
                />
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
