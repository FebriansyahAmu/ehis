"use client";

import { useMemo, useState } from "react";
import { Share2, ArrowRight, PackageCheck, Inbox, FileStack, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import {
  InvShell, KpiCard, SectionCard, StatusPill, SearchInput, FilterChip,
  EmptyState, SlideOver, useSkeletonDelay, INV_ACCENT,
  tableWrap, tableCls, thCls, tdCls, trCls,
} from "./inventoryShared";
import {
  INV_DISTRIBUSI, type DistribusiRequest, type DocStatus,
  DOC_STATUS_CFG, locById, itemById,
} from "@/lib/inventory/inventoryMock";

export default function Distribusi() {
  const loaded = useSkeletonDelay();
  const [list, setList] = useState<DistribusiRequest[]>(INV_DISTRIBUSI);
  const [status, setStatus] = useState<DocStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((d) => (status === "all" || d.status === status))
      .filter((d) => !q || d.noDokumen.toLowerCase().includes(q) || d.pemohon.toLowerCase().includes(q))
      .sort((a, z) => z.tanggal.localeCompare(a.tanggal) || z.noDokumen.localeCompare(a.noDokumen));
  }, [list, status, search]);

  const stats = useMemo(() => ({
    total: list.length,
    draft: list.filter((d) => d.status === "Draft").length,
    proses: list.filter((d) => d.status === "Diproses").length,
    selesai: list.filter((d) => d.status === "Selesai").length,
  }), [list]);

  function proses(id: string) {
    setList((prev) => prev.map((d) => d.id === id
      ? { ...d, status: "Selesai", petugas: "Apt. Ahmad Fauzi", lines: d.lines.map((l) => ({ ...l, qtyKeluar: l.qtyMinta })) }
      : d));
    toast.success("Permintaan diproses", "Barang dikeluarkan & stok unit diperbarui");
    setOpenId(null);
  }

  const open = openId ? list.find((d) => d.id === openId) ?? null : null;

  return (
    <InvShell
      icon={Share2}
      title="Distribusi"
      description="Permintaan (amprahan) unit → pengeluaran barang dari gudang/depo. Pengganti Distribusi Obat di Mapping Hub."
      loaded={loaded}
    >
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={FileStack} label="Total Permintaan" value={stats.total} tone="cyan" />
        <KpiCard icon={Inbox} label="Draft" value={stats.draft} tone="slate" />
        <KpiCard icon={Send} label="Diproses" value={stats.proses} tone="amber" />
        <KpiCard icon={PackageCheck} label="Selesai" value={stats.selesai} tone="emerald" />
      </div>

      <SectionCard className="min-h-0 flex-1" bodyClassName="flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari no. dokumen / pemohon…" className="min-w-[200px] flex-1" />
          <div className="flex flex-wrap gap-1.5">
            {(["all", "Draft", "Diproses", "Selesai", "Dibatalkan"] as const).map((s) => (
              <FilterChip key={s} label={s === "all" ? "Semua" : DOC_STATUS_CFG[s].label} active={status === s} onClick={() => setStatus(s)} />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState icon={Share2} title="Tidak ada permintaan" description="Belum ada amprahan sesuai filter." />
          ) : (
            <div className={tableWrap}>
              <table className={tableCls}>
                <thead>
                  <tr>
                    <th className={thCls}>No. Dokumen</th>
                    <th className={thCls}>Pemohon</th>
                    <th className={thCls}>Sumber → Tujuan</th>
                    <th className={cn(thCls, "text-center")}>Item</th>
                    <th className={cn(thCls, "text-center")}>Status</th>
                    <th className={cn(thCls, "text-right")}>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => {
                    const cfg = DOC_STATUS_CFG[d.status];
                    return (
                      <tr key={d.id} className={cn(trCls, "cursor-pointer")} onClick={() => setOpenId(d.id)}>
                        <td className={cn(tdCls, "font-mono font-semibold text-slate-800")}>{d.noDokumen}</td>
                        <td className={tdCls}>{d.pemohon}</td>
                        <td className={cn(tdCls, "text-slate-500")}>
                          <span className="inline-flex items-center gap-1.5 text-[12px]">
                            {locById(d.fromLocationId)?.nama} <ArrowRight size={12} className="text-slate-300" /> {locById(d.toLocationId)?.nama}
                          </span>
                        </td>
                        <td className={cn(tdCls, "text-center tabular-nums")}>{d.lines.length}</td>
                        <td className={cn(tdCls, "text-center")}><StatusPill label={cfg.label} bg={cfg.bg} text={cfg.text} /></td>
                        <td className={cn(tdCls, "text-right tabular-nums text-slate-400")}>{fmtTgl(d.tanggal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>

      <SlideOver
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.noDokumen ?? ""}
        subtitle={open ? `${open.pemohon} · ${fmtTgl(open.tanggal)}` : ""}
        footer={open && open.status !== "Selesai" && open.status !== "Dibatalkan" ? (
          <button
            type="button"
            onClick={() => proses(open.id)}
            className={cn("inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover)}
          >
            <PackageCheck size={15} /> Proses & Keluarkan Barang
          </button>
        ) : undefined}
      >
        {open && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Sumber" value={locById(open.fromLocationId)?.nama ?? "—"} />
              <Field label="Tujuan" value={locById(open.toLocationId)?.nama ?? "—"} />
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 text-left font-semibold">Barang</th>
                    <th className="px-3 py-2 text-right font-semibold">Diminta</th>
                    <th className="px-3 py-2 text-right font-semibold">Keluar</th>
                  </tr>
                </thead>
                <tbody>
                  {open.lines.map((l, i) => {
                    const it = itemById(l.itemId);
                    return (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2">
                          <p className="font-semibold text-slate-800">{it?.nama}</p>
                          <p className="text-[11px] text-slate-400">{it?.kode}</p>
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-600">{l.qtyMinta}</td>
                        <td className={cn("px-3 py-2 text-right font-mono font-bold tabular-nums", l.qtyKeluar > 0 ? "text-emerald-600" : "text-slate-300")}>{l.qtyKeluar}</td>
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
