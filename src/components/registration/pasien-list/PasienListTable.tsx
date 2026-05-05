"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";

// ── Config ─────────────────────────────────────────────────────────────────

const UNIT_STYLE: Record<string, string> = {
  "IGD":          "bg-rose-50 text-rose-600",
  "Rawat Jalan":  "bg-sky-50 text-sky-600",
  "Rawat Inap":   "bg-indigo-50 text-indigo-600",
  "Laboratorium": "bg-amber-50 text-amber-700",
  "Radiologi":    "bg-violet-50 text-violet-600",
  "Farmasi":      "bg-emerald-50 text-emerald-600",
};

const PENJAMIN_STYLE: Record<string, string> = {
  BPJS_Non_PBI: "bg-sky-100 text-sky-700",
  BPJS_PBI:     "bg-sky-50 text-sky-500 border border-sky-200",
  Umum:         "bg-slate-100 text-slate-600",
  Asuransi:     "bg-violet-100 text-violet-700",
  Jamkesda:     "bg-amber-100 text-amber-700",
};

const PENJAMIN_LABEL: Record<string, string> = {
  BPJS_Non_PBI: "BPJS Non-PBI",
  BPJS_PBI:     "BPJS PBI",
  Umum:         "Umum",
  Asuransi:     "Asuransi",
  Jamkesda:     "Jamkesda",
};

// ── PasienRow ───────────────────────────────────────────────────────────────

function PasienRow({ patient, rank }: { patient: PatientMaster; rank: number }) {
  const initials  = patient.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const lastVisit = patient.riwayatKunjungan[0] ?? null;
  const hasActive = patient.riwayatKunjungan.some((k) => k.status === "Aktif");
  const pjStyle   = PENJAMIN_STYLE[patient.penjamin.tipe] ?? "bg-slate-100 text-slate-600";
  const pjLabel   = PENJAMIN_LABEL[patient.penjamin.tipe] ?? patient.penjamin.tipe;

  return (
    <Link
      href={`/ehis-registration/pasien/${patient.id}`}
      className="group flex items-center gap-4 border-b border-slate-100 px-5 py-3 transition hover:bg-indigo-50/40 last:border-0"
    >
      {/* Rank */}
      <span className="w-5 shrink-0 text-center text-[10px] font-semibold text-slate-300">{rank}</span>

      {/* Avatar */}
      <div
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-black",
          patient.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
        )}
      >
        {initials}
        {hasActive && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
        )}
      </div>

      {/* Name + RM */}
      <div className="w-44 shrink-0 min-w-0">
        <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-indigo-700 transition">
          {patient.name}
        </p>
        <p className="font-mono text-[10px] text-slate-400">{patient.noRM}</p>
      </div>

      {/* Age + gender */}
      <div className="w-20 shrink-0">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
          {patient.age} thn · {patient.gender === "L" ? "♂" : "♀"}
        </span>
      </div>

      {/* Penjamin */}
      <div className="w-28 shrink-0">
        <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", pjStyle)}>
          {pjLabel}
        </span>
      </div>

      {/* Last visit */}
      <div className="flex flex-1 min-w-0 items-center gap-2">
        {lastVisit ? (
          <>
            <span className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
              UNIT_STYLE[lastVisit.unit] ?? "bg-slate-50 text-slate-500"
            )}>
              {lastVisit.unit}
            </span>
            <span className="truncate text-[11px] text-slate-500">{lastVisit.tanggal}</span>
            <span className={cn(
              "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold",
              lastVisit.status === "Aktif"      ? "bg-emerald-100 text-emerald-700" :
              lastVisit.status === "Selesai"    ? "bg-slate-100 text-slate-500"     :
                                                  "bg-red-100 text-red-500",
            )}>
              {lastVisit.status}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-slate-300">–</span>
        )}
      </div>

      {/* Terdaftar */}
      <div className="w-28 shrink-0 text-right">
        <p className="text-[10px] text-slate-400">{patient.terdaftar}</p>
      </div>

      {/* Arrow */}
      <div className="shrink-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-300 transition group-hover:border-indigo-300 group-hover:bg-indigo-50 group-hover:text-indigo-600">
          <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, pageSize, onPage }: {
  page: number; totalPages: number; total: number; pageSize: number;
  onPage: (p: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  // Build visible page numbers (max 7 slots, window around current)
  const windowSize = Math.min(totalPages, 7);
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  start = Math.min(start, totalPages - windowSize + 1);
  const pages = Array.from({ length: windowSize }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
      <p className="text-[11px] text-slate-400">
        {total === 0
          ? "Tidak ada hasil ditemukan"
          : `Menampilkan ${from}–${to} dari ${total} pasien`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft size={12} />
        </button>

        {start > 1 && (
          <>
            <button onClick={() => onPage(1)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50">1</button>
            {start > 2 && <span className="px-1 text-[11px] text-slate-300">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={cn(
              "flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border text-[11px] font-semibold transition",
              p === page
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {p}
          </button>
        ))}

        {start + windowSize - 1 < totalPages && (
          <>
            {start + windowSize - 1 < totalPages - 1 && <span className="px-1 text-[11px] text-slate-300">…</span>}
            <button onClick={() => onPage(totalPages)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50">{totalPages}</button>
          </>
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ── PasienListTable ────────────────────────────────────────────────────────

interface PasienListTableProps {
  patients:   PatientMaster[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
  onPage:     (p: number) => void;
}

export function PasienListTable({ patients, total, page, pageSize, totalPages, onPage }: PasienListTableProps) {
  const offset = (page - 1) * pageSize;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Table header */}
      <div className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-2">
        <div className="w-5 shrink-0" />
        <div className="w-9 shrink-0" />
        <div className="w-44 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Pasien</div>
        <div className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Usia / JK</div>
        <div className="w-28 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Penjamin</div>
        <div className="flex-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Kunjungan Terakhir</div>
        <div className="w-28 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Terdaftar</div>
        <div className="w-7 shrink-0" />
      </div>

      {/* Scrollable rows */}
      <div className="flex-1 overflow-y-auto bg-white">
        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Users size={20} className="text-slate-300" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-400">Tidak ada pasien ditemukan</p>
              <p className="mt-0.5 text-xs text-slate-300">Coba ubah filter atau kata pencarian</p>
            </div>
          </div>
        ) : (
          patients.map((p, i) => <PasienRow key={p.id} patient={p} rank={offset + i + 1} />)
        )}
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={onPage} />
    </div>
  );
}
