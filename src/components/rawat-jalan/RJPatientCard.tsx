"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Stethoscope, Clock, PhoneCall, BellRing, UserCheck, XCircle,
  FolderOpen, Lock, Undo2,
} from "lucide-react";
import type { RJPatient } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ORDER_CFG, type RJOrderStatus } from "@/lib/rawat-jalan/rjQueueStore";
import { POLI_CFG, PENJAMIN_CFG } from "./rjShared";

interface Props {
  patient: RJPatient;
  index: number;
  order: RJOrderStatus;
  recalls: number;
  onPanggil: (p: RJPatient) => void;
  onPanggilUlang: (p: RJPatient) => void;
  onTerima: (p: RJPatient) => void;
  onBatal: (p: RJPatient) => void;
}

export default function RJPatientCard({
  patient: p,
  index,
  order,
  recalls,
  onPanggil,
  onPanggilUlang,
  onTerima,
  onBatal,
}: Props) {
  const oc = ORDER_CFG[order];
  const pc = POLI_CFG[p.poli];
  const pj = PENJAMIN_CFG[p.penjamin];
  const detailHref = `/ehis-care/rawat-jalan/${p.id}`;
  const dimmed = order === "Selesai" || order === "Dikembalikan_Admisi";
  // Rekam medis hanya boleh dibuka saat pasien sudah DILAYANI (diterima) atau SELESAI. Order yang
  // belum diterima (Order_Masuk/Dipanggil) atau dikembalikan → kartu TIDAK menavigasi ke rekam.
  const canOpenRecord = order === "Dilayani" || order === "Selesai";

  const card = (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.2, ease: "easeOut" }}
        className={cn(
          "flex flex-col overflow-hidden rounded-xl border border-l-4 border-slate-200 bg-white shadow-sm transition-all duration-200",
          oc.border,
          dimmed && "opacity-75",
          canOpenRecord && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
        )}
      >
        {/* Header row */}
        <div className="flex items-start gap-3 p-4 pb-2.5">
          <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100">
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">No</span>
            <span className="text-base font-black leading-none text-slate-700">{p.nomorAntrian}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{p.name}</p>
            <p className="text-[10px] text-slate-400">
              <span className="font-mono">{p.noRM}</span>
              <span className="mx-1 text-slate-300">·</span>
              <span>{p.age} thn · {p.gender === "L" ? "♂" : "♀"}</span>
            </p>
          </div>

          <span className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold", oc.badge)}>
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", oc.dot, (order === "Dipanggil") && "animate-pulse")} />
            {oc.label}
          </span>
        </div>

        {/* Poli + Penjamin */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2.5">
          <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold", pc.badge)}>{pc.label}</span>
          {order === "Order_Masuk" && (
            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Order dari Admisi</span>
          )}
          {recalls > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              <BellRing size={10} /> {recalls + 1}×
            </span>
          )}
          <span className="ml-auto">
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", pj.badge)}>{pj.label}</span>
          </span>
        </div>

        {/* Keluhan */}
        <div className="px-4 pb-2.5">
          <p className="line-clamp-1 text-xs text-slate-600">{p.keluhan}</p>
        </div>

        {/* Dokter */}
        <div className="flex items-center gap-3 px-4 pb-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <Stethoscope size={11} className="shrink-0 text-slate-400" />
            <p className="truncate text-[10px] text-slate-500">{p.dokter}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
            <Clock size={10} />
            <span>{p.waktuDaftar}</span>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/60 px-3 py-2.5">
          <ActionRow
            order={order}
            onPanggil={() => onPanggil(p)}
            onPanggilUlang={() => onPanggilUlang(p)}
            onTerima={() => onTerima(p)}
            onBatal={() => onBatal(p)}
          />
        </div>
      </motion.article>
  );

  // Bungkus Link (buka rekam) HANYA saat boleh; tombol aksi tetap stopPropagation/preventDefault.
  return canOpenRecord ? (
    <Link href={detailHref} className="block focus:outline-none">{card}</Link>
  ) : (
    card
  );
}

// ── Action row per status ─────────────────────────────────
// Buka Rekam & Selesai DIHILANGKAN — buka rekam = klik kartu; selesaikan = di dalam rekam (disposisi).

function ActionRow({
  order,
  onPanggil,
  onPanggilUlang,
  onTerima,
  onBatal,
}: {
  order: RJOrderStatus;
  onPanggil: () => void;
  onPanggilUlang: () => void;
  onTerima: () => void;
  onBatal: () => void;
}) {
  if (order === "Order_Masuk") {
    return (
      <>
        <Btn icon={PhoneCall} label="Panggil" tone="sky" onClick={onPanggil} />
        <Btn icon={XCircle} label="Batal" tone="ghost-rose" onClick={onBatal} />
      </>
    );
  }
  if (order === "Dipanggil") {
    return (
      <>
        <Btn icon={UserCheck} label="Terima" tone="emerald" onClick={onTerima} />
        <Btn icon={BellRing} label="Ulang" tone="ghost-amber" onClick={onPanggilUlang} />
        <Btn icon={XCircle} label="" tone="ghost-rose" onClick={onBatal} title="Batal kunjungan" />
      </>
    );
  }
  if (order === "Dilayani") {
    return (
      <span className="inline-flex items-center gap-1.5 px-1 text-[11px] font-medium text-sky-600">
        <FolderOpen size={12} /> Sedang dilayani — klik kartu untuk buka rekam
      </span>
    );
  }
  if (order === "Selesai") {
    return (
      <>
        <span className="inline-flex items-center gap-1.5 px-1 text-[11px] font-medium text-slate-500">
          <FolderOpen size={12} /> Klik kartu untuk lihat rekam
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
          <Lock size={10} /> Terkunci
        </span>
      </>
    );
  }
  // Dikembalikan_Admisi
  return (
    <span className="inline-flex items-center gap-1.5 px-1 text-[11px] font-medium text-rose-600">
      <Undo2 size={12} /> Dikembalikan ke loket admisi
    </span>
  );
}

// ── Buttons ───────────────────────────────────────────────

const TONE: Record<string, string> = {
  sky: "bg-sky-600 text-white hover:bg-sky-700",
  emerald: "bg-emerald-600 text-white hover:bg-emerald-700",
  "ghost-amber": "bg-white text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50",
  "ghost-rose": "bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50",
};

function Btn({
  icon: Icon,
  label,
  tone,
  onClick,
  title,
}: {
  icon: typeof PhoneCall;
  label: string;
  tone: keyof typeof TONE;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      // Cegah navigasi kartu (Link) saat menekan tombol aksi.
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      title={title ?? label}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition active:scale-95",
        label ? "" : "px-2",
        TONE[tone],
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
