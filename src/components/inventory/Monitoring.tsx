"use client";

import { useMemo } from "react";
import { Gauge, Wallet, AlertTriangle, CalendarClock, PackageX, TrendingDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InvShell, KpiCard, SectionCard, StatusPill, EmptyState, useSkeletonDelay,
} from "./inventoryShared";
import {
  INV_BALANCES, INV_BATCHES, INV_MOVEMENTS, INV_LOCATIONS,
  stokStatus, STOK_STATUS_CFG, fmtIDR, fmtIDRcompact, daysToExpiry,
  itemById, locById, itemInitials,
} from "@/lib/inventory/inventoryMock";

export default function Monitoring() {
  const loaded = useSkeletonDelay();

  const perLokasi = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of INV_BALANCES) {
      const it = itemById(b.itemId);
      if (!it) continue;
      map.set(b.locationId, (map.get(b.locationId) ?? 0) + b.qty * it.hargaSatuan);
    }
    const rows = INV_LOCATIONS.map((l) => ({ loc: l, nilai: map.get(l.id) ?? 0 }));
    const max = Math.max(1, ...rows.map((r) => r.nilai));
    return { rows: rows.sort((a, z) => z.nilai - a.nilai), max, total: rows.reduce((s, r) => s + r.nilai, 0) };
  }, []);

  const reorder = useMemo(
    () => INV_BALANCES
      .map((b) => ({ b, status: stokStatus(b) }))
      .filter((x) => ["Habis", "Kritis", "Rendah"].includes(x.status))
      .sort((a, z) => sev(a.status) - sev(z.status)),
    [],
  );

  const expiry = useMemo(
    () => INV_BATCHES.map((b) => ({ b, d: daysToExpiry(b.expiryDate) }))
      .filter((x) => x.d <= 120)
      .sort((a, z) => a.d - z.d),
    [],
  );

  const movers = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of INV_MOVEMENTS) {
      if (m.jenis === "OUT" || m.jenis === "TRANSFER") map.set(m.itemId, (map.get(m.itemId) ?? 0) + m.qty);
    }
    return [...map.entries()].map(([itemId, qty]) => ({ itemId, qty })).sort((a, z) => z.qty - a.qty).slice(0, 6);
  }, []);

  const habis = INV_BALANCES.filter((b) => b.qty <= 0).length;

  return (
    <InvShell
      icon={Gauge}
      title="Monitoring Stok"
      description="Pantau reorder, kedaluwarsa (FEFO), nilai stok per lokasi, dan pergerakan barang."
      loaded={loaded}
    >
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Wallet} label="Nilai Stok Total" value={fmtIDRcompact(perLokasi.total)} tone="emerald" />
        <KpiCard icon={AlertTriangle} label="Perlu Reorder" value={reorder.length} tone="orange" />
        <KpiCard icon={CalendarClock} label="Akan ED ≤120 hr" value={expiry.length} tone="rose" />
        <KpiCard icon={PackageX} label="Item Habis" value={habis} tone="rose" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Reorder */}
        <SectionCard title="Perlu Reorder" desc="Stok di / di bawah titik pesan ulang" bodyClassName="overflow-y-auto">
          {reorder.length === 0 ? <EmptyState icon={PackageX} title="Semua stok aman" /> : (
            <ul className="divide-y divide-slate-100">
              {reorder.map(({ b, status }) => {
                const it = itemById(b.itemId)!;
                const cfg = STOK_STATUS_CFG[status];
                const pct = Math.min(100, Math.round((b.qty / Math.max(1, b.reorderPoint)) * 100));
                return (
                  <li key={`${b.itemId}-${b.locationId}`} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold", cfg.bg, cfg.text)}>{itemInitials(it.nama)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{it.nama}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className={cn("h-full rounded-full", cfg.dot)} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-400">{locById(b.locationId)?.nama}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-bold tabular-nums text-slate-800">{b.qty}<span className="text-[10px] font-normal text-slate-400">/{b.reorderPoint}</span></p>
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
          {expiry.length === 0 ? <EmptyState icon={CalendarClock} title="Tidak ada batch akan ED" /> : (
            <ul className="divide-y divide-slate-100">
              {expiry.map(({ b, d }) => {
                const it = itemById(b.itemId)!;
                const tone = d <= 0 ? "rose" : d <= 30 ? "rose" : d <= 90 ? "amber" : "slate";
                const cls = tone === "rose" ? "bg-rose-50 text-rose-600" : tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500";
                return (
                  <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cls)}><CalendarClock size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{it.nama}</p>
                      <p className="truncate text-[11px] text-slate-400">Batch {b.batchNo} · {locById(b.locationId)?.nama} · {b.qty} {it.satuan}</p>
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
          <ul className="flex flex-col gap-3">
            {perLokasi.rows.map(({ loc, nilai }) => (
              <li key={loc.id}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700"><MapPin size={12} className="text-slate-400" />{loc.nama}</span>
                  <span className="font-mono tabular-nums text-slate-600">{fmtIDR(nilai)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.round((nilai / perLokasi.max) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Movers */}
        <SectionCard title="Barang Paling Bergerak" desc="Berdasarkan pengeluaran & transfer terkini" bodyClassName="overflow-y-auto">
          {movers.length === 0 ? <EmptyState icon={TrendingDown} title="Belum ada pergerakan" /> : (
            <ul className="divide-y divide-slate-100">
              {movers.map(({ itemId, qty }, i) => {
                const it = itemById(itemId)!;
                return (
                  <li key={itemId} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-[12px] font-bold text-cyan-700">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{it.nama}</p>
                      <p className="truncate text-[11px] text-slate-400">{it.kategori}</p>
                    </div>
                    <p className="shrink-0 text-[13px] font-bold tabular-nums text-slate-700">{qty} <span className="text-[10px] font-normal text-slate-400">{it.satuan}</span></p>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </InvShell>
  );
}

function sev(s: string): number {
  return s === "Habis" ? 0 : s === "Kritis" ? 1 : 2;
}
