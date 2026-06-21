"use client";

// Riwayat pemeriksaan lab (collapsible per order) + modal hasil. Diekstrak dari OrderLabTab.tsx.
// Display-only (mock/DB read). Konfigurasi visual & tipe dari orderLabShared.

import { useState, useEffect } from "react";
import {
  X, Clock, Stethoscope, ChevronDown, ChevronRight, Printer,
  FileText, AlertCircle, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  KATEGORI_ICON, KATEGORI_COLOR, STATUS_ORDER_BADGE, HASIL_STATUS_CLS, KategoriChip,
  type RiwayatOrder,
} from "./orderLabShared";

// ── Hasil modal ───────────────────────────────────────────

function HasilModal({ order, onClose }: { order: RiwayatOrder; onClose: () => void }) {
  const hasil       = order.hasil ?? [];
  const kritisCount = hasil.filter((h) => h.status === "Kritis").length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <FileText size={13} />
              </span>
              <p className="text-sm font-semibold text-slate-800">Hasil Pemeriksaan Lab</p>
              {kritisCount > 0 && (
                <span className="flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 ring-1 ring-rose-200">
                  <AlertCircle size={10} /> {kritisCount} nilai kritis
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-9 text-[11px] text-slate-400">
              <span className="font-mono">{order.noOrder}</span>
              <span>·</span>
              <span>{order.tanggal} {order.jam}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Stethoscope size={10} />{order.dokter}</span>
              <span>·</span>
              <span>{order.unit}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Printer size={12} /> Cetak
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pemeriksaan</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">Hasil</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Satuan</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nilai Normal</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Interpretasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {hasil.map((h, i) => {
                const cls = HASIL_STATUS_CLS[h.status];
                return (
                  <tr key={i} className={cn("transition hover:bg-slate-50/70", h.status === "Kritis" && "bg-rose-50/50")}>
                    <td className="px-5 py-2.5 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        {h.status === "Kritis" && <AlertCircle size={11} className="shrink-0 text-rose-500" />}
                        {h.nama}
                      </div>
                    </td>
                    <td className={cn("px-4 py-2.5 text-right font-bold tabular-nums", cls.val)}>{h.nilai}</td>
                    <td className="px-4 py-2.5 text-slate-500">{h.satuan}</td>
                    <td className="px-4 py-2.5 text-slate-400">{h.nilaiNormal}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", cls.badge)}>{h.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-[11px] text-slate-400">{hasil.length} parameter diperiksa</p>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Riwayat Lab section ───────────────────────────────────

export default function RiwayatLabSection({ riwayat }: { riwayat: RiwayatOrder[] }) {
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set([riwayat[0]?.id]));
  const [modalOrder, setModalOrder] = useState<RiwayatOrder | null>(null);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (riwayat.length === 0) return null;

  return (
    <>
      {modalOrder && <HasilModal order={modalOrder} onClose={() => setModalOrder(null)} />}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
          <Clock size={13} className="text-slate-400" />
          <p className="text-xs font-semibold text-slate-700">Riwayat Pemeriksaan Lab</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {riwayat.length} order
          </span>
        </div>

        <div className="divide-y divide-slate-50">
          {riwayat.map((r) => {
            const open = expanded.has(r.id);
            return (
              <div key={r.id}>
                <div className="flex items-center gap-2 px-4 py-2.5 transition hover:bg-slate-50">
                  <button
                    type="button"
                    onClick={() => toggle(r.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="shrink-0 text-slate-400">
                      {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-semibold text-slate-700">{r.tanggal}</span>
                      <span className="text-[11px] text-slate-400">{r.jam}</span>
                      <span className="font-mono text-[11px] text-slate-400">{r.noOrder}</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Stethoscope size={10} /> {r.dokter}
                      </span>
                      <span className="text-[11px] text-slate-400">{r.unit}</span>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">{r.items.length} tes</span>
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", STATUS_ORDER_BADGE[r.status])}>
                      {r.status}
                    </span>
                    {r.status === "Selesai" && r.hasil && (
                      <button
                        type="button"
                        onClick={() => setModalOrder(r)}
                        className="flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <Eye size={10} /> Lihat Hasil
                      </button>
                    )}
                  </div>
                </div>

                {open && (
                  <div className="border-t border-slate-50 bg-slate-50/40 px-4 pb-3 pt-2">
                    <div className="flex flex-col gap-1.5">
                      {r.items.map((item) => {
                        const color = KATEGORI_COLOR[item.kategori];
                        const Icon  = KATEGORI_ICON[item.kategori];
                        return (
                          <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1", color.bg, color.ring)}>
                              <Icon size={11} className={color.icon} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-slate-800">{item.nama}</p>
                              <p className="text-[10px] text-slate-400">{item.kode}</p>
                            </div>
                            <KategoriChip kategori={item.kategori} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
