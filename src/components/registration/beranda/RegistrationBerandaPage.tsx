"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Users, Activity, Shield, Wallet, ArrowRight, UserPlus, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { patientMasterData, recentPatients } from "@/lib/data";
import { PasienBaruModal } from "@/components/registration/pasien-baru/PasienBaruModal";

const STATUS_STYLE: Record<string, string> = {
  "Selesai":         "bg-slate-100 text-slate-500",
  "Dalam Perawatan": "bg-emerald-100 text-emerald-700",
  "Menunggu":        "bg-amber-100 text-amber-700",
  "Kritis":          "bg-red-100 text-red-600",
};

const UNIT_STYLE: Record<string, string> = {
  "IGD":         "bg-rose-50 text-rose-600",
  "Rawat Jalan": "bg-sky-50 text-sky-600",
  "Rawat Inap":  "bg-indigo-50 text-indigo-600",
  "Farmasi":     "bg-emerald-50 text-emerald-600",
};

const PENJAMIN_LABEL: Record<string, string> = {
  BPJS_Non_PBI: "BPJS Non-PBI",
  BPJS_PBI:     "BPJS PBI",
  Umum:         "Umum",
  Asuransi:     "Asuransi",
  Jamkesda:     "Jamkesda",
};

const PENJAMIN_COLOR: Record<string, string> = {
  BPJS_Non_PBI: "bg-sky-500",
  BPJS_PBI:     "bg-sky-300",
  Umum:         "bg-slate-400",
  Asuransi:     "bg-violet-400",
  Jamkesda:     "bg-amber-400",
};

export default function RegistrationBerandaPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const patients = useMemo(() => Object.values(patientMasterData), []);

  const stats = useMemo(() => {
    const aktif = patients.filter((p) => p.riwayatKunjungan.some((k) => k.status === "Aktif")).length;
    const bpjs  = patients.filter((p) => p.penjamin.tipe.startsWith("BPJS")).length;
    const umum  = patients.filter((p) => p.penjamin.tipe === "Umum").length;
    return { total: patients.length, aktif, bpjs, umum };
  }, [patients]);

  const penjaminDist = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach((p) => {
      counts[p.penjamin.tipe] = (counts[p.penjamin.tipe] ?? 0) + 1;
    });
    const max = Math.max(...Object.values(counts));
    return Object.entries(counts)
      .map(([tipe, count]) => ({
        tipe,
        count,
        pct: Math.round((count / patients.length) * 100),
        barPct: Math.round((count / max) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [patients]);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
    <div className="flex flex-col gap-5 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">Beranda Registrasi</h1>
          <p className="mt-0.5 text-xs text-slate-400">{today}</p>
        </div>
        <Link
          href="/ehis-registration/pasien"
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          <Users size={12} />
          Semua Pasien
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Users,    label: "Total Pasien",    value: stats.total, sub: "terdaftar",       cls: "bg-indigo-50  text-indigo-600  ring-indigo-200/80"  },
          { icon: Activity, label: "Aktif Sekarang",  value: stats.aktif, sub: "kunjungan aktif", cls: "bg-emerald-50 text-emerald-600 ring-emerald-200/80" },
          { icon: Shield,   label: "Peserta BPJS",    value: stats.bpjs,  sub: "dari total",      cls: "bg-sky-50     text-sky-600     ring-sky-200/80"     },
          { icon: Wallet,   label: "Umum / Mandiri",  value: stats.umum,  sub: "bayar mandiri",   cls: "bg-amber-50   text-amber-600   ring-amber-200/80"   },
        ].map(({ icon: Icon, label, value, sub, cls }) => (
          <div key={label} className={cn("flex flex-col gap-2 rounded-2xl p-4 ring-1", cls)}>
            <div className="flex items-center gap-2">
              <Icon size={14} className="shrink-0 opacity-70" />
              <span className="text-[11px] font-medium opacity-70">{label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-[10px] text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Left: Recent visits (2/3) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-xs font-bold text-slate-800">Kunjungan Terkini</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Aktivitas pendaftaran terbaru</p>
            </div>
            <Link
              href="/ehis-registration/pasien"
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              Lihat Semua <ArrowRight size={10} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentPatients.map((p) => (
              <Link
                key={p.id}
                href={`/ehis-registration/pasien/${encodeURIComponent(p.noRM)}`}
                className="group flex items-center gap-3 px-4 py-3 transition hover:bg-indigo-50/40"
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-black",
                  p.unit === "IGD" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700",
                )}>
                  {p.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800 transition group-hover:text-indigo-700">{p.name}</p>
                  <p className="font-mono text-[10px] text-slate-400">{p.noRM}</p>
                </div>
                <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", UNIT_STYLE[p.unit] ?? "bg-slate-50 text-slate-500")}>
                  {p.unit}
                </span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold", STATUS_STYLE[p.status] ?? "bg-slate-100 text-slate-500")}>
                  {p.status}
                </span>
                <p className="w-10 shrink-0 text-right text-[10px] text-slate-400">{p.time}</p>
                <ArrowRight size={11} className="shrink-0 text-slate-300 transition group-hover:text-indigo-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Penjamin distribution + Quick actions (1/3) */}
        <div className="flex flex-col gap-4">

          {/* Penjamin distribution */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold text-slate-800">Distribusi Penjamin</p>
            <p className="mt-0.5 mb-4 text-[10px] text-slate-400">Berdasarkan total pasien terdaftar</p>
            <div className="flex flex-col gap-3">
              {penjaminDist.map(({ tipe, count, pct, barPct }) => (
                <div key={tipe}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-600">
                      {PENJAMIN_LABEL[tipe] ?? tipe}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {count} <span className="font-normal text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", PENJAMIN_COLOR[tipe] ?? "bg-slate-400")}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-xs font-bold text-slate-800">Aksi Cepat</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98]"
              >
                <UserPlus size={13} className="shrink-0" />
                Daftar Pasien Baru
              </button>
              <Link
                href="/ehis-registration/antrian"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                <CalendarDays size={13} className="shrink-0" />
                Lihat Antrian
              </Link>
              <Link
                href="/ehis-registration/pasien"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                <Users size={13} className="shrink-0" />
                Daftar Semua Pasien
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>

    <PasienBaruModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
