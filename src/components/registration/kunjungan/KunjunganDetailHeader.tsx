"use client";

// Header Detail Kunjungan — breadcrumb · identitas pasien + kunjungan · fakta ringkas kunjungan.
// Fakta (DPJP/tanggal/cara masuk/cara datang) tampil di sini agar konteks tetap terlihat di tab
// mana pun; tab "Ringkasan & Info" tidak mengulanginya.

import Link from "next/link";
import { Ambulance, ArrowLeft, CalendarDays, DoorOpen, Stethoscope, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { PatientMaster, KunjunganRecord } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { kunjunganStatusView } from "../patient/config";
import { UNIT_CFG } from "./shared";

// Tautan breadcrumb: garis bawah saat hover/fokus (bukan warna saja) + cincin fokus kontras ≥ 3:1.
const CRUMB =
  "rounded-sm underline-offset-4 hover:text-slate-900 hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600";

// Tombol aksi header — ghost minimalis: dikenali dari teks/ikon (slate-600 ≈ 7,6:1 · sky-700 ≈ 5,9:1),
// tiap status beda: hover = tint latar, tekan = skala, fokus = outline solid sky-600 (≥ 3:1; ring
// bawaan shadcn `ring/50` terlalu pucat bila jadi satu-satunya penanda fokus).
const ACTION =
  "font-medium transition-[background-color,color,scale] duration-150 motion-safe:active:scale-[0.97] focus-visible:ring-0 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600";

interface Fact {
  icon: LucideIcon;
  label: string;
  value: string | undefined;
}

export function KunjunganDetailHeader({
  patient,
  kunjungan,
}: {
  patient: PatientMaster;
  kunjungan: KunjunganRecord;
}) {
  const unit = UNIT_CFG[kunjungan.unit];
  const status = kunjunganStatusView(kunjungan);
  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  const pasienHref = `/ehis-registration/pasien/${encodeURIComponent(patient.noRM)}`;
  const selfHref = `${pasienHref}/kunjungan/${encodeURIComponent(kunjungan.id)}`;

  const facts: Fact[] = [
    { icon: UserRound, label: "DPJP", value: kunjungan.dokter },
    { icon: CalendarDays, label: "Tanggal", value: kunjungan.tanggal },
    { icon: DoorOpen, label: "Cara masuk", value: kunjungan.caraMasuk },
    // Cara datang (IGD) — hanya bila terisi.
    ...(kunjungan.caraDatang ? [{ icon: Ambulance, label: "Cara datang", value: kunjungan.caraDatang }] : []),
  ];

  return (
    <header data-accent="sky" className="shrink-0 border-b border-slate-200 bg-white">
      <div className={cn("h-0.5", unit.accent)} aria-hidden="true" />

      <div className="space-y-3 px-4 pt-2.5 pb-3 sm:px-6">
        <Breadcrumb aria-label="Breadcrumb">
          <BreadcrumbList className="m-xs flex-nowrap gap-1 text-slate-500 sm:gap-1.5">
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink asChild className={CRUMB}>
                <Link href="/ehis-registration">Registrasi</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbLink asChild className={cn(CRUMB, "block truncate")}>
                <Link href={pasienHref}>{patient.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="shrink-0">
              {/* Halaman aktif tetap tautan (struktur jejak konsisten) + aria-current. */}
              <BreadcrumbLink asChild className={cn(CRUMB, "font-medium text-slate-800")}>
                <Link href={selfHref} aria-current="page">
                  Detail kunjungan
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* ── Identitas ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-100"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  {patient.name}
                </h1>
                <Badge variant="outline" className={cn("border-transparent", unit.bg, unit.text)}>
                  {kunjungan.unit}
                </Badge>
                <Badge variant="outline" className={cn("border-transparent", status.badge)}>
                  {status.label}
                </Badge>
              </div>
              <p className="m-xs mt-0.5 flex flex-wrap items-center gap-x-1.5 text-slate-500">
                <span>
                  No. RM <span className="font-mono font-medium text-slate-700">{patient.noRM}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  No. Pendaftaran{" "}
                  <span className="font-mono font-semibold text-sky-800">{kunjungan.noPendaftaran}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button asChild variant="ghost" size="sm" className={cn(ACTION, "text-slate-600 hover:bg-slate-100 hover:text-slate-900")}>
              <Link href={pasienHref}>
                <ArrowLeft aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Kembali</span>
              </Link>
            </Button>
            {kunjungan.klinisPath && (
              <>
                <span aria-hidden="true" className="h-4 w-px bg-slate-200" />
                <Button asChild variant="ghost" size="sm" className={cn(ACTION, "text-sky-700 hover:bg-sky-50 hover:text-sky-800")}>
                  <Link href={kunjungan.klinisPath}>
                    <Stethoscope aria-hidden="true" />
                    Rekam Medis
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── Fakta kunjungan ── */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-200/70 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
              <dt className="m-xs flex shrink-0 items-center gap-1.5 text-slate-500">
                <Icon className="size-3.5 text-slate-400" aria-hidden="true" />
                {label}
              </dt>
              <dd className="m-xs truncate font-semibold text-slate-800">{value?.trim() || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
