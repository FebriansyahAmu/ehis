"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Boxes, Wallet, AlertTriangle, CalendarClock, Truck, Share2,
  ClipboardCheck, Handshake, Gauge, ArrowRight, PackageX, Warehouse, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InvShell, KpiCard, SectionCard, StatusPill, EmptyState,
  useSkeletonDelay, INV_ACCENT,
} from "./inventoryShared";
import { STOK_STATUS_CFG, MOVEMENT_CFG, fmtIDRcompact, daysToExpiry, itemInitials } from "@/lib/inventory/inventoryMock";
import { ApiError } from "@/lib/api/client";
import { getInvOverview, type InvBerandaDTO } from "@/lib/api/inventory/dashboard";
import { toast } from "@/lib/ui/toastStore";

const QUICK_NAV = [
  { href: "/ehis-inventory/barang", label: "Daftar Barang", desc: "Stok per lokasi", icon: Boxes, tone: "cyan" },
  { href: "/ehis-inventory/distribusi", label: "Distribusi", desc: "Amprahan unit", icon: Share2, tone: "sky" },
  { href: "/ehis-inventory/pengiriman", label: "Pengiriman", desc: "Penerimaan & transfer", icon: Truck, tone: "emerald" },
  { href: "/ehis-inventory/opname", label: "Stok Opname", desc: "Hitung fisik", icon: ClipboardCheck, tone: "amber" },
  { href: "/ehis-inventory/monitoring", label: "Monitoring", desc: "Alert & FEFO", icon: Gauge, tone: "orange" },
  { href: "/ehis-inventory/rekanan", label: "Rekanan", desc: "Vendor / PBF", icon: Handshake, tone: "slate" },
] as const;

const NAV_TONE: Record<string, string> = {
  cyan: "bg-cyan-50 text-cyan-600", sky: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600",
  orange: "bg-orange-50 text-orange-600", slate: "bg-slate-100 text-slate-600",
};

export default function InventoryBeranda() {
  const loaded = useSkeletonDelay();
  const [data, setData] = useState<InvBerandaDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const dto = await getInvOverview(ac.signal);
        if (!ac.signal.aborted) setData(dto);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat beranda", e instanceof ApiError ? e.message : undefined);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const kpi = data?.kpi;

  return (
    <InvShell
      icon={Warehouse}
      title="Beranda Inventory"
      description="Ringkasan stok lintas-lokasi, peringatan reorder & kedaluwarsa, serta pergerakan barang terkini."
      loaded={loaded}
    >
      {/* KPI strip */}
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Boxes} label="Total SKU" value={kpi?.sku ?? 0} sub="Obat + BMHP" tone="cyan" />
        <KpiCard icon={Wallet} label="Nilai Stok" value={kpi ? fmtIDRcompact(kpi.nilai) : "—"} sub="seluruh lokasi" tone="emerald" />
        <KpiCard icon={AlertTriangle} label="Perlu Reorder" value={kpi?.reorder ?? 0} sub="habis / kritis / rendah" tone="orange" />
        <KpiCard icon={CalendarClock} label="Akan ED" value={kpi?.expiring ?? 0} sub="≤ 90 hari" tone="rose" />
      </div>

      {/* Quick nav */}
      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK_NAV.map((q, i) => (
          <motion.div key={q.href} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }}>
            <Link
              href={q.href}
              className="group flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-cyan-200 hover:shadow"
            >
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", NAV_TONE[q.tone])}>
                <q.icon size={17} />
              </span>
              <div>
                <p className="text-[13px] font-bold text-slate-800">{q.label}</p>
                <p className="text-[11px] text-slate-400">{q.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Body: alerts + recent */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Low stock */}
        <SectionCard
          title="Perlu Reorder"
          desc="Stok di bawah titik pesan ulang"
          action={<Link href="/ehis-inventory/monitoring" className={cn("inline-flex items-center gap-1 text-[12px] font-semibold", INV_ACCENT.textSoft)}>Lihat semua <ArrowRight size={13} /></Link>}
          bodyClassName="overflow-y-auto"
        >
          {loading ? <Loading /> : !data || data.lowStock.length === 0 ? (
            <EmptyState icon={PackageX} title="Semua stok aman" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.lowStock.map((r) => {
                const cfg = STOK_STATUS_CFG[r.status];
                return (
                  <li key={`${r.itemJenis}-${r.itemId}-${r.locationNama}`} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold", cfg.bg, cfg.text)}>
                      {itemInitials(r.nama)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{r.nama}</p>
                      <p className="truncate text-[11px] text-slate-400">{r.locationNama}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-bold tabular-nums text-slate-800">{r.qty} <span className="text-[10px] font-normal text-slate-400">{r.satuan}</span></p>
                      <StatusPill label={cfg.label} bg={cfg.bg} text={cfg.text} dot={cfg.dot} size="xs" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* Expiring */}
        <SectionCard title="Mendekati Kedaluwarsa" desc="FEFO — first expired, first out" bodyClassName="overflow-y-auto">
          {loading ? <Loading /> : !data || data.expiring.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Tidak ada batch akan ED" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.expiring.map((b) => {
                const d = daysToExpiry(b.expiryDate);
                const urgent = d <= 30;
                return (
                  <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", urgent ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600")}>
                      <CalendarClock size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{b.nama}</p>
                      <p className="truncate text-[11px] text-slate-400">Batch {b.batchNo} · {b.locationNama}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn("text-[13px] font-bold tabular-nums", urgent ? "text-rose-600" : "text-amber-600")}>
                        {d < 0 ? "ED" : `${d} hr`}
                      </p>
                      <p className="text-[10px] text-slate-400">{b.qty} {b.satuan}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* Recent movements */}
        <SectionCard title="Pergerakan Terkini" desc="Mutasi stok terbaru" bodyClassName="overflow-y-auto">
          {loading ? <Loading /> : !data || data.recent.length === 0 ? (
            <EmptyState icon={Boxes} title="Belum ada pergerakan" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recent.map((m) => {
                const cfg = MOVEMENT_CFG[m.jenis];
                return (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold", cfg.bg, cfg.text)}>
                      {cfg.sign}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{m.nama}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {cfg.label} · {m.refNo ?? "—"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-bold tabular-nums text-slate-800">{cfg.sign}{m.qty}</p>
                      <p className="text-[10px] text-slate-400">{timeShort(m.waktu)}</p>
                    </div>
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

function Loading() {
  return (
    <div className="flex h-full items-center justify-center gap-2 py-8 text-slate-400">
      <Loader2 size={15} className="animate-spin text-cyan-500" /><span className="text-[12px]">Memuat…</span>
    </div>
  );
}
function timeShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) + " " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
