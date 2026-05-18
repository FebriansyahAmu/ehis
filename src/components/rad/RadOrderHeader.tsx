"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Calendar, MapPin, Stethoscope,
  Hash, Clock, CheckCircle2, Circle, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type RadOrder, RAD_STATUS_CFG, MODALITAS_CFG, URGENSI_CFG,
  calcTATMenit, getTATStatus, fmtTimestamp, getStatusStep,
} from "./radShared";

// ── Timeline step ─────────────────────────────────────────

const STEPS: { key: keyof typeof STEP_TS; label: string }[] = [
  { key: "order",           label: "Order"        },
  { key: "dijadwalkan",     label: "Jadwal"        },
  { key: "verifikasi",      label: "Verifikasi"    },
  { key: "persiapan",       label: "Persiapan"     },
  { key: "akuisisiMulai",   label: "Akuisisi"      },
  { key: "expertise",       label: "Expertise"     },
  { key: "verifikasiHasil", label: "Validasi"      },
  { key: "rilis",           label: "Selesai"       },
];

const STEP_TS = {
  order: "", dijadwalkan: "", verifikasi: "", persiapan: "",
  akuisisiMulai: "", expertise: "", verifikasiHasil: "", rilis: "",
};

// ── TAT display ───────────────────────────────────────────

function TATDisplay({ order }: { order: RadOrder }) {
  const menit  = calcTATMenit(order);
  const status = getTATStatus(order);
  const target = { CITO: 60, Semi_Cito: 180, Rutin: 360 }[order.prioritas];

  const cfg = {
    ok:      { cls: "text-emerald-700 bg-emerald-50 border-emerald-200", label: "Dalam Target" },
    warning: { cls: "text-amber-700 bg-amber-50 border-amber-200",       label: "Mendekati Batas" },
    over:    { cls: "text-rose-700 bg-rose-50 border-rose-200",          label: "Melebihi Target" },
  }[status];

  if (menit === null) return null;

  const hrs = Math.floor(menit / 60);
  const min = menit % 60;
  const label = hrs > 0 ? `${hrs}j ${min}m` : `${min}m`;

  return (
    <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", cfg.cls)}>
      <Clock size={13} />
      <div>
        <p className="text-[11px] font-bold">{label} / {target}m {cfg.label}</p>
        <p className="text-[10px] opacity-70">TAT {order.prioritas.replace("_", "-")}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RadOrderHeader({ order }: { order: RadOrder }) {
  const statusCfg = RAD_STATUS_CFG[order.status];
  const modItem   = order.items[0];
  const modCfg    = modItem ? MODALITAS_CFG[modItem.modalitas] : null;
  const urgCfg    = URGENSI_CFG[order.prioritas];
  const curStep   = getStatusStep(order.status);

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <Link
          href="/ehis-care/radiologi"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Radiologi</span>
          <span className="text-slate-200">/</span>
          <span className="truncate text-sm font-bold text-slate-900">{order.noOrder}</span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", urgCfg.badge)}>
            {urgCfg.label}
          </span>
          {modCfg && (
            <span className={cn("rounded-lg px-2 py-1 text-[11px] font-semibold", modCfg.bgColor, modCfg.textColor)}>
              {modCfg.label}
            </span>
          )}
          <span className={cn("flex items-center gap-1.5 rounded-xl px-2.5 py-1", statusCfg.badge)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
            <span className="text-[11px] font-semibold">{statusCfg.label}</span>
          </span>
        </div>
      </div>

      {/* Patient + Order info */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-2 sm:grid-cols-4">
        <div className="flex items-center gap-2">
          <User size={12} className="shrink-0 text-slate-400" />
          <div>
            <p className="text-xs font-bold text-slate-900">{order.namaPasien}</p>
            <p className="text-[10px] text-slate-400">{order.usia}th · {order.gender === "L" ? "Laki-laki" : "Perempuan"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Hash size={12} className="shrink-0 text-slate-400" />
          <div>
            <p className="text-xs font-semibold text-slate-700">{order.noRM}</p>
            <p className="text-[10px] text-slate-400">No. Rekam Medis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Stethoscope size={12} className="shrink-0 text-slate-400" />
          <div>
            <p className="text-xs font-semibold text-slate-700 truncate">{order.dokter}</p>
            <p className="text-[10px] text-slate-400">Dokter Pengirim</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={12} className="shrink-0 text-slate-400" />
          <div>
            <p className="text-xs font-semibold text-slate-700">{order.unitAsal}{order.noBed ? ` · ${order.noBed}` : ""}</p>
            <p className="text-[10px] text-slate-400">{order.ruangan ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* TAT + Progress bar */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <TATDisplay order={order} />

        <div className="flex flex-1 items-center gap-2">
          <AlertTriangle size={11} className={cn(
            "shrink-0",
            order.status === "Ditolak" ? "text-rose-500" : "text-slate-300",
          )} />
          <div className="flex-1">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={cn("absolute inset-y-0 left-0 rounded-full",
                  order.status === "Selesai"  ? "bg-emerald-500" :
                  order.status === "Ditolak"  ? "bg-rose-400"    :
                  order.prioritas === "CITO"  ? "bg-rose-500"    : "bg-teal-500",
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, curStep) / 7 * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Langkah {Math.max(0, curStep)} / 7
            </p>
          </div>
        </div>
      </div>

      {/* TAT Timeline */}
      <div className="overflow-x-auto border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <div className="flex min-w-max items-start gap-0">
          {STEPS.map((s, i) => {
            const ts = order.timestamps[s.key as keyof typeof order.timestamps];
            const stepNum = i;
            const isDone = curStep > stepNum || order.status === "Selesai";
            const isCur  = curStep === stepNum && order.status !== "Selesai" && order.status !== "Ditolak";

            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full",
                    isDone    ? "bg-teal-600 text-white" :
                    isCur     ? "bg-teal-100 ring-2 ring-teal-400 text-teal-700" :
                    "bg-slate-200 text-slate-400",
                  )}>
                    {isDone
                      ? <CheckCircle2 size={11} />
                      : isCur
                      ? <Circle size={7} className="fill-teal-500" />
                      : <Circle size={7} />
                    }
                  </div>
                  <p className={cn(
                    "text-center text-[9px] font-semibold leading-none",
                    isDone ? "text-teal-700" : isCur ? "text-teal-600" : "text-slate-400",
                  )}>
                    {s.label}
                  </p>
                  <p className="text-[9px] text-slate-400">{fmtTimestamp(ts)}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("mx-1 h-px w-8 transition-colors", isDone ? "bg-teal-400" : "bg-slate-200")} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
