"use client";

// Inbox order Radiologi (DB) — order masuk dari klinis (IGD/RI/RJ) yang siap diterima unit Radiologi.
// Mirror alur "Belum Diterima" Lab. Terima → status Menunggu → Diterima (receiveRadOrder). RBAC
// ancillary.rad.worklist:update + ABAC SDM Assignment (server). Order lifecycle penuh (akuisisi/
// ekspertise/validasi) menyusul — board mock lama tetap di bawah utk workflow demo.

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Clock, Stethoscope, CheckCircle2, Loader2, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { listRadWorklist, receiveRadOrder, type RadOrderWorklistDTO } from "@/lib/api/rad/radOrder";

const MODALITAS_LABEL: Record<string, string> = {
  XR: "X-Ray", CT: "CT Scan", MR: "MRI", RF: "Fluoroskopi", US: "USG", MG: "Mammografi", DXA: "Densitometri", NM: "Ked. Nuklir",
};
const modLabel = (m: string) => MODALITAS_LABEL[m] ?? m;

const PRIO_BADGE: Record<string, string> = {
  CITO: "bg-rose-500 text-white",
  Segera: "bg-amber-500 text-white",
  Rutin: "bg-slate-200 text-slate-700",
};

const fmtJam = (iso: string) => new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function usia(tglLahir: string | null): string {
  if (!tglLahir) return "—";
  const t = new Date(tglLahir);
  const now = new Date();
  let u = now.getFullYear() - t.getFullYear();
  const m = now.getMonth() - t.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < t.getDate())) u--;
  return `${u} th`;
}

/** Naik tiap kali jumlah pending berubah → parent (RadPageView) update badge. */
export default function RadInbox({ onPendingChange }: { onPendingChange?: (n: number) => void }) {
  const [orders, setOrders]   = useState<RadOrderWorklistDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState<string | null>(null);

  const refetch = useCallback(async (signal?: AbortSignal) => {
    try {
      const rows = await listRadWorklist({}, signal);
      if (!signal?.aborted) setOrders(rows);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Gagal memuat order radiologi", e instanceof ApiError ? e.message : undefined);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void refetch(ac.signal);
    return () => ac.abort();
  }, [refetch]);

  const belum   = useMemo(() => orders.filter((o) => o.status === "Menunggu"), [orders]);
  const diterima = useMemo(() => orders.filter((o) => o.status === "Diterima"), [orders]);

  useEffect(() => { onPendingChange?.(belum.length); }, [belum.length, onPendingChange]);

  async function terima(id: string) {
    setBusyId(id);
    try {
      await receiveRadOrder(id);
      toast.success("Order diterima", "Masuk worklist Radiologi");
      await refetch();
    } catch (e) {
      toast.error("Gagal menerima order", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-slate-400">
        <Loader2 size={15} className="animate-spin" /> <span className="text-xs">Memuat order…</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <Inbox size={14} className="text-teal-500" />
        <p className="text-xs font-semibold text-slate-700">Order Masuk dari Klinis</p>
        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 ring-1 ring-teal-200">
          {belum.length} belum diterima
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Belum diterima */}
        {belum.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-8 text-center">
            <CheckCircle2 size={22} className="text-emerald-300" />
            <p className="text-xs text-slate-400">Tidak ada order baru menunggu diterima</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {belum.map((o) => (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-xl border border-amber-200 bg-amber-50/40 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                        <User size={11} className="text-slate-400" />{o.namaPasien}
                      </span>
                      <span className="text-[11px] text-slate-400">{o.noRM} · {o.gender === "L" ? "L" : "P"} · {usia(o.tanggalLahir)}</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", PRIO_BADGE[o.prioritas] ?? PRIO_BADGE.Rutin)}>
                        {o.prioritas}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-0.5"><Clock size={9} />{fmtJam(o.createdAt)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Stethoscope size={9} />{o.penulis}</span>
                      <span>·</span>
                      <span>{o.unit}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => terima(o.id)}
                    disabled={busyId === o.id}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
                  >
                    {busyId === o.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                    Terima
                  </button>
                </div>

                {/* Items */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {o.items.map((it) => (
                    <span key={it.id} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                      {it.nama}
                      <span className="text-slate-400">· {modLabel(it.modalitas)}</span>
                    </span>
                  ))}
                </div>
                {o.catatan && <p className="mt-1.5 text-[11px] text-amber-700">Klinis: {o.catatan}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Sudah diterima (ringkas) */}
        {diterima.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Sudah Diterima ({diterima.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {diterima.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-1.5">
                  <span className="text-[11px] font-semibold text-slate-700">{o.namaPasien}</span>
                  <span className="text-[10px] text-slate-400">{o.noRM} · {o.unit}</span>
                  <span className="ml-auto text-[10px] text-slate-400">{o.items.length} pemeriksaan</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Diterima</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
