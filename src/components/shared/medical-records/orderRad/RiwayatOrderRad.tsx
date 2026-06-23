"use client";

// Riwayat Order Radiologi — daftar order pemeriksaan rad yang sudah dikirim pada kunjungan ini +
// status pemenuhan Radiologi (Belum Diterima / Diproses / Selesai). Read-only advisory utk klinisi,
// dengan aksi Salin (re-order) & Batalkan (saat Menunggu). Sumber: GET /kunjungan/:id/rad.
// Pasien demo (non-UUID) → panel disembunyikan. Selaras orderLab/RiwayatOrderLab.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, RefreshCw, Loader2, ChevronDown, Clock, Radiation, Copy, Ban, Wallet, AlertCircle,
  X, ShieldCheck, FileText, ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { listRadOrders, cancelRadOrder, type RadOrderDTO } from "@/lib/api/rad/radOrder";
import { getRadResultForKunjungan, type RadResultDTO } from "@/lib/api/rad/radResult";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MODALITAS_LABEL: Record<string, string> = {
  XR: "X-Ray", CT: "CT Scan", MR: "MRI", RF: "Fluoroskopi", US: "USG", MG: "Mammografi", DXA: "Densitometri", NM: "Ked. Nuklir",
};
const modLabel = (m: string) => MODALITAS_LABEL[m] ?? (m || "—");

// ── Status workflow Rad → bucket klinis + tampilan ──
type Bucket = "belum" | "proses" | "selesai" | "lain";
const STATUS_BUCKET: Record<string, Bucket> = {
  Menunggu: "belum", Diterima: "proses", Diperiksa: "proses", Divalidasi: "proses",
  Selesai: "selesai", Ditolak: "lain", Dibatalkan: "lain",
};
function bucket(status: string): Bucket { return STATUS_BUCKET[status] ?? "belum"; }

const STATUS_CFG: Record<string, { label: string; badge: string; dot: string }> = {
  Menunggu:   { label: "Belum Diterima",     badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400"   },
  Diterima:   { label: "Diterima Radiologi", badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",             dot: "bg-sky-500"     },
  Diperiksa:  { label: "Akuisisi",           badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",             dot: "bg-sky-400"     },
  Divalidasi: { label: "Divalidasi",         badge: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",          dot: "bg-cyan-500"    },
  Selesai:    { label: "Selesai · Rilis",    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  Ditolak:    { label: "Ditolak",            badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",          dot: "bg-rose-400"    },
  Dibatalkan: { label: "Dibatalkan",         badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",      dot: "bg-slate-400"   },
};
function statusCfg(status: string) {
  return STATUS_CFG[status] ?? { label: status || "—", badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200", dot: "bg-slate-400" };
}

const BUCKET_ROW_BG: Record<Bucket, string> = {
  belum:   "bg-amber-50/60 hover:bg-amber-100/60",
  proses:  "bg-emerald-50/50 hover:bg-emerald-100/50",
  selesai: "bg-emerald-50/50 hover:bg-emerald-100/50",
  lain:    "bg-rose-50/50 hover:bg-rose-100/50",
};

const FILTERS: { key: Bucket | "all"; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "belum", label: "Belum Diterima" },
  { key: "proses", label: "Diproses" },
  { key: "selesai", label: "Selesai" },
];

const RP = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const fmtRp = (n: number) => RP.format(n);
const fmtWaktu = (iso: string) => new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const orderTotal = (o: RadOrderDTO): number => o.items.reduce((s, it) => s + (it.harga ?? 0), 0);

const CRIT_METODE_LABEL: Record<string, string> = {
  Telepon: "Telepon", SMS: "SMS", WhatsApp: "WhatsApp", Langsung: "Langsung",
};

// ── Ekspertise radiologi (read-only, narasi) ──────────────────────────────────
function RadHasilView({ res }: { res: RadResultDTO }) {
  const sections: { label: string; value: string }[] = [
    { label: "Indikasi Klinis",    value: res.indikasiKlinis },
    { label: "Teknik Pemeriksaan", value: res.teknik },
    { label: "Temuan",             value: res.temuan },
    { label: "Kesan / Konklusi",   value: res.kesan },
    ...(res.saran ? [{ label: "Saran / Rekomendasi", value: res.saran }] : []),
  ].filter((s) => (s.value ?? "").trim() !== "");

  return (
    <div className="space-y-3">
      {sections.length === 0 ? (
        <p className="py-6 text-center text-[11px] text-slate-400">Laporan ekspertise belum tersedia.</p>
      ) : (
        sections.map((s) => (
          <div key={s.label} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {s.label}
            </div>
            <p className="whitespace-pre-wrap px-3 py-2.5 text-[12.5px] leading-relaxed text-slate-700">{s.value}</p>
          </div>
        ))
      )}

      {/* Temuan kritis (ACR — dilaporkan ke DPJP) */}
      {res.criticalFindings.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
            <AlertCircle size={13} /> Temuan Kritis · Dilaporkan ke DPJP
          </p>
          <div className="mt-2 space-y-1.5">
            {res.criticalFindings.map((f, i) => (
              <div key={f.id ?? i} className="rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] text-rose-700 ring-1 ring-rose-100">
                <p className="font-semibold">{f.kategori}</p>
                {f.deskripsi && <p className="mt-0.5 text-rose-600">{f.deskripsi}</p>}
                {(f.metode || f.namaDokter || f.jamLapor) && (
                  <p className="mt-0.5 text-[10px] text-rose-500">
                    {f.metode ? CRIT_METODE_LABEL[f.metode] ?? f.metode : "—"}
                    {f.namaDokter ? ` → ${f.namaDokter}` : ""}
                    {f.jamLapor ? ` · ${f.jamLapor}` : ""}
                    {f.pelapor ? ` · oleh ${f.pelapor}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta penandatangan + catatan */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Radiografer Pelaksana", res.radiografer || "—"],
            ["Radiolog (SpRad)", res.radiolog || res.validator || "—"],
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
        {res.validatedAt && res.radiolog && (
          <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-200 pt-2.5 text-[10.5px] font-semibold text-emerald-600">
            <ShieldCheck size={13} /> Hasil tertandatangani elektronik (TTE) oleh {res.radiolog}.
          </div>
        )}
      </div>
    </div>
  );
}

function fmtHasilWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Modal hasil ekspertise ─────────────────────────────────────────────────────
function RadHasilModal({
  kunjunganId, order, onClose,
}: { kunjunganId: string; order: RadOrderDTO; onClose: () => void }) {
  const [res, setRes] = useState<RadResultDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    getRadResultForKunjungan(kunjunganId, order.id, ac.signal)
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
  const critCount = res?.criticalFindings.length ?? 0;
  const modItem = order.items[0];

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-10 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Hasil pemeriksaan radiologi"
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
        <div className="relative bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-4">
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
              <ScanLine size={18} className="text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-100">Hasil Pemeriksaan Radiologi</p>
              <p className="truncate text-sm font-bold text-white">
                {order.radNama}{modItem ? ` · ${modLabel(modItem.modalitas)}` : ""}
              </p>
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
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">{critCount} Temuan Kritis</span>
          )}
          <span className="inline-flex items-center gap-1"><FileText size={11} /> {order.items.length} pemeriksaan</span>
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
            <RadHasilView res={res} />
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
              <ScanLine size={22} className="text-slate-300" />
              <p className="text-xs">Hasil belum tersedia.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

export default function RiwayatOrderRad({
  kunjunganId,
  onCopy,
  canWrite = false,
  refreshSignal = 0,
}: {
  kunjunganId: string;
  /** Salin item order ke form (re-order). Absen → tombol Salin disembunyikan. */
  onCopy?: (order: RadOrderDTO) => void;
  /** Boleh membatalkan order (dokter pengirim = clinical.tindakan:update). Default false. */
  canWrite?: boolean;
  /** Naikkan dari parent (pasca-kirim order) → panel refetch. */
  refreshSignal?: number;
}) {
  const isPersisted = UUID_RE.test(kunjunganId);
  const [orders, setOrders] = useState<RadOrderDTO[]>([]);
  const [loading, setLoading] = useState(isPersisted);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Bucket | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  // Order yang ekspertisenya sedang ditampilkan di modal (null = tertutup).
  const [hasilOrder, setHasilOrder] = useState<RadOrderDTO | null>(null);

  async function refetch(signal?: AbortSignal) {
    try {
      const rows = await listRadOrders(kunjunganId, signal);
      if (!signal?.aborted) setOrders(rows);
    } catch {
      /* diam — panel advisory */
    } finally {
      if (!signal?.aborted) { setLoading(false); setBusy(false); }
    }
  }

  async function doCancel(o: RadOrderDTO) {
    setCancelingId(o.id);
    try {
      await cancelRadOrder(kunjunganId, o.id);
      toast.success("Order radiologi dibatalkan", `${o.items.length} pemeriksaan`);
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
    for (const o of orders) c[bucket(o.status)]++;
    return c;
  }, [orders]);

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => bucket(o.status) === filter)),
    [orders, filter],
  );

  if (!isPersisted) return null;

  return (
    <>
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <ClipboardList size={14} />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-800">Riwayat Order Radiologi</p>
            <p className="text-[11px] text-slate-400">Status pemenuhan dari Radiologi</p>
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
            {orders.length === 0 ? "Belum ada order radiologi pada kunjungan ini." : "Tidak ada order pada filter ini."}
          </div>
        ) : (
          filtered.map((o) => {
            const cfg = statusCfg(o.status);
            const open = openId === o.id;
            const total = orderTotal(o);
            return (
              <div key={o.id}>
                <div className={cn("flex w-full items-center gap-2 px-4 py-2.5 transition", BUCKET_ROW_BG[bucket(o.status)])}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : o.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dot)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs font-semibold text-slate-800">{o.radNama}</span>
                        {o.prioritas === "CITO" && (
                          <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">CITO</span>
                        )}
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.badge)}>{cfg.label}</span>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1"><Clock size={10} /> {fmtWaktu(o.createdAt)}</span>
                        <span className="inline-flex items-center gap-1"><Radiation size={10} /> {o.items.length} pemeriksaan</span>
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
                            className="inline-flex items-center gap-1 rounded-lg border border-teal-200 px-2 py-1 text-[10px] font-semibold text-teal-600 transition hover:bg-teal-50">
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

                  {/* Aksi order Selesai: Lihat Hasil (modal ekspertise) */}
                  {o.status === "Selesai" && (
                    <button
                      type="button"
                      onClick={() => setHasilOrder(o)}
                      title="Lihat hasil ekspertise radiologi"
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <FileText size={11} /> Lihat Hasil
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
                            <th className="px-2.5 py-1.5 text-left font-semibold">Modalitas</th>
                            <th className="px-2.5 py-1.5 text-left font-semibold">TAT</th>
                            <th className="px-2.5 py-1.5 text-right font-semibold">Tarif</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((it) => (
                            <tr key={it.id} className="border-b border-slate-50 last:border-0">
                              <td className="px-2.5 py-1.5">
                                <span className="font-medium text-slate-800">{it.nama}</span>
                                {it.kode && <span className="ml-1 font-mono text-[9px] text-slate-400">{it.kode}</span>}
                              </td>
                              <td className="px-2.5 py-1.5 text-slate-600">{modLabel(it.modalitas)}</td>
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
                        ? <p className="text-[11px] text-slate-500"><span className="font-semibold">Klinis:</span> {o.catatan}</p>
                        : <span />}
                      {total > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <Wallet size={10} /> Total {fmtRp(total)}
                        </span>
                      )}
                    </div>
                    {o.status === "Ditolak" && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-rose-600">
                        <AlertCircle size={11} /> Order ditolak Radiologi — perlu order ulang.
                      </p>
                    )}
                    {(o.status === "Diterima" || o.status === "Diperiksa" || o.status === "Divalidasi") && (
                      <p className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={11} /> Pemeriksaan sedang diproses Radiologi.
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
        <RadHasilModal
          kunjunganId={kunjunganId}
          order={hasilOrder}
          onClose={() => setHasilOrder(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
