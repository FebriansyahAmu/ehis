"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Camera,
  CalendarPlus,
  ClipboardList,
  Activity,
  CalendarClock,
  TriangleAlert,
  ArrowRight,
  IdCard,
  Fingerprint,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import { PENJAMIN_CFG } from "./config";

interface PatientHeroProps {
  patient: PatientMaster;
  upcomingCount: number;
  photoPreview: string | null;
  photoRef: React.RefObject<HTMLInputElement | null>;
  onDaftarKunjungan: () => void;
}

type Tint = "indigo" | "sky" | "emerald" | "slate" | "rose";

const TINT: Record<Tint, { chip: string; value: string; card: string }> = {
  indigo:  { chip: "bg-white text-indigo-600 ring-1 ring-indigo-100",  value: "text-indigo-700",  card: "border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50" },
  sky:     { chip: "bg-white text-sky-600 ring-1 ring-sky-100",        value: "text-sky-700",     card: "border-sky-100 bg-sky-50/50 hover:bg-sky-50" },
  emerald: { chip: "bg-white text-emerald-600 ring-1 ring-emerald-100", value: "text-emerald-700", card: "border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50" },
  slate:   { chip: "bg-white text-slate-400 ring-1 ring-slate-200",    value: "text-slate-400",   card: "border-slate-200 bg-slate-50/70 hover:bg-slate-100/60" },
  rose:    { chip: "bg-white text-rose-600 ring-1 ring-rose-100",      value: "text-rose-700",    card: "border-rose-100 bg-rose-50/50 hover:bg-rose-50" },
};

export function PatientHero({
  patient,
  upcomingCount,
  photoPreview,
  photoRef,
  onDaftarKunjungan,
}: PatientHeroProps) {
  const pjCfg = PENJAMIN_CFG[patient.penjamin.tipe];
  const isMale = patient.gender === "L";
  const initials = patient.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const activeKunjungan = useMemo(
    () => patient.riwayatKunjungan.find((k) => k.status === "Aktif"),
    [patient.riwayatKunjungan],
  );
  const aktifCount = useMemo(
    () => patient.riwayatKunjungan.filter((k) => k.status === "Aktif").length,
    [patient.riwayatKunjungan],
  );

  const stats: { icon: LucideIcon; label: string; value: string; tint: Tint }[] = [
    { icon: ClipboardList, label: "Total Kunjungan", value: String(patient.riwayatKunjungan.length), tint: "indigo" },
    { icon: Activity,      label: "Kunjungan Aktif",  value: String(aktifCount), tint: aktifCount > 0 ? "sky" : "slate" },
    { icon: CalendarClock, label: "Jadwal Mendatang", value: String(upcomingCount), tint: upcomingCount > 0 ? "emerald" : "slate" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
    >
      {/* Aksen gender tipis */}
      <div
        className={cn(
          "h-1.5 w-full bg-linear-to-r",
          isMale ? "from-sky-400 to-indigo-500" : "from-pink-400 to-rose-500",
        )}
      />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="group relative shrink-0">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt={patient.name}
                className="h-20 w-20 rounded-2xl object-cover shadow-md ring-4 ring-white"
              />
            ) : (
              <div
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-2xl text-xl font-black shadow-md ring-4 ring-white",
                  isMale
                    ? "bg-linear-to-br from-sky-100 to-sky-200 text-sky-700"
                    : "bg-linear-to-br from-pink-100 to-rose-200 text-rose-700",
                )}
              >
                {initials}
              </div>
            )}
            <button
              onClick={() => photoRef.current?.click()}
              aria-label="Ubah foto pasien"
              className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-black/0 transition group-hover:bg-black/30"
            >
              <Camera size={16} className="text-white opacity-0 transition group-hover:opacity-100" />
            </button>
            {activeKunjungan && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </span>
            )}
          </div>

          {/* Identitas */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">{patient.name}</h1>
              {activeKunjungan && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Sedang Dirawat
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Chip className="bg-slate-100 text-slate-600">
                {patient.age} thn · {isMale ? "Laki-laki" : "Perempuan"}
              </Chip>
              <Chip className="bg-rose-50 text-rose-700 ring-1 ring-rose-100">Gol. {patient.golonganDarah}</Chip>
              <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", pjCfg.badge)}>{pjCfg.label}</span>
            </div>

            {/* Meta ID */}
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:max-w-xl lg:grid-cols-4">
              <Meta icon={IdCard} label="No. RM" value={patient.noRM} mono strong />
              <Meta icon={Fingerprint} label="NIK" value={patient.nik} mono />
              {patient.idSatusehat ? (
                <Meta icon={ShieldCheck} label="Satusehat" value={patient.idSatusehat} mono accent />
              ) : (
                <Meta icon={CalendarDays} label="Terdaftar" value={patient.terdaftar} />
              )}
              {patient.idSatusehat && <Meta icon={CalendarDays} label="Terdaftar" value={patient.terdaftar} />}
            </div>
          </div>

          {/* CTA */}
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-48">
            {activeKunjungan ? (
              <button
                type="button"
                disabled
                aria-disabled
                title="Pasien masih punya kunjungan aktif — selesaikan dulu sebelum daftar lagi."
                className="flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-400 ring-1 ring-inset ring-slate-200"
              >
                <CalendarPlus size={13} />
                Daftar Kunjungan
              </button>
            ) : (
              <button
                onClick={onDaftarKunjungan}
                className="group flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.98]"
              >
                <CalendarPlus size={13} className="transition group-hover:scale-110" />
                Daftar Kunjungan
              </button>
            )}
            <p className="px-0.5 text-center text-[10px] leading-tight text-slate-400">
              Buat pendaftaran IGD · Rawat Jalan · Rawat Inap
            </p>
          </div>
        </div>

        {/* Banner kunjungan aktif */}
        {activeKunjungan && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5">
            <TriangleAlert size={14} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-semibold leading-snug text-amber-800">
                Masih ada kunjungan aktif — pendaftaran baru dikunci
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-amber-700">
                <span className="font-mono font-semibold">{activeKunjungan.noKunjungan}</span>
                {" · "}
                {activeKunjungan.unit}. Selesaikan atau batalkan dulu sebelum mendaftarkan kunjungan baru.
              </p>
              {activeKunjungan.detailPath && (
                <Link
                  href={activeKunjungan.detailPath}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 underline-offset-2 transition hover:text-amber-900 hover:underline"
                >
                  Lihat kunjungan aktif
                  <ArrowRight size={11} />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Strip KPI */}
        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
          {stats.map((s) => (
            <StatTile key={s.label} {...s} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ── Sub-components ───────────────────────────────────────────

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", className)}>{children}</span>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  mono,
  strong,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        <Icon size={10} className="shrink-0" /> {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-xs",
          mono && "font-mono",
          strong ? "font-bold text-slate-800" : accent ? "font-semibold text-sky-600" : "text-slate-600",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
  small,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tint: Tint;
  small?: boolean;
}) {
  const t = TINT[tint];
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border px-3.5 py-3 transition", t.card)}>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", t.chip)}>
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className={cn("font-black leading-none", small ? "text-sm" : "text-xl", t.value)}>{value}</p>
        <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      </div>
    </div>
  );
}
