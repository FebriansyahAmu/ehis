"use client";

// Riwayat Order Lab — daftar order pemeriksaan lab yang sudah dikirim pada kunjungan ini +
// status pemenuhan Laboratorium (Belum Diterima / Diproses / Selesai). Read-only advisory utk
// klinisi, dengan aksi Salin (re-order) & Batalkan (saat Menunggu). Sumber: GET /kunjungan/:id/lab.
// Pasien demo (non-UUID) → panel disembunyikan. Selaras shared/resep/RiwayatOrderResep.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, RefreshCw, Loader2, ChevronDown, Clock, FlaskConical, Copy, Ban, Wallet, AlertCircle, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { listLabOrders, cancelLabOrder, type LabOrderDTO } from "@/lib/api/lab/labOrder";
import { getLabResultForKunjungan, type LabResultDTO } from "@/lib/api/lab/labResult";
import {
  KategoriChip, fmtRp, toKategoriLab,
  labOrderBucket, labOrderStatusCfg, labOrderRowBg, type LabOrderBucket,
} from "./orderLabShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Gaya flag hasil (self-contained — hindari dependensi modul worklist lab).
const FLAG_STYLE: Record<"N" | "H" | "L" | "C", { cls: string; badge: string; label: string; rowBg: string }> = {
  N: { cls: "text-emerald-600",         badge: "bg-emerald-50 text-emerald-700", label: "N",      rowBg: "" },
  H: { cls: "text-amber-700 font-bold", badge: "bg-amber-100 text-amber-700",    label: "H ↑",    rowBg: "bg-amber-50/40" },
  L: { cls: "text-sky-700 font-bold",   badge: "bg-sky-100 text-sky-700",        label: "L ↓",    rowBg: "bg-sky-50/40" },
  C: { cls: "text-rose-700 font-bold",  badge: "bg-rose-100 text-rose-700",      label: "KRITIS", rowBg: "bg-rose-50" },
};

function fmtHasilWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Hasil pemeriksaan (read-only, dikelompokkan per kategori; hanya parameter terisi) ──
function LabHasilView({ res }: { res: LabResultDTO }) {
  const rows = res.values.filter((v) => (v.nilai ?? "").trim() !== "");
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[11px] text-slate-400">Tidak ada parameter terisi.</p>;
  }
  const grouped = new Map<string, typeof rows>();
  for (const v of rows) {
    const list = grouped.get(v.kategori) ?? [];
    list.push(v);
    grouped.set(v.kategori, list);
  }

  return (
    <div className="space-y-3">
      {[...grouped.entries()].map(([kat, items]) => (
        <div key={kat} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{kat}</div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-100 text-[9px] uppercase tracking-wide text-slate-400">
                <th className="px-3 py-1.5 text-left font-semibold">Parameter</th>
                <th className="px-3 py-1.5 text-center font-semibold">Hasil</th>
                <th className="px-3 py-1.5 text-left font-semibold">Satuan</th>
                <th className="px-3 py-1.5 text-left font-semibold">Rujukan</th>
                <th className="px-3 py-1.5 text-left font-semibold">Flag</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => {
                const fs = v.flag ? FLAG_STYLE[v.flag] : null;
                return (
                  <tr key={v.id} className={cn("border-b border-slate-50 last:border-0", fs?.rowBg)}>
                    <td className="px-3 py-1.5 text-slate-700">{v.nama}</td>
                    <td className={cn("px-3 py-1.5 text-center text-sm font-bold", fs?.cls ?? "text-slate-700")}>{v.nilai}</td>
                    <td className="px-3 py-1.5 text-slate-500">{v.satuan || "—"}</td>
                    <td className="px-3 py-1.5 text-slate-500">{v.rujukanStr}</td>
                    <td className="px-3 py-1.5">
                      {fs && <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", fs.badge)}>{fs.label}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {/* Meta penandatangan + catatan */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Analis Pelaksana", res.analis || "—"],
            ["Validator (SpPK)", res.validator || "—"],
            ["Waktu Rilis", res.validatedAt ? fmtHasilWaktu(res.validatedAt) : "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{k}</p>
              <p className="mt-0.5 text-[12px] font-semibold text-slate-700">{v}</p>
            </div>
          ))}
        </div>
        {res.catatanValidator && (
          <div className="mt-2.5 border-t border-slate-200 pt-2.5 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-500">Catatan Validator: </span>{res.catatanValidator}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal hasil pemeriksaan ───────────────────────────────────────────────────
function LabHasilModal({
  kunjunganId, order, onClose,
}: { kunjunganId: string; order: LabOrderDTO; onClose: () => void }) {
  const [res, setRes] = useState<LabResultDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    getLabResultForKunjungan(kunjunganId, order.id, ac.signal)
      .then((r) => { if (!ac.signal.aborted) { setRes(r); setLoading(false); } })
      .catch(() => { if (!ac.signal.aborted) { setRes(null); setLoading(false); } });
    return () => ac.abort();
  }, [kunjunganId, order.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const total = orderTotal(order);
  const critCount = res?.values.filter((v) => v.flag === "C" && v.nilai).length ?? 0;
  const abnCount = res?.values.filter((v) => (v.flag === "H" || v.flag === "L") && v.nilai).length ?? 0;

  // Portal ke <body> — hindari containing-block dari ancestor ber-transform (motion.div tab)
  // yang membuat `fixed inset-0` hanya menutupi area konten, bukan seluruh layar.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-10 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Hasil pemeriksaan laboratorium"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="mb-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <FlaskConical size={18} className="text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-100">Hasil Pemeriksaan Laboratorium</p>
              <p className="truncate text-sm font-bold text-white">{order.labNama} · {order.items.length} pemeriksaan</p>
            </div>
          </div>
        </div>

        {/* Meta strip */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1"><Clock size={11} /> {fmtWaktu(order.createdAt)}</span>
          {order.prioritas === "CITO" && (
            <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">CITO</span>
          )}
          {critCount > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">{critCount} Kritis</span>
          )}
          {abnCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{abnCount} Abnormal</span>
          )}
          {total > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 font-semibold text-emerald-600"><Wallet size={11} /> {fmtRp(total)}</span>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[64vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
              <Loader2 size={16} className="animate-spin" /> <span className="text-xs">Memuat hasil…</span>
            </div>
          ) : res ? (
            <LabHasilView res={res} />
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
              <FlaskConical size={22} className="text-slate-300" />
              <p className="text-xs">Hasil belum tersedia.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

const FILTERS: { key: LabOrderBucket | "all"; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "belum", label: "Belum Diterima" },
  { key: "proses", label: "Diproses" },
  { key: "selesai", label: "Selesai" },
];

function fmtWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const orderTotal = (o: LabOrderDTO): number => o.items.reduce((s, it) => s + (it.harga ?? 0), 0);

export default function RiwayatOrderLab({
  kunjunganId,
  onCopy,
  canWrite = false,
  refreshSignal = 0,
}: {
  kunjunganId: string;
  /** Salin item order ke form (re-order). Absen → tombol Salin disembunyikan. */
  onCopy?: (order: LabOrderDTO) => void;
  /** Boleh membatalkan order (dokter pengirim = clinical.tindakan:update). Default false. */
  canWrite?: boolean;
  /** Naikkan dari parent (mis. pasca-kirim order) → panel refetch. */
  refreshSignal?: number;
}) {
  const isPersisted = UUID_RE.test(kunjunganId);
  const [orders, setOrders] = useState<LabOrderDTO[]>([]);
  const [loading, setLoading] = useState(isPersisted);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<LabOrderBucket | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  // Order yang hasilnya sedang ditampilkan di modal (null = tertutup).
  const [hasilOrder, setHasilOrder] = useState<LabOrderDTO | null>(null);

  async function refetch(signal?: AbortSignal) {
    try {
      const rows = await listLabOrders(kunjunganId, signal);
      if (!signal?.aborted) setOrders(rows);
    } catch {
      /* diam — panel advisory, kegagalan tak menghalangi order */
    } finally {
      if (!signal?.aborted) { setLoading(false); setBusy(false); }
    }
  }

  async function doCancel(o: LabOrderDTO) {
    setCancelingId(o.id);
    try {
      await cancelLabOrder(kunjunganId, o.id);
      toast.success("Order lab dibatalkan", `${o.labNama} — ${o.items.length} pemeriksaan`);
      setConfirmId(null);
      await refetch();
    } catch (e) {
      toast.error("Gagal membatalkan order", e instanceof Error ? e.message : undefined);
    } finally {
      setCancelingId(null);
    }
  }

  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    void refetch(ac.signal);
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunjunganId, refreshSignal]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length, belum: 0, proses: 0, selesai: 0, lain: 0 };
    for (const o of orders) c[labOrderBucket(o.status)]++;
    return c;
  }, [orders]);

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => labOrderBucket(o.status) === filter)),
    [orders, filter],
  );

  if (!isPersisted) return null;

  return (
    <>
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <ClipboardList size={14} />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-800">Riwayat Order Lab</p>
            <p className="text-[11px] text-slate-400">Status pemenuhan dari Laboratorium</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setBusy(true); void refetch(); }}
          disabled={busy || loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={12} className={cn(busy && "animate-spin")} /> Muat ulang
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-4 py-2.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
              filter === f.key ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {f.label}
            <span className={cn("ml-1 tabular-nums", filter === f.key ? "text-slate-300" : "text-slate-400")}>
              {counts[f.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-slate-50">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
            <Loader2 size={15} className="animate-spin" /> <span className="text-xs">Memuat order…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-400">
            {orders.length === 0 ? "Belum ada order lab pada kunjungan ini." : "Tidak ada order pada filter ini."}
          </div>
        ) : (
          filtered.map((o) => {
            const cfg = labOrderStatusCfg(o.status);
            const open = openId === o.id;
            const total = orderTotal(o);
            return (
              <div key={o.id}>
                <div className={cn("flex w-full items-center gap-2 px-4 py-2.5 transition", labOrderRowBg(o.status))}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : o.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dot)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs font-semibold text-slate-800">{o.labNama}</span>
                        {o.prioritas === "CITO" && (
                          <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">CITO</span>
                        )}
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.badge)}>{cfg.label}</span>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1"><Clock size={10} /> {fmtWaktu(o.createdAt)}</span>
                        <span className="inline-flex items-center gap-1"><FlaskConical size={10} /> {o.items.length} pemeriksaan</span>
                        {total > 0 && <span className="inline-flex items-center gap-1 text-emerald-600"><Wallet size={10} /> {fmtRp(total)}</span>}
                      </p>
                    </div>
                  </button>

                  {/* Aksi order belum-diterima (Menunggu): Salin + Batalkan */}
                  {o.status === "Menunggu" && (
                    confirmId === o.id ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="mr-0.5 text-[10px] font-medium text-rose-600">Batalkan?</span>
                        <button type="button" onClick={() => doCancel(o)} disabled={cancelingId === o.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50">
                          {cancelingId === o.id ? <Loader2 size={11} className="animate-spin" /> : "Ya"}
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} disabled={cancelingId === o.id}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                          Tidak
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1">
                        {onCopy && (
                          <button type="button" onClick={() => onCopy(o)} title="Salin pemeriksaan ke form order"
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 px-2 py-1 text-[10px] font-semibold text-sky-600 transition hover:bg-sky-50">
                            <Copy size={11} /> Salin
                          </button>
                        )}
                        {canWrite && (
                          <button type="button" onClick={() => setConfirmId(o.id)} title="Batalkan order"
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50">
                            <Ban size={11} /> Batalkan
                          </button>
                        )}
                      </div>
                    )
                  )}

                  {/* Aksi order Selesai: Lihat Hasil (modal) */}
                  {o.status === "Selesai" && (
                    <button
                      type="button"
                      onClick={() => setHasilOrder(o)}
                      title="Lihat hasil pemeriksaan"
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <FlaskConical size={11} /> Lihat Hasil
                    </button>
                  )}

                  <button type="button" onClick={() => setOpenId(open ? null : o.id)} aria-label="Detail order"
                    className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                    <ChevronDown size={15} className={cn("transition-transform", open && "rotate-180")} />
                  </button>
                </div>

                {open && (
                  <div className="bg-slate-50/60 px-4 pb-3 pt-1">
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-500">
                            <th className="px-2.5 py-1.5 text-left font-semibold">Pemeriksaan</th>
                            <th className="px-2.5 py-1.5 text-left font-semibold">Kategori</th>
                            <th className="px-2.5 py-1.5 text-left font-semibold">TAT</th>
                            <th className="px-2.5 py-1.5 text-right font-semibold">Tarif</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((it) => (
                            <tr key={it.id} className="border-b border-slate-50 last:border-0">
                              <td className="px-2.5 py-1.5">
                                <span className="font-medium text-slate-800">{it.namaTes}</span>
                                {it.kodeTes && <span className="ml-1 font-mono text-[9px] text-slate-400">{it.kodeTes}</span>}
                              </td>
                              <td className="px-2.5 py-1.5"><KategoriChip kategori={toKategoriLab(it.kategori)} /></td>
                              <td className="px-2.5 py-1.5 text-slate-500">{it.waktuTunggu || "—"}</td>
                              <td className="px-2.5 py-1.5 text-right font-mono tabular-nums text-slate-700">
                                {it.harga != null ? fmtRp(it.harga) : <span className="text-amber-500">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      {o.catatan
                        ? <p className="text-[11px] text-slate-500"><span className="font-semibold">Catatan:</span> {o.catatan}</p>
                        : <span />}
                      {total > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <Wallet size={10} /> Total {fmtRp(total)}
                        </span>
                      )}
                    </div>
                    {o.status === "Ditolak" && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-rose-600">
                        <AlertCircle size={11} /> Sampel ditolak Laboratorium — perlu pengambilan ulang.
                      </p>
                    )}

                    {(o.status === "Diterima" || o.status === "Divalidasi") && (
                      <p className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={11} /> Hasil sedang diproses Laboratorium.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>

    <AnimatePresence>
      {hasilOrder && (
        <LabHasilModal
          kunjunganId={kunjunganId}
          order={hasilOrder}
          onClose={() => setHasilOrder(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
