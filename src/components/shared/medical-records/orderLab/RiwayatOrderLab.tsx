"use client";

// Riwayat Order Lab — daftar order pemeriksaan lab yang sudah dikirim pada kunjungan ini +
// status pemenuhan Laboratorium (Belum Diterima / Diproses / Selesai). Read-only advisory utk
// klinisi, dengan aksi Salin (re-order) & Batalkan (saat Menunggu). Sumber: GET /kunjungan/:id/lab.
// Pasien demo (non-UUID) → panel disembunyikan. Selaras shared/resep/RiwayatOrderResep.

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList, RefreshCw, Loader2, ChevronDown, Clock, FlaskConical, Copy, Ban, Wallet, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { listLabOrders, cancelLabOrder, type LabOrderDTO } from "@/lib/api/lab/labOrder";
import {
  KategoriChip, fmtRp, toKategoriLab,
  labOrderBucket, labOrderStatusCfg, labOrderRowBg, type LabOrderBucket,
} from "./orderLabShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
