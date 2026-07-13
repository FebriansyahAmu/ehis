"use client";

// Riwayat Order Resep — daftar order resep yang sudah dikirim pada kunjungan ini + status
// pemenuhan Farmasi (Belum Diterima / Diproses / Selesai). Read-only, advisory untuk klinisi.
// Sumber: GET /kunjungan/:id/resep (listResep). Pasien demo (non-UUID) → panel disembunyikan.

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCw, Loader2, ChevronDown, ShieldCheck, Pill, Clock, Copy, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { listResep, cancelResep, type ResepOrderDTO } from "@/lib/api/resep/resep";
import { resepOrderBucket, resepOrderStatusCfg, resepOrderRowBg, type ResepOrderBucket } from "./resepShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FILTERS: { key: ResepOrderBucket | "all"; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "belum", label: "Belum Diterima" },
  { key: "proses", label: "Diproses" },
  { key: "selesai", label: "Selesai" },
];

function fmtWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function RiwayatOrderResep({
  kunjunganId,
  onCopy,
  canWrite = false,
  refreshKey = 0,
}: {
  kunjunganId: string;
  /** Salin item order ke form resep (re-prescribe). Absen → tombol Salin disembunyikan. */
  onCopy?: (order: ResepOrderDTO) => void;
  /** Boleh membatalkan order (DPJP penulis = clinical.resep:update). Default false → tombol Batalkan disembunyikan. */
  canWrite?: boolean;
  /** Naikkan untuk memaksa refetch (mis. pasca-kirim order). */
  refreshKey?: number;
}) {
  const isPersisted = UUID_RE.test(kunjunganId);
  const [orders, setOrders] = useState<ResepOrderDTO[]>([]);
  const [loading, setLoading] = useState(isPersisted);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<ResepOrderBucket | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  async function doCancel(o: ResepOrderDTO) {
    setCancelingId(o.id);
    try {
      await cancelResep(kunjunganId, o.id);
      toast.success("Order resep dibatalkan", `${o.depoNama} — ${o.items.length} item`);
      setConfirmId(null);
      await refetch();
    } catch (e) {
      toast.error("Gagal membatalkan order", e instanceof Error ? e.message : undefined);
    } finally {
      setCancelingId(null);
    }
  }

  async function refetch(signal?: AbortSignal) {
    try {
      const rows = await listResep(kunjunganId, signal);
      if (!signal?.aborted) setOrders(rows);
    } catch {
      /* diam — panel advisory, kegagalan tak menghalangi peresepan */
    } finally {
      if (!signal?.aborted) { setLoading(false); setBusy(false); }
    }
  }

  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    void refetch(ac.signal);
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunjunganId, refreshKey]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length, belum: 0, proses: 0, selesai: 0, lain: 0 };
    for (const o of orders) c[resepOrderBucket(o.status)]++;
    return c;
  }, [orders]);

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => resepOrderBucket(o.status) === filter)),
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
            <p className="text-xs font-semibold text-slate-800">Riwayat Order Resep</p>
            <p className="text-[11px] text-slate-400">Status pemenuhan dari Depo Farmasi</p>
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
            {orders.length === 0 ? "Belum ada order resep pada kunjungan ini." : "Tidak ada order pada filter ini."}
          </div>
        ) : (
          filtered.map((o) => {
            const cfg = resepOrderStatusCfg(o.status);
            const open = openId === o.id;
            return (
              <div key={o.id}>
                <div className={cn("flex w-full items-center gap-2 px-4 py-2.5 transition", resepOrderRowBg(o.status))}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : o.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dot)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs font-semibold text-slate-800">{o.depoNama}</span>
                        {o.prioritas === "CITO" && (
                          <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">CITO</span>
                        )}
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.badge)}>{cfg.label}</span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1"><Clock size={10} /> {fmtWaktu(o.createdAt)}</span>
                        <span className="inline-flex items-center gap-1"><Pill size={10} /> {o.items.length} item</span>
                        {o.tteSignedAt && <span className="inline-flex items-center gap-1 text-emerald-600"><ShieldCheck size={10} /> TTE</span>}
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
                          <button type="button" onClick={() => onCopy(o)} title="Salin item ke form resep"
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
                            <th className="px-2.5 py-1.5 text-left font-semibold">Obat</th>
                            <th className="px-2.5 py-1.5 text-left font-semibold">Signa</th>
                            <th className="px-2.5 py-1.5 text-right font-semibold">Jumlah</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((it) => (
                            <tr key={it.id} className="border-b border-slate-50 last:border-0">
                              <td className="px-2.5 py-1.5">
                                <span className="font-medium text-slate-800">{it.namaObat}</span>
                                {it.isHAM && <span className="ml-1 rounded bg-red-600 px-1 py-0.5 text-[8px] font-black uppercase text-white">HAM</span>}
                              </td>
                              <td className="px-2.5 py-1.5 text-slate-500">{[it.signa, it.rute].filter(Boolean).join(" · ") || "—"}</td>
                              <td className="px-2.5 py-1.5 text-right font-mono tabular-nums text-slate-700">{it.jumlah}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {o.catatan && <p className="mt-2 text-[11px] text-slate-500"><span className="font-semibold">Catatan:</span> {o.catatan}</p>}
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
