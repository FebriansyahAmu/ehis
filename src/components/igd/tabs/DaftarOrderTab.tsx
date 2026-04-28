"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill, FlaskConical, Radiation, Package,
  ChevronDown, ChevronRight, Clock, Stethoscope,
  AlertCircle, LayoutList, ListChecks, Ban, X, CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────

type OrderType   = "Resep" | "Lab" | "Radiologi" | "BMHP";
type OrderStatus = "Menunggu" | "Diterima" | "Diproses" | "Selesai" | "Dibatalkan";
type FilterValue = "Semua" | OrderType;

interface OrderItem {
  id: string;
  nama: string;
  detail?: string;
  keterangan?: string;
  isSpecial?: boolean;
}

interface Order {
  id: string;
  type: OrderType;
  noOrder: string;
  tanggal: string;
  jam: string;
  dokter: string;
  status: OrderStatus;
  catatan?: string;
  tujuan?: string;
  items: OrderItem[];
}

interface ConfirmTarget {
  id: string;
  noOrder: string;
  type: OrderType;
  itemCount: number;
}

interface ToastData {
  uid: number;
  noOrder: string;
  type: OrderType;
}

// ── Config ────────────────────────────────────────────────

interface TypeCfg {
  label: string;
  icon: LucideIcon;
  softBg: string;
  text: string;
  ring: string;
  iconCls: string;
  border: string;
}

const TYPE_CFG: Record<OrderType, TypeCfg> = {
  Resep: {
    label:   "Resep",
    icon:    Pill,
    softBg:  "bg-indigo-50",
    text:    "text-indigo-700",
    ring:    "ring-indigo-200",
    iconCls: "text-indigo-500",
    border:  "border-indigo-100",
  },
  Lab: {
    label:   "Lab",
    icon:    FlaskConical,
    softBg:  "bg-sky-50",
    text:    "text-sky-700",
    ring:    "ring-sky-200",
    iconCls: "text-sky-500",
    border:  "border-sky-100",
  },
  Radiologi: {
    label:   "Radiologi",
    icon:    Radiation,
    softBg:  "bg-teal-50",
    text:    "text-teal-700",
    ring:    "ring-teal-200",
    iconCls: "text-teal-500",
    border:  "border-teal-100",
  },
  BMHP: {
    label:   "BMHP",
    icon:    Package,
    softBg:  "bg-amber-50",
    text:    "text-amber-700",
    ring:    "ring-amber-200",
    iconCls: "text-amber-500",
    border:  "border-amber-100",
  },
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  Menunggu:   "bg-slate-100   text-slate-600   ring-1 ring-slate-200",
  Diterima:   "bg-sky-50      text-sky-700     ring-1 ring-sky-200",
  Diproses:   "bg-amber-50    text-amber-700   ring-1 ring-amber-200",
  Selesai:    "bg-emerald-50  text-emerald-700 ring-1 ring-emerald-200",
  Dibatalkan: "bg-rose-50     text-rose-500    ring-1 ring-rose-200",
};

const STATUS_STEPS: OrderStatus[] = ["Menunggu", "Diterima", "Diproses", "Selesai"];

// ── Mock data ─────────────────────────────────────────────

const ORDERS_MOCK: Record<string, Order[]> = {
  "RM-2025-005": [
    {
      id: "do-bmhp-1",
      type: "BMHP",
      noOrder: "BMHP/2026/04/0088",
      tanggal: "14 April 2026",
      jam: "11:15",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Diproses",
      tujuan: "Gudang Farmasi IGD",
      items: [
        { id: "bi-1", nama: "Infus Set Dewasa",       detail: "×2 pcs"    },
        { id: "bi-2", nama: "Abocath No.18",          detail: "×3 pcs"    },
        { id: "bi-3", nama: "NaCl 0,9% 500mL",       detail: "×4 botol"  },
        { id: "bi-4", nama: "Kasa Steril 10×10cm",   detail: "×5 lembar" },
        { id: "bi-5", nama: "Plester Elastis 10cm",  detail: "×1 roll"   },
      ],
    },
    {
      id: "do-rad-1",
      type: "Radiologi",
      noOrder: "RAD/2026/04/0044",
      tanggal: "14 April 2026",
      jam: "10:40",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Menunggu",
      catatan: "Cek cardiomegaly & efusi pleura",
      tujuan: "Instalasi Radiologi",
      items: [
        { id: "ri-1", nama: "Foto Thorax AP/PA", detail: "RAD-001" },
        { id: "ri-2", nama: "EKG 12 Lead",       detail: "RAD-011" },
      ],
    },
    {
      id: "do-rx-1",
      type: "Resep",
      noOrder: "RES/2026/04/0201",
      tanggal: "14 April 2026",
      jam: "11:00",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Menunggu",
      tujuan: "Depo IGD",
      items: [
        { id: "rxi-1", nama: "Aspirin 100mg",       detail: "1×1 · Oral · ×30",    keterangan: "PC" },
        { id: "rxi-2", nama: "Morfin 10mg/mL Inj",  detail: "PRN · IV Bolus · ×3", keterangan: "Titrasi 2-4mg", isSpecial: true },
        { id: "rxi-3", nama: "NaCl 0,9% 500mL",    detail: "IV Drip · ×2",        keterangan: "KCL 20 mEq add-mix" },
      ],
    },
    {
      id: "do-lab-1",
      type: "Lab",
      noOrder: "LAB/2026/04/0312",
      tanggal: "14 April 2026",
      jam: "10:35",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Diproses",
      catatan: "CITO — Troponin urgent",
      tujuan: "Laboratorium Klinik",
      items: [
        { id: "li-1", nama: "Troponin I / T",          detail: "LAB-K018 · 30 mnt",   isSpecial: true },
        { id: "li-2", nama: "Darah Lengkap (DL)",      detail: "LAB-H001 · 1–2 jam" },
        { id: "li-3", nama: "Analisa Gas Darah (AGD)", detail: "LAB-A001 · 30 mnt"  },
      ],
    },
    {
      id: "do-rx-2",
      type: "Resep",
      noOrder: "RES/2026/04/0189",
      tanggal: "10 April 2026",
      jam: "09:30",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Selesai",
      tujuan: "Apotek Rawat Jalan",
      items: [
        { id: "rxi-4", nama: "Aspirin 100mg",     detail: "1×1 · Oral · ×30" },
        { id: "rxi-5", nama: "Atorvastatin 20mg", detail: "1×1 · Oral · ×30" },
        { id: "rxi-6", nama: "Amlodipine 5mg",    detail: "1×1 · Oral · ×30" },
      ],
    },
    {
      id: "do-lab-2",
      type: "Lab",
      noOrder: "LAB/2026/04/0189",
      tanggal: "10 April 2026",
      jam: "08:15",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Selesai",
      tujuan: "Laboratorium Klinik",
      items: [
        { id: "li-4", nama: "Kolesterol Total", detail: "LAB-K011" },
        { id: "li-5", nama: "HDL Kolesterol",   detail: "LAB-K013" },
        { id: "li-6", nama: "LDL Kolesterol",   detail: "LAB-K014" },
        { id: "li-7", nama: "Trigliserida",     detail: "LAB-K012" },
      ],
    },
    {
      id: "do-rad-2",
      type: "Radiologi",
      noOrder: "RAD/2026/02/0011",
      tanggal: "12 Februari 2026",
      jam: "10:05",
      dokter: "dr. Anisa Putri, Sp.PD",
      status: "Selesai",
      tujuan: "Instalasi Radiologi",
      items: [
        { id: "ri-3", nama: "Foto Thorax AP",             detail: "RAD-001" },
        { id: "ri-4", nama: "CT Scan Thorax Non Kontras", detail: "RAD-015" },
      ],
    },
    {
      id: "do-bmhp-2",
      type: "BMHP",
      noOrder: "BMHP/2026/02/0021",
      tanggal: "12 Februari 2026",
      jam: "10:10",
      dokter: "dr. Anisa Putri, Sp.PD",
      status: "Selesai",
      tujuan: "Gudang Farmasi IGD",
      items: [
        { id: "bi-6", nama: "Sarung Tangan Steril No.7", detail: "×5 pasang" },
        { id: "bi-7", nama: "Folley Catheter No.16",     detail: "×1 pcs"    },
        { id: "bi-8", nama: "Urine Bag 2000mL",          detail: "×1 pcs"    },
      ],
    },
  ],
  "RM-2025-012": [
    {
      id: "do-bmhp-3",
      type: "BMHP",
      noOrder: "BMHP/2026/04/0071",
      tanggal: "14 April 2026",
      jam: "11:20",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Diterima",
      tujuan: "Gudang Farmasi IGD",
      items: [
        { id: "bi-9",  nama: "Infus Set Dewasa",   detail: "×1 pcs"   },
        { id: "bi-10", nama: "Abocath No.20",       detail: "×2 pcs"   },
        { id: "bi-11", nama: "Ringer Laktat 500mL", detail: "×3 botol" },
      ],
    },
    {
      id: "do-lab-3",
      type: "Lab",
      noOrder: "LAB/2026/04/0305",
      tanggal: "14 April 2026",
      jam: "11:08",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Menunggu",
      tujuan: "Laboratorium Klinik",
      items: [
        { id: "li-8", nama: "GDS (Gula Darah Sewaktu)", detail: "LAB-K001 · 15 mnt" },
        { id: "li-9", nama: "HbA1c",                   detail: "LAB-K003 · 2 jam"  },
      ],
    },
    {
      id: "do-rx-3",
      type: "Resep",
      noOrder: "RES/2026/04/0155",
      tanggal: "8 April 2026",
      jam: "09:00",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Selesai",
      tujuan: "Apotek Rawat Jalan",
      items: [
        { id: "rxi-7", nama: "Metformin 500mg", detail: "2×1 · Oral · ×60" },
        { id: "rxi-8", nama: "Omeprazole 20mg", detail: "1×1 · Oral · ×30" },
      ],
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────

function groupByDate(orders: Order[]): [string, Order[]][] {
  const map = new Map<string, Order[]>();
  for (const o of orders) {
    if (!map.has(o.tanggal)) map.set(o.tanggal, []);
    map.get(o.tanggal)!.push(o);
  }
  return [...map.entries()];
}

const TODAY = "14 April 2026";

// ── Type badge ────────────────────────────────────────────

function TypeBadge({ type }: { type: OrderType }) {
  const cfg  = TYPE_CFG[type];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1",
        cfg.softBg, cfg.text, cfg.ring,
      )}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

// ── Status pipeline (active orders only) ──────────────────

function StatusPipeline({ status }: { status: OrderStatus }) {
  if (status === "Selesai" || status === "Dibatalkan") return null;
  const current = STATUS_STEPS.indexOf(status);
  return (
    <div className="mt-2 flex items-center gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done   = i <= current;
        const isLast = i === STATUS_STEPS.length - 1;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold transition-colors",
                  done ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 ring-1 ring-slate-200",
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  "text-[8px] font-medium leading-none",
                  done ? "text-indigo-600" : "text-slate-400",
                  i === current && "font-bold",
                )}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mb-3.5 h-px w-8 transition-colors sm:w-12",
                  i < current ? "bg-indigo-300" : "bg-slate-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Confirm cancel dialog ─────────────────────────────────

function ConfirmCancelDialog({
  target,
  onConfirm,
  onClose,
}: {
  target: ConfirmTarget;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cfg  = TYPE_CFG[target.type];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-rose-200">
            <Ban size={17} className="text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-700">Batalkan Order?</p>
            <p className="text-[11px] text-rose-400">Tindakan ini tidak dapat dibatalkan</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-rose-300 transition hover:bg-rose-100 hover:text-rose-500"
            aria-label="Tutup"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* Order summary */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                cfg.softBg, cfg.ring,
              )}
            >
              <Icon size={16} className={cfg.iconCls} />
            </span>
            <div className="min-w-0">
              <TypeBadge type={target.type} />
              <p className="mt-1 font-mono text-[11px] font-semibold text-slate-700">{target.noOrder}</p>
              <p className="text-[10px] text-slate-400">{target.itemCount} item dalam order ini</p>
            </div>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
            Order ini akan ditandai sebagai{" "}
            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-600 ring-1 ring-rose-100">
              Dibatalkan
            </span>{" "}
            dan tidak dapat diproses lebih lanjut oleh unit terkait.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
          >
            Ya, Batalkan
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Cancel toast notification ─────────────────────────────

function CancelToast({ data, onClose }: { data: ToastData; onClose: () => void }) {
  return (
    <motion.div
      key={data.uid}
      className="fixed bottom-5 right-4 z-50 w-72 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 sm:right-6 sm:w-80"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-200">
          <CheckCircle2 size={15} className="text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-800">Order Berhasil Dibatalkan</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={data.type} />
            <span className="font-mono text-[10px] text-slate-500">{data.noOrder}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Tutup notifikasi"
        >
          <X size={13} />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="h-0.5 w-full bg-slate-100">
        <motion.div
          className="h-full bg-emerald-400"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 3.5, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

// ── Single order row ──────────────────────────────────────

function OrderRow({
  order,
  onRequestCancel,
}: {
  order: Order;
  onRequestCancel: (id: string, noOrder: string, type: OrderType, itemCount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg         = TYPE_CFG[order.type];
  const Icon        = cfg.icon;
  const isActive    = ["Menunggu", "Diterima", "Diproses"].includes(order.status);
  const isCancelled = order.status === "Dibatalkan";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-all duration-150",
        isActive
          ? cn("border-slate-200 bg-white shadow-xs", open && "shadow-md")
          : isCancelled
            ? "border-rose-100 bg-rose-50/20 opacity-60"
            : "border-slate-100 bg-slate-50/50",
      )}
    >
      {/* Row header — clickable to expand */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors",
          open ? "bg-slate-50/60" : "hover:bg-slate-50/70",
        )}
      >
        {/* Type icon */}
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
            cfg.softBg, cfg.ring,
          )}
        >
          <Icon size={14} className={cfg.iconCls} />
        </span>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={order.type} />
            <span className="font-mono text-[11px] text-slate-400">{order.noOrder}</span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-0.5">
              <Clock size={9} />
              {order.jam}
            </span>
            <span className="text-slate-200">·</span>
            <span className="flex items-center gap-0.5 truncate">
              <Stethoscope size={9} className="shrink-0" />
              {order.dokter}
            </span>
            {order.tujuan && (
              <>
                <span className="hidden text-slate-200 sm:inline">·</span>
                <span className="hidden text-slate-400 sm:inline">{order.tujuan}</span>
              </>
            )}
          </div>

          {order.catatan && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
              <AlertCircle size={9} />
              {order.catatan}
            </p>
          )}

          {isActive && open && <StatusPipeline status={order.status} />}
        </div>

        {/* Right: status + count + chevron */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", STATUS_BADGE[order.status])}>
            {order.status}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span>{order.items.length} item</span>
            {open
              ? <ChevronDown size={10} className="text-slate-400" />
              : <ChevronRight size={10} className="text-slate-400" />
            }
          </div>
        </div>
      </button>

      {/* Expanded item list */}
      {open && (
        <div className={cn("border-t px-4 pb-3 pt-2.5", cfg.border, cfg.softBg + "/30")}>
          <div className="flex flex-col gap-1.5">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-lg border border-white/80 bg-white px-3 py-2 shadow-xs"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
                    cfg.softBg,
                  )}
                >
                  <Icon size={10} className={cfg.iconCls} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-800">{item.nama}</p>
                    {item.isSpecial && (
                      <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-200">
                        KHUSUS
                      </span>
                    )}
                  </div>
                  {(item.detail || item.keterangan) && (
                    <p className="text-[10px] text-slate-400">
                      {item.detail}
                      {item.keterangan && (
                        <span className="ml-1 italic text-slate-400">({item.keterangan})</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Cancel button — active orders only */}
          {isActive && (
            <div className="mt-3 flex justify-end border-t border-slate-100 pt-2.5">
              <button
                type="button"
                onClick={() =>
                  onRequestCancel(order.id, order.noOrder, order.type, order.items.length)
                }
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 active:scale-95"
              >
                <Ban size={11} />
                Batalkan Order
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────

function StatCard({
  type, orders, active: isActive, onClick,
}: {
  type: OrderType;
  orders: Order[];
  active: boolean;
  onClick: () => void;
}) {
  const cfg   = TYPE_CFG[type];
  const Icon  = cfg.icon;
  const total   = orders.length;
  const inProg  = orders.filter((o) => ["Menunggu", "Diterima", "Diproses"].includes(o.status)).length;
  const selesai = orders.filter((o) => o.status === "Selesai").length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md",
        isActive
          ? cn("shadow-sm", cfg.softBg, cfg.ring, "ring-2")
          : "border-slate-200 bg-white hover:shadow-sm",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
          isActive ? "bg-white" : cfg.softBg,
          cfg.ring,
        )}
      >
        <Icon size={15} className={cfg.iconCls} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-[10px] font-bold uppercase tracking-wide", isActive ? cfg.text : "text-slate-400")}>
          {cfg.label}
        </p>
        <p className="mt-0.5 text-lg font-black leading-none tabular-nums text-slate-900">{total}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[10px]">
          {inProg > 0 && (
            <span className="font-semibold text-amber-600">{inProg} aktif</span>
          )}
          <span className="text-slate-400">{selesai} selesai</span>
        </div>
      </div>
    </button>
  );
}

// ── Date separator ────────────────────────────────────────

function DateSep({ tanggal }: { tanggal: string }) {
  const label = tanggal === TODAY ? "Hari ini" : tanggal;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="h-px flex-1 bg-slate-100" />
      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterValue }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-14 text-center">
      <LayoutList size={22} className="text-slate-300" />
      <p className="text-xs font-medium text-slate-400">
        {filter === "Semua"
          ? "Belum ada order untuk pasien ini"
          : `Tidak ada order ${filter} ditemukan`}
      </p>
    </div>
  );
}

// ── Filter options ────────────────────────────────────────

const FILTER_OPTS: { value: FilterValue; label: string }[] = [
  { value: "Semua",     label: "Semua"     },
  { value: "Resep",     label: "Resep"     },
  { value: "Lab",       label: "Lab"       },
  { value: "Radiologi", label: "Radiologi" },
  { value: "BMHP",      label: "BMHP"      },
];

// ── Main component ────────────────────────────────────────

export default function DaftarOrderTab({ patient }: { patient: IGDPatientDetail }) {
  const [orders, setOrders]             = useState<Order[]>(() => ORDERS_MOCK[patient.noRM] ?? []);
  const [filter, setFilter]             = useState<FilterValue>("Semua");
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [toast, setToast]               = useState<ToastData | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function handleRequestCancel(id: string, noOrder: string, type: OrderType, itemCount: number) {
    setConfirmTarget({ id, noOrder, type, itemCount });
  }

  function handleConfirmCancel() {
    if (!confirmTarget) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === confirmTarget.id ? { ...o, status: "Dibatalkan" as OrderStatus } : o,
      ),
    );
    setToast({ uid: Date.now(), noOrder: confirmTarget.noOrder, type: confirmTarget.type });
    setConfirmTarget(null);
  }

  const filtered    = filter === "Semua" ? orders : orders.filter((o) => o.type === filter);
  const activeCount = orders.filter((o) => ["Menunggu", "Diterima", "Diproses"].includes(o.status)).length;
  const grouped     = groupByDate(filtered);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Active orders banner ── */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <p className="text-[11px] font-semibold text-amber-700">
            {activeCount} order sedang berjalan — pantau status secara berkala
          </p>
        </div>
      )}

      {/* ── Stat cards — 2×2 mobile, 4×1 sm+ ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["Resep", "Lab", "Radiologi", "BMHP"] as OrderType[]).map((type) => (
          <StatCard
            key={type}
            type={type}
            orders={orders.filter((o) => o.type === type)}
            active={filter === type}
            onClick={() => setFilter((f) => f === type ? "Semua" : type)}
          />
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        <ListChecks size={13} className="shrink-0 text-slate-400" />
        {FILTER_OPTS.map(({ value, label }) => {
          const count    = value === "Semua" ? orders.length : orders.filter((o) => o.type === value).length;
          const isActive = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                isActive
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-xs"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              {label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Order list grouped by date ── */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="flex flex-col gap-2">
          {grouped.map(([tanggal, grpOrders]) => (
            <div key={tanggal} className="flex flex-col gap-2">
              <DateSep tanggal={tanggal} />
              {grpOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onRequestCancel={handleRequestCancel}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Confirm cancel dialog ── */}
      <AnimatePresence>
        {confirmTarget && (
          <ConfirmCancelDialog
            target={confirmTarget}
            onConfirm={handleConfirmCancel}
            onClose={() => setConfirmTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Toast notification ── */}
      <AnimatePresence>
        {toast && (
          <CancelToast
            data={toast}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
