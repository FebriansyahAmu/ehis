"use client";

import { useMemo, useState } from "react";
import { Truck, ArrowRight, Inbox, ArrowLeftRight, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InvShell, KpiCard, SectionCard, StatusPill, SearchInput, FilterChip,
  EmptyState, SlideOver, useSkeletonDelay,
  tableWrap, tableCls, thCls, tdCls, trCls,
} from "./inventoryShared";
import {
  INV_RECEIPTS, INV_TRANSFERS, type GoodsReceipt, type StockTransfer,
  DOC_STATUS_CFG, locById, itemById, vendorById, fmtIDR,
} from "@/lib/inventory/inventoryMock";

type Tab = "penerimaan" | "transfer";

export default function Pengiriman() {
  const loaded = useSkeletonDelay();
  const [tab, setTab] = useState<Tab>("penerimaan");
  const [search, setSearch] = useState("");
  const [grnOpen, setGrnOpen] = useState<GoodsReceipt | null>(null);
  const [trfOpen, setTrfOpen] = useState<StockTransfer | null>(null);

  const receipts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return INV_RECEIPTS.filter((r) => !q || r.noDokumen.toLowerCase().includes(q) || (vendorById(r.vendorId)?.nama.toLowerCase().includes(q) ?? false))
      .sort((a, z) => z.tanggal.localeCompare(a.tanggal));
  }, [search]);

  const transfers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return INV_TRANSFERS.filter((t) => !q || t.noDokumen.toLowerCase().includes(q))
      .sort((a, z) => z.tanggal.localeCompare(a.tanggal));
  }, [search]);

  return (
    <InvShell
      icon={Truck}
      title="Pengiriman"
      description="Penerimaan barang dari rekanan (GRN) dan transfer/mutasi stok antar-lokasi."
      loaded={loaded}
    >
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Inbox} label="Penerimaan" value={INV_RECEIPTS.length} sub="dari rekanan" tone="emerald" />
        <KpiCard icon={ArrowLeftRight} label="Transfer" value={INV_TRANSFERS.length} sub="antar lokasi" tone="cyan" />
        <KpiCard icon={PackageCheck} label="Selesai" value={[...INV_RECEIPTS, ...INV_TRANSFERS].filter((d) => d.status === "Selesai").length} tone="emerald" />
        <KpiCard icon={Truck} label="Diproses" value={[...INV_RECEIPTS, ...INV_TRANSFERS].filter((d) => d.status === "Diproses").length} tone="amber" />
      </div>

      {/* Tab toggle */}
      <div className="flex shrink-0 gap-1.5">
        <FilterChip label="Penerimaan (GRN)" active={tab === "penerimaan"} onClick={() => setTab("penerimaan")} count={INV_RECEIPTS.length} />
        <FilterChip label="Transfer Internal" active={tab === "transfer"} onClick={() => setTab("transfer")} count={INV_TRANSFERS.length} />
      </div>

      <SectionCard className="min-h-0 flex-1" bodyClassName="flex min-h-0 flex-col">
        <div className="border-b border-slate-100 p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari no. dokumen / rekanan…" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === "penerimaan" ? (
            receipts.length === 0 ? <EmptyState icon={Inbox} title="Tidak ada penerimaan" /> : (
              <div className={tableWrap}>
                <table className={tableCls}>
                  <thead><tr>
                    <th className={thCls}>No. GRN</th><th className={thCls}>Rekanan</th><th className={thCls}>Tujuan</th>
                    <th className={cn(thCls, "text-center")}>Item</th><th className={cn(thCls, "text-center")}>Status</th><th className={cn(thCls, "text-right")}>Tanggal</th>
                  </tr></thead>
                  <tbody>
                    {receipts.map((r) => {
                      const cfg = DOC_STATUS_CFG[r.status];
                      return (
                        <tr key={r.id} className={cn(trCls, "cursor-pointer")} onClick={() => setGrnOpen(r)}>
                          <td className={cn(tdCls, "font-mono font-semibold text-slate-800")}>{r.noDokumen}</td>
                          <td className={tdCls}>{vendorById(r.vendorId)?.nama}</td>
                          <td className={cn(tdCls, "text-slate-500")}>{locById(r.toLocationId)?.nama}</td>
                          <td className={cn(tdCls, "text-center tabular-nums")}>{r.lines.length}</td>
                          <td className={cn(tdCls, "text-center")}><StatusPill label={cfg.label} bg={cfg.bg} text={cfg.text} /></td>
                          <td className={cn(tdCls, "text-right tabular-nums text-slate-400")}>{fmtTgl(r.tanggal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            transfers.length === 0 ? <EmptyState icon={ArrowLeftRight} title="Tidak ada transfer" /> : (
              <div className={tableWrap}>
                <table className={tableCls}>
                  <thead><tr>
                    <th className={thCls}>No. Transfer</th><th className={thCls}>Sumber → Tujuan</th>
                    <th className={cn(thCls, "text-center")}>Item</th><th className={cn(thCls, "text-center")}>Status</th><th className={cn(thCls, "text-right")}>Tanggal</th>
                  </tr></thead>
                  <tbody>
                    {transfers.map((t) => {
                      const cfg = DOC_STATUS_CFG[t.status];
                      return (
                        <tr key={t.id} className={cn(trCls, "cursor-pointer")} onClick={() => setTrfOpen(t)}>
                          <td className={cn(tdCls, "font-mono font-semibold text-slate-800")}>{t.noDokumen}</td>
                          <td className={cn(tdCls, "text-slate-500")}>
                            <span className="inline-flex items-center gap-1.5 text-[12px]">{locById(t.fromLocationId)?.nama} <ArrowRight size={12} className="text-slate-300" /> {locById(t.toLocationId)?.nama}</span>
                          </td>
                          <td className={cn(tdCls, "text-center tabular-nums")}>{t.lines.length}</td>
                          <td className={cn(tdCls, "text-center")}><StatusPill label={cfg.label} bg={cfg.bg} text={cfg.text} /></td>
                          <td className={cn(tdCls, "text-right tabular-nums text-slate-400")}>{fmtTgl(t.tanggal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </SectionCard>

      {/* GRN detail */}
      <SlideOver open={!!grnOpen} onClose={() => setGrnOpen(null)} title={grnOpen?.noDokumen ?? ""} subtitle={grnOpen ? `${vendorById(grnOpen.vendorId)?.nama} · ${fmtTgl(grnOpen.tanggal)}` : ""}>
        {grnOpen && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Surat Jalan" value={grnOpen.noSuratJalan ?? "—"} />
              <Field label="No. PO" value={grnOpen.noPO ?? "—"} />
              <Field label="Tujuan" value={locById(grnOpen.toLocationId)?.nama ?? "—"} />
              <Field label="Petugas" value={grnOpen.petugas} />
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 text-left font-semibold">Barang / Batch</th><th className="px-3 py-2 text-right font-semibold">Qty</th><th className="px-3 py-2 text-right font-semibold">Harga Beli</th>
                </tr></thead>
                <tbody>
                  {grnOpen.lines.map((l, i) => {
                    const it = itemById(l.itemId);
                    return (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2">
                          <p className="font-semibold text-slate-800">{it?.nama}</p>
                          <p className="text-[11px] text-slate-400">Batch {l.batchNo} · ED {fmtTgl(l.expiryDate)}</p>
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-700">{l.qty}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-500">{fmtIDR(l.hargaBeli)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Transfer detail */}
      <SlideOver open={!!trfOpen} onClose={() => setTrfOpen(null)} title={trfOpen?.noDokumen ?? ""} subtitle={trfOpen ? fmtTgl(trfOpen.tanggal) : ""}>
        {trfOpen && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Sumber" value={locById(trfOpen.fromLocationId)?.nama ?? "—"} />
              <Field label="Tujuan" value={locById(trfOpen.toLocationId)?.nama ?? "—"} />
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 text-left font-semibold">Barang</th><th className="px-3 py-2 text-right font-semibold">Qty</th>
                </tr></thead>
                <tbody>
                  {trfOpen.lines.map((l, i) => {
                    const it = itemById(l.itemId);
                    return (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2">
                          <p className="font-semibold text-slate-800">{it?.nama}</p>
                          <p className="text-[11px] text-slate-400">{it?.kode}{l.batchNo ? ` · Batch ${l.batchNo}` : ""}</p>
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-700">{l.qty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SlideOver>
    </InvShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-[13px] font-semibold text-slate-800">{value}</p>
    </div>
  );
}
function fmtTgl(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
