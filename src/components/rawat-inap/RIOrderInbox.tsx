"use client";

// Order Masuk Rawat Inap — pasien yang sudah DIDAFTARKAN admisi (via SPRI, status Registered)
// + bed sudah DIRESERVASI, tapi belum diterima bangsal. Pola mirror IGD: kartu order + "Terima
// Order" → transisi receive (Reserved→Occupied) → pasien pindah ke census. Read-only di sini,
// satu aksi tulis (Terima). Accent emerald (modul RI) · amber = menunggu diterima.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Inbox, Stethoscope, DoorOpen, BedDouble, Shield, CheckCircle2, Loader2,
  Clock, CalendarDays, ClipboardList, AlertTriangle, X, Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RIKelas, RIPenjamin } from "@/lib/data";
import { RI_KELAS_CFG, RI_PENJAMIN_LABEL } from "./riLandingShared";

/** Aksi yang sedang berjalan (drive spinner per-tombol). */
export type RIOrderBusy = { id: string; action: "receive" | "cancel" } | null;

export interface RIOrder {
  id: string;
  version: number;
  noRM: string;
  noKunjungan: string;
  name: string;
  age: number;
  gender: string;
  ruangan: string;
  kelas: RIKelas;
  bedKode: string | null; // bed yang direservasi admisi (null = belum direservasi)
  dpjp: string;
  admitDate: string; // waktuKunjungan = rencana masuk
  penjamin: RIPenjamin;
  sepNoSep: string | null;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function RIOrderInbox({
  orders,
  onTerima,
  onBatalkan,
  busy,
}: {
  orders: RIOrder[];
  onTerima: (o: RIOrder) => void;
  onBatalkan: (o: RIOrder) => Promise<void>;
  busy: RIOrderBusy;
}) {
  const [cancelTarget, setCancelTarget] = useState<RIOrder | null>(null);

  if (orders.length === 0) return null;

  async function confirmCancel() {
    if (!cancelTarget) return;
    await onBatalkan(cancelTarget); // parent: transisi + toast + refetch (tidak melempar)
    setCancelTarget(null);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-amber-200/70 bg-amber-50 px-5 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 ring-1 ring-amber-200">
          <Inbox size={14} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-900">Order Masuk — Menunggu Diterima</p>
          <p className="text-[10px] text-amber-700/80">
            Pasien sudah didaftarkan admisi &amp; bed direservasi — terima order untuk memulai perawatan.
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white">
          <Clock size={11} /> {orders.length}
        </span>
      </div>

      {/* Grid kartu order */}
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            busyAction={busy?.id === o.id ? busy.action : null}
            locked={busy !== null && busy.id !== o.id}
            onTerima={() => onTerima(o)}
            onBatalkan={() => setCancelTarget(o)}
          />
        ))}
      </div>

      <RICancelOrderDialog
        order={cancelTarget}
        busy={cancelTarget !== null && busy?.id === cancelTarget.id && busy.action === "cancel"}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}

function OrderCard({
  order, busyAction, locked, onTerima, onBatalkan,
}: {
  order: RIOrder;
  busyAction: "receive" | "cancel" | null; // aksi berjalan utk kartu ini
  locked: boolean;                          // aksi berjalan di kartu lain
  onTerima: () => void;
  onBatalkan: () => void;
}) {
  const cfg = RI_KELAS_CFG[order.kelas];
  const KIcon = cfg.icon;
  const noBed = !order.bedKode;
  const busy = busyAction !== null;
  const disabled = busy || locked;

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header pasien */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-black text-emerald-700">
            {order.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-slate-800">{order.name}</p>
            <p className="font-mono text-[10px] text-slate-400">
              RM {order.noRM} · {order.gender === "L" ? "♂" : "♀"} {order.age}th
            </p>
          </div>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white", cfg.header)}>
          <KIcon size={10} /> {cfg.label}
        </span>
      </div>

      {/* Detail */}
      <div className="flex flex-1 flex-col gap-1.5 px-3.5 py-3">
        <Row icon={<Stethoscope size={12} className="text-violet-400" />} label="DPJP">{order.dpjp}</Row>
        <Row icon={<DoorOpen size={12} className="text-sky-400" />} label="Ruangan">{order.ruangan}</Row>
        <Row icon={<BedDouble size={12} className="text-teal-400" />} label="Bed">
          {order.bedKode ? (
            <span className="font-mono font-semibold text-slate-700">{order.bedKode}</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <AlertTriangle size={11} /> belum direservasi
            </span>
          )}
        </Row>
        <Row icon={<Shield size={12} className="text-emerald-400" />} label="Penjamin">{RI_PENJAMIN_LABEL[order.penjamin]}</Row>
        <Row icon={<CalendarDays size={12} className="text-slate-400" />} label="Didaftarkan">{fmtDateTime(order.admitDate)}</Row>
        <Row icon={<ClipboardList size={12} className="text-slate-400" />} label="No. SEP">
          {order.sepNoSep
            ? <span className="font-mono font-semibold text-emerald-700">{order.sepNoSep}</span>
            : <span className="text-slate-400">—</span>}
        </Row>
      </div>

      {/* Aksi */}
      <div className="flex items-center gap-2 border-t border-slate-100 px-3.5 py-2.5">
        <button
          type="button"
          onClick={onBatalkan}
          disabled={disabled}
          title="Batalkan order — kunjungan dibatalkan & reservasi bed dilepas"
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[12px] font-semibold transition active:scale-[0.98]",
            disabled
              ? "cursor-not-allowed border-slate-200 text-slate-300"
              : "border-rose-200 text-rose-600 hover:bg-rose-50",
          )}
        >
          {busyAction === "cancel" ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
          Batalkan
        </button>
        <button
          type="button"
          onClick={onTerima}
          disabled={disabled}
          title={noBed ? "Bed belum direservasi — pasien tetap diterima, alokasi bed menyusul" : "Terima order & tempati bed reservasi"}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition active:scale-[0.98]",
            disabled ? "cursor-not-allowed bg-slate-300" : "bg-emerald-600 hover:bg-emerald-700",
          )}
        >
          {busyAction === "receive" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {busyAction === "receive" ? "Memproses…" : "Terima Order"}
        </button>
      </div>
    </motion.div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="flex w-[88px] shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {icon}{label}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{children}</span>
    </div>
  );
}

// ── Konfirmasi Batalkan Order ─────────────────────────────────────────────────────
// Semi-destruktif: membatalkan kunjungan (Registered→Cancelled) + melepas reservasi bed.
// a11y: role=dialog · Escape menutup (kecuali busy) · fokus awal ke "Tidak" · backdrop tutup.
function RICancelOrderDialog({
  order, busy, onConfirm, onCancel,
}: {
  order: RIOrder | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const reduce = useReducedMotion();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const open = order !== null;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => cancelRef.current?.focus(), 50);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [open, busy, onCancel]);

  if (typeof document === "undefined") return null; // SSR guard (portal butuh document.body)

  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.92, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 8 },
      };

  return createPortal(
    <AnimatePresence>
      {open && order && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !busy && onCancel()}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Konfirmasi batalkan order rawat inap"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            {...card}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-rose-200">
                <Ban size={17} className="text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-rose-700">Batalkan Order Rawat Inap?</p>
                <p className="text-[11px] text-rose-400">Pendaftaran dibatalkan &amp; reservasi bed dilepas</p>
              </div>
              <button
                type="button" onClick={onCancel} disabled={busy} aria-label="Tutup"
                className="rounded-lg p-1 text-rose-300 transition hover:bg-rose-100 hover:text-rose-500 disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
                  {order.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-slate-800">{order.name}</p>
                  <p className="font-mono text-[10px] text-slate-400">
                    RM {order.noRM} · {order.noKunjungan}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
                Order admisi ini akan{" "}
                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-600 ring-1 ring-rose-100">
                  dibatalkan
                </span>
                {order.bedKode ? (
                  <> dan bed <span className="font-mono font-semibold text-slate-700">{order.bedKode}</span> dilepas kembali (tersedia).</>
                ) : (
                  <> (belum ada bed yang direservasi).</>
                )}{" "}
                Pendaftaran ulang dilakukan dari Admisi bila diperlukan.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 border-t border-slate-100 px-5 py-4">
              <button
                ref={cancelRef} type="button" onClick={onCancel} disabled={busy}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95 disabled:opacity-50"
              >
                Tidak
              </button>
              <button
                type="button" onClick={onConfirm} disabled={busy}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-white shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-rose-300 active:scale-95",
                  busy ? "cursor-not-allowed bg-rose-400" : "bg-rose-600 hover:bg-rose-700",
                )}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Ban size={13} />}
                {busy ? "Membatalkan…" : "Ya, Batalkan Order"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
