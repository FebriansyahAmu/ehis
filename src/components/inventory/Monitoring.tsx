"use client";

import { useEffect, useState } from "react";
import { Gauge, Wallet, AlertTriangle, CalendarClock, PackageX, TrendingDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InvShell, KpiCard, SectionCard, StatusPill, EmptyState, useSkeletonDelay,
} from "./inventoryShared";
import { STOK_STATUS_CFG, fmtIDR, fmtIDRcompact, daysToExpiry, itemInitials } from "@/lib/inventory/inventoryMock";
import { ApiError } from "@/lib/api/client";
import { getInvMonitoring, type InvMonitoringDTO } from "@/lib/api/inventory/dashboard";
import { toast } from "@/lib/ui/toastStore";

export default function Monitoring() {
  const loaded = useSkeletonDelay();
  const [data, setData] = useState<InvMonitoringDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const dto = await getInvMonitoring(ac.signal);
        if (!ac.signal.aborted) setData(dto);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat monitoring", e instanceof ApiError ? e.message : undefined);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const maxNilai = Math.max(1, ...(data?.valueByLocation.map((r) => r.nilai) ?? [1]));

  return (
    <InvShell
      icon={Gauge}
      title="Monitoring Stok"
      description="Pantau reorder, kedaluwarsa (FEFO), nilai stok per lokasi, dan pergerakan barang."
      loaded={loaded}
    >
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Wallet} label="Nilai Stok Total" value={data ? fmtIDRcompact(data.kpi.nilaiTotal) : "—"} tone="emerald" />
        <KpiCard icon={AlertTriangle} label="Perlu Reorder" value={data?.kpi.reorder ?? 0} tone="orange" />
        <KpiCard icon={CalendarClock} label="Akan ED ≤120 hr" value={data?.kpi.expiring ?? 0} tone="rose" />
        <KpiCard icon={PackageX} label="Item Habis" value={data?.kpi.habis ?? 0} tone="rose" />
      </div>

      {loading ? (
        <SectionCard className="min-h-0 flex-1" bodyClassName="flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin text-cyan-500" /><span className="text-[13px]">Memuat monitoring…</span></div>
        </SectionCard>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
          {/* Reorder */}
          <SectionCard title="Perlu Reorder" desc="Stok di / di bawah titik pesan ulang" bodyClassName="overflow-y-auto">
            {!data || data.reorder.length === 0 ? <EmptyState icon={PackageX} title="Semua stok aman" /> : (
              <ul className="divide-y divide-slate-100">
                {data.reorder.map((r) => {
                  const cfg = STOK_STATUS_CFG[r.status];
                  const pct = Math.min(100, Math.round((r.qty / Math.max(1, r.reorderPoint)) * 100));
                  return (
                    <li key={`${r.itemJenis}-${r.itemId}-${r.locationNama}`} className="flex items-center gap-3 px-4 py-2.5">
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold", cfg.bg, cfg.text)}>{itemInitials(r.nama)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-800">{r.nama}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className={cn("h-full rounded-full", cfg.dot)} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="shrink-0 text-[11px] text-slate-400">{r.locationNama}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[13px] font-bold tabular-nums text-slate-800">{r.qty}<span className="text-[10px] font-normal text-slate-400">/{r.reorderPoint}</span></p>
                        <StatusPill label={cfg.label} bg={cfg.bg} text={cfg.text} dot={cfg.dot} size="xs" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          {/* Expiry */}
          <SectionCard title="Kedaluwarsa (FEFO)" desc="Batch akan ED dalam 120 hari" bodyClassName="overflow-y-auto">
            {!data || data.expiry.length === 0 ? <EmptyState icon={CalendarClock} title="Tidak ada batch akan ED" /> : (
              <ul className="divide-y divide-slate-100">
                {data.expiry.map((b) => {
                  const d = daysToExpiry(b.expiryDate);
                  const tone = d <= 30 ? "rose" : d <= 90 ? "amber" : "slate";
                  const cls = tone === "rose" ? "bg-rose-50 text-rose-600" : tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500";
                  return (
                    <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cls)}><CalendarClock size={15} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-800">{b.nama}</p>
                        <p className="truncate text-[11px] text-slate-400">Batch {b.batchNo} · {b.locationNama} · {b.qty} {b.satuan}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn("text-[13px] font-bold tabular-nums", tone === "rose" ? "text-rose-600" : tone === "amber" ? "text-amber-600" : "text-slate-500")}>{d < 0 ? "ED" : `${d} hr`}</p>
                        <p className="text-[10px] text-slate-400">{new Date(b.expiryDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          {/* Nilai per lokasi */}
          <SectionCard title="Nilai Stok per Lokasi" bodyClassName="overflow-y-auto p-4">
            {!data || data.valueByLocation.length === 0 ? <EmptyState icon={Wallet} title="Belum ada nilai stok" /> : (
              <ul className="flex flex-col gap-3">
                {data.valueByLocation.map((r) => (
                  <li key={r.locationId}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700"><MapPin size={12} className="text-slate-400" />{r.locationNama}</span>
                      <span className="font-mono tabular-nums text-slate-600">{fmtIDR(r.nilai)}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.round((r.nilai / maxNilai) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Movers */}
          <SectionCard title="Barang Paling Bergerak" desc="Berdasarkan pengeluaran & transfer terkini" bodyClassName="overflow-y-auto">
            {!data || data.movers.length === 0 ? <EmptyState icon={TrendingDown} title="Belum ada pergerakan" /> : (
              <ul className="divide-y divide-slate-100">
                {data.movers.map((m, i) => (
                  <li key={`${m.itemJenis}-${m.itemId}`} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-[12px] font-bold text-cyan-700">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{m.nama}</p>
                      <p className="truncate text-[11px] text-slate-400">{m.kategori}</p>
                    </div>
                    <p className="shrink-0 text-[13px] font-bold tabular-nums text-slate-700">{m.qty} <span className="text-[10px] font-normal text-slate-400">{m.satuan}</span></p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}
    </InvShell>
  );
}
