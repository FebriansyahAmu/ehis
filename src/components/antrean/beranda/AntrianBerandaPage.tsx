"use client";

// Beranda modul Antrean — peluncur kiosk APM (dengan struk terakhir dari kiosk), alur
// pasien per tahap, sumber antrean, navigasi cepat. Reaktif dari antreanStore; data
// contoh dimuat bila store kosong (pola sama dengan board/monitoring/display).
// Permukaan netral slate, satu aksen indigo: tombol APM + tahap terpadat.

import Link from "next/link";
import { useEffect, useMemo, type ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  Activity,
  ChevronRight,
  ExternalLink,
  Globe,
  ListChecks,
  MonitorPlay,
  MonitorSmartphone,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { useAntreanStore, seedAntrean } from "@/lib/antrean/antreanStore";
import { buildSeedAntrean } from "@/lib/antrean/antreanSeed";
import type { SumberAntrean } from "@/lib/antrean/types";
import { useSkeletonDelay } from "@/components/master/shared";
import { todayISO } from "@/components/antrean/board/boardShared";
import { cn } from "@/lib/utils";
import { AlurPasienPanel } from "./AlurPasienPanel";
import { StrukKiosk } from "./StrukKiosk";
import {
  antreanHariIni,
  hitungAlur,
  hitungSumber,
  ringkasNavigasi,
  strukTerakhir,
  tanggalHariIni,
} from "./berandaStats";

const EASE = [0.22, 1, 0.36, 1] as const;
const PANEL = "rounded-2xl bg-white ring-1 ring-slate-900/8";
const HALAMAN = "mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6 lg:p-8";

export default function AntrianBerandaPage() {
  const store = useAntreanStore();
  const loaded = useSkeletonDelay(500);

  // Data contoh hanya bila store kosong (tak menimpa antrean nyata dari kiosk).
  useEffect(() => {
    seedAntrean(buildSeedAntrean());
  }, []);

  const list = useMemo(() => antreanHariIni(store.byKode), [store.byKode]);
  const alur = useMemo(() => hitungAlur(list), [list]);
  const sumber = useMemo(() => hitungSumber(list), [list]);
  const nav = useMemo(() => ringkasNavigasi(list), [list]);

  if (!loaded) return <BerandaSkeleton />;

  const tanggalPanjang = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className={HALAMAN}>
        <Masuk urutan={0}>
          <section
            aria-labelledby="beranda-judul"
            className={cn(PANEL, "grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]")}
          >
            <div className="flex flex-col justify-center gap-6 p-6 sm:p-8">
              <div>
                <p className="m-sm text-slate-500">
                  <time dateTime={todayISO()}>{tanggalPanjang}</time>
                </p>
                <h1 id="beranda-judul" className="mt-2 text-2xl font-medium leading-tight text-slate-900 sm:text-3xl">
                  Antrean rawat jalan
                </h1>
                <p className="mt-3 max-w-xl m-base text-slate-600">
                  Pasien onsite mengambil nomor sendiri di kiosk APM. Booking Mobile JKN dan website masuk ke
                  antrean yang sama, lalu dipanggil di loket admisi, atau langsung ke poli untuk pasien lama.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link
                  href="/ehis-antrian/apm"
                  target="_blank"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 m-base font-medium text-white transition-[background-color,transform] duration-150 hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-[0.98]"
                >
                  <MonitorSmartphone className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
                  Buka mode APM
                  <ExternalLink className="size-4 text-indigo-200" strokeWidth={1.5} aria-hidden="true" />
                  <span className="sr-only"> (tab baru)</span>
                </Link>
                <p className="m-sm text-slate-500">Terbuka di tab baru untuk layar anjungan</p>
              </div>
            </div>
            <div className="flex items-center justify-center border-t border-slate-900/6 bg-slate-50 px-6 py-8 lg:border-t-0 lg:border-l">
              <StrukKiosk record={strukTerakhir(list)} tanggal={tanggalHariIni()} />
            </div>
          </section>
        </Masuk>

        <Masuk urutan={1}>
          <AlurPasienPanel tahap={alur.tahap} batal={alur.batal} terpadat={alur.terpadat} />
        </Masuk>

        <Masuk urutan={2} className="grid gap-6 lg:grid-cols-3">
          <SumberPanel sumber={sumber} />
          <NavCepat nav={nav} />
        </Masuk>
      </div>
    </MotionConfig>
  );
}

// ── Pieces ─────────────────────────────────────────────────

/** Satu-satunya animasi masuk: fade + naik 8px, jeda 50ms per blok. */
function Masuk({ urutan, className, children }: { urutan: number; className?: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: urutan * 0.05 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const IKON_SUMBER: Record<SumberAntrean, LucideIcon> = {
  Onsite: MonitorSmartphone,
  MJKN: Smartphone,
  Website: Globe,
};

function SumberPanel({ sumber }: { sumber: ReturnType<typeof hitungSumber> }) {
  const total = sumber.reduce((n, s) => n + s.count, 0);
  const terbesar = Math.max(0, ...sumber.map((s) => s.count));

  return (
    <section aria-labelledby="sumber-judul" className={cn(PANEL, "p-5 sm:p-6")}>
      <h2 id="sumber-judul" className="m-lg font-medium text-slate-900">Sumber antrean</h2>
      <ul className="mt-4 flex flex-col gap-4">
        {sumber.map((s) => {
          const Icon = IKON_SUMBER[s.key];
          const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
          return (
            <li key={s.key}>
              <div className="flex items-center gap-2.5 m-sm">
                <Icon className="size-4 shrink-0 text-slate-500" strokeWidth={1.5} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-slate-700">{s.label}</span>
                <span className="tabular-nums text-slate-900">{s.count}</span>
                <span className="w-10 text-right m-xs tabular-nums text-slate-500">{pct}%</span>
              </div>
              <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", s.count > 0 && s.count === terbesar ? "bg-slate-700" : "bg-slate-400")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const TITIK = { amber: "bg-amber-500", emerald: "bg-emerald-500", slate: "bg-slate-300" } as const;

function InfoTitik({ tone, children }: { tone: keyof typeof TITIK; children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", TITIK[tone])} />
      <span className="tabular-nums">{children}</span>
    </>
  );
}

function NavCepat({ nav }: { nav: ReturnType<typeof ringkasNavigasi> }) {
  const items: { href: string; icon: LucideIcon; judul: string; ket: string; info: ReactNode }[] = [
    {
      href: "/ehis-antrian/antrean",
      icon: ListChecks,
      judul: "Antrean List",
      ket: "Board loket dan respons kedatangan pasien",
      info: (
        <InfoTitik tone={nav.menungguLoket > 0 ? "amber" : "slate"}>{nav.menungguLoket} menunggu di loket</InfoTitik>
      ),
    },
    {
      href: "/ehis-antrian/monitoring",
      icon: Activity,
      judul: "Monitoring",
      ket: "Status TaskID dan pengiriman ke BPJS",
      info:
        nav.taskBelumTerkirim > 0 ? (
          <InfoTitik tone="amber">{nav.taskBelumTerkirim} task belum terkirim</InfoTitik>
        ) : (
          <InfoTitik tone="emerald">Semua task terkirim</InfoTitik>
        ),
    },
    {
      href: "/ehis-antrian/display",
      icon: MonitorPlay,
      judul: "Display",
      ket: "Layar panggilan ruang tunggu",
      info:
        nav.dipanggil.length === 1 ? (
          <span>
            <span className="font-mono text-slate-900">{nav.dipanggil[0]}</span> sedang dipanggil
          </span>
        ) : nav.dipanggil.length > 1 ? (
          <span className="tabular-nums">{nav.dipanggil.length} nomor dipanggil</span>
        ) : (
          <span>Belum ada panggilan</span>
        ),
    },
  ];

  return (
    <section aria-labelledby="nav-judul" className={cn(PANEL, "p-2 lg:col-span-2")}>
      <h2 id="nav-judul" className="px-3 pt-3 m-lg font-medium text-slate-900 sm:px-4 sm:pt-4">
        Navigasi cepat
      </h2>
      <ul className="mt-2 flex flex-col gap-1">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:px-4"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
              >
                <it.icon className="size-[18px]" strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block m-base font-medium text-slate-900">{it.judul}</span>
                <span className="block m-sm text-slate-500">{it.ket}</span>
                <span className="mt-1 flex items-center gap-2 m-xs text-slate-600 sm:hidden">{it.info}</span>
              </span>
              <span className="hidden shrink-0 items-center gap-2 m-xs text-slate-600 sm:flex">{it.info}</span>
              <ChevronRight
                className="size-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BerandaSkeleton() {
  return (
    <div className={HALAMAN} aria-hidden="true">
      <div className="h-72 rounded-2xl bg-slate-100 motion-safe:animate-pulse" />
      <div className="h-44 rounded-2xl bg-slate-100 motion-safe:animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-56 rounded-2xl bg-slate-100 motion-safe:animate-pulse" />
        <div className="h-56 rounded-2xl bg-slate-100 motion-safe:animate-pulse lg:col-span-2" />
      </div>
    </div>
  );
}
