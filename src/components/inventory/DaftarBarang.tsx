"use client";

import { useMemo, useState } from "react";
import { Boxes, Pill, Syringe, PackageX, MapPin, CalendarClock, ShieldAlert, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InvShell, KpiCard, SectionCard, StatusPill, SearchInput, FilterChip, InvSelect,
  EmptyState, SlideOver, useSkeletonDelay,
  tableWrap, tableCls, thCls, tdCls, trCls,
} from "./inventoryShared";
import {
  INV_BALANCES, INV_BATCHES, INV_MOVEMENTS, INV_LOCATIONS,
  type ItemJenis,
  stokStatus, STOK_STATUS_CFG, MOVEMENT_CFG, fmtIDR, daysToExpiry,
  itemById, locById, itemInitials,
} from "@/lib/inventory/inventoryMock";

type JenisFilter = "all" | ItemJenis;

// Lokasi yang punya barang ter-assign (analog formularium → Location). Dropdown header.
const LOC_OPTIONS = INV_LOCATIONS
  .filter((l) => INV_BALANCES.some((b) => b.locationId === l.id))
  .map((l) => ({ value: l.id, label: l.nama, sub: l.tipe === "Gudang" ? "Gudang" : l.tipe === "Depo" ? "Depo Farmasi" : "Unit" }));

export default function DaftarBarang() {
  const loaded = useSkeletonDelay();
  const [loc, setLoc] = useState<string>(LOC_OPTIONS[0]?.value ?? "loc-gd");
  const [jenis, setJenis] = useState<JenisFilter>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  // Barang di lokasi terpilih (fetch by location).
  const rows = useMemo(() => INV_BALANCES.filter((b) => b.locationId === loc), [loc]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((b) => {
      const it = itemById(b.itemId);
      if (!it) return false;
      if (jenis !== "all" && it.jenis !== jenis) return false;
      if (q && !(it.nama.toLowerCase().includes(q) || it.kode.toLowerCase().includes(q) || it.kategori.toLowerCase().includes(q))) return false;
      if (statusFilter !== "all" && stokStatus(b) !== statusFilter) return false;
      return true;
    }).sort((a, z) => (itemById(a.itemId)?.nama ?? "").localeCompare(itemById(z.itemId)?.nama ?? ""));
  }, [rows, jenis, search, statusFilter]);

  const stats = useMemo(() => {
    const nilai = rows.reduce((s, b) => { const it = itemById(b.itemId); return s + (it ? b.qty * it.hargaSatuan : 0); }, 0);
    const perlu = rows.filter((b) => ["Habis", "Kritis", "Rendah"].includes(stokStatus(b))).length;
    return { count: rows.length, nilai, perlu };
  }, [rows]);

  return (
    <InvShell
      icon={Boxes}
      title="Daftar Barang"
      description="Stok Obat & BMHP per lokasi — sesuai katalog yang ter-assign (formularium) ke Depo/Gudang terpilih."
      loaded={loaded}
    >
      <div className="grid shrink-0 grid-cols-3 gap-3">
        <KpiCard icon={Boxes} label="Item di Lokasi" value={stats.count} tone="cyan" />
        <KpiCard icon={Wallet} label="Nilai Stok" value={fmtIDR(stats.nilai)} tone="emerald" />
        <KpiCard icon={ShieldAlert} label="Perlu Reorder" value={stats.perlu} tone="orange" />
      </div>

      <SectionCard className="min-h-0 flex-1" bodyClassName="flex min-h-0 flex-col">
        {/* Toolbar: dropdown lokasi + search + filter */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <InvSelect value={loc} onChange={setLoc} options={LOC_OPTIONS} icon={MapPin} className="w-full sm:w-64" />
          <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, kode, kategori…" className="min-w-[180px] flex-1" />
          <div className="flex gap-1.5">
            {(["all", "Obat", "BMHP"] as JenisFilter[]).map((j) => (
              <FilterChip key={j} label={j === "all" ? "Semua" : j} active={jenis === j} onClick={() => setJenis(j)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["all", "Habis", "Kritis", "Rendah", "Aman"].map((s) => (
              <FilterChip key={s} label={s === "all" ? "Semua Status" : s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState icon={PackageX} title="Tidak ada barang" description="Tidak ada barang ter-assign di lokasi ini (atau tidak cocok filter)." />
          ) : (
            <div className={tableWrap}>
              <table className={tableCls}>
                <thead>
                  <tr>
                    <th className={thCls}>Barang</th>
                    <th className={thCls}>Kategori</th>
                    <th className={cn(thCls, "text-right")}>Stok</th>
                    <th className={cn(thCls, "text-center")}>Status</th>
                    <th className={cn(thCls, "text-right")}>Nilai</th>
                    <th className={cn(thCls, "text-right")}>ROP</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const it = itemById(b.itemId)!;
                    const status = stokStatus(b);
                    const cfg = STOK_STATUS_CFG[status];
                    return (
                      <tr key={b.itemId} className={cn(trCls, "cursor-pointer")} onClick={() => setDetailId(b.itemId)}>
                        <td className={tdCls}>
                          <div className="flex items-center gap-2.5">
                            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold", it.jenis === "Obat" ? "bg-cyan-50 text-cyan-700" : "bg-teal-50 text-teal-700")}>
                              {itemInitials(it.nama)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800">{it.nama}</p>
                              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                                {it.jenis === "Obat" ? <Pill size={10} /> : <Syringe size={10} />}
                                {it.kode}
                                {it.isHAM && <span className="rounded bg-rose-100 px-1 text-[9px] font-bold text-rose-700">HAM</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={cn(tdCls, "text-slate-500")}>{it.kategori}</td>
                        <td className={cn(tdCls, "text-right text-base font-bold tabular-nums text-slate-900")}>
                          {b.qty.toLocaleString("id-ID")}
                        </td>
                        <td className={cn(tdCls, "text-center")}>
                          <StatusPill label={cfg.label} bg={cfg.bg} text={cfg.text} dot={cfg.dot} />
                        </td>
                        <td className={cn(tdCls, "text-right tabular-nums text-slate-600")}>{fmtIDR(b.qty * it.hargaSatuan)}</td>
                        <td className={cn(tdCls, "text-right tabular-nums text-slate-400")}>{b.reorderPoint.toLocaleString("id-ID")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>

      <ItemDetail itemId={detailId} onClose={() => setDetailId(null)} />
    </InvShell>
  );
}

// ── Detail drawer ─────────────────────────────────────────

function ItemDetail({ itemId, onClose }: { itemId: string | null; onClose: () => void }) {
  const it = itemId ? itemById(itemId) : null;
  const locBals = itemId ? INV_BALANCES.filter((b) => b.itemId === itemId) : [];
  const batches = itemId ? INV_BATCHES.filter((b) => b.itemId === itemId).sort((a, z) => a.expiryDate.localeCompare(z.expiryDate)) : [];
  const moves = itemId ? INV_MOVEMENTS.filter((m) => m.itemId === itemId).sort((a, z) => z.waktu.localeCompare(a.waktu)).slice(0, 6) : [];
  const total = locBals.reduce((s, b) => s + b.qty, 0);

  return (
    <SlideOver open={!!it} onClose={onClose} title={it?.nama ?? ""} subtitle={it ? `${it.kode} · ${it.kategori}` : ""}>
      {it && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Total Stok (semua lokasi)" value={total.toLocaleString("id-ID")} />
            <MiniStat label="Nilai Total" value={fmtIDR(total * it.hargaSatuan)} />
          </div>

          <Panel title="Saldo per Lokasi" icon={MapPin}>
            <ul className="divide-y divide-slate-100">
              {locBals.map((b) => {
                const cfg = STOK_STATUS_CFG[stokStatus(b)];
                return (
                  <li key={b.locationId} className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-700">{locById(b.locationId)?.nama}</p>
                      <p className="text-[11px] text-slate-400">min {b.min} · ROP {b.reorderPoint} · max {b.max}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold tabular-nums text-slate-800">{b.qty.toLocaleString("id-ID")}</span>
                      <StatusPill label={cfg.label} bg={cfg.bg} text={cfg.text} dot={cfg.dot} size="xs" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Batch / Kedaluwarsa (FEFO)" icon={CalendarClock}>
            {batches.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-slate-400">Tidak ada data batch.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {batches.map((b) => {
                  const d = daysToExpiry(b.expiryDate);
                  const urgent = d <= 30;
                  return (
                    <li key={b.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-700">{b.batchNo}</p>
                        <p className="text-[11px] text-slate-400">{locById(b.locationId)?.nama} · {b.qty.toLocaleString("id-ID")}</p>
                      </div>
                      <span className={cn("rounded-lg px-2 py-0.5 text-[11px] font-bold", urgent ? "bg-rose-50 text-rose-600" : d <= 90 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500")}>
                        {new Date(b.expiryDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Pergerakan Terkini" icon={Boxes}>
            {moves.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-slate-400">Belum ada pergerakan.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {moves.map((m) => {
                  const cfg = MOVEMENT_CFG[m.jenis];
                  return (
                    <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-700">{cfg.label} <span className="font-normal text-slate-400">· {m.refNo}</span></p>
                        <p className="text-[11px] text-slate-400">{new Date(m.waktu).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <span className={cn("rounded px-1.5 py-0.5 text-[12px] font-bold", cfg.bg, cfg.text)}>{cfg.sign}{m.qty}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </SlideOver>
  );
}

// ── Small UI bits ─────────────────────────────────────────

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Boxes; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2">
        <Icon size={13} className="text-slate-500" />
        <p className="text-[12px] font-bold text-slate-700">{title}</p>
      </header>
      {children}
    </div>
  );
}
