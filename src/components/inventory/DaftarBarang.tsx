"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, Pill, Syringe, PackageX, MapPin, CalendarClock, ShieldAlert, Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InvShell, KpiCard, SectionCard, StatusPill, SearchInput, FilterChip, InvSelect,
  EmptyState, SlideOver, useSkeletonDelay,
  tableWrap, tableCls, thCls, tdCls, trCls,
} from "./inventoryShared";
import {
  type ItemJenis, type StokStatus,
  STOK_STATUS_CFG, MOVEMENT_CFG, fmtIDR, daysToExpiry, itemInitials,
} from "@/lib/inventory/inventoryMock";
import {
  type InvLocationDTO, type InvStockRowDTO, type InvItemDetailDTO, type InvItemJenis,
  listInvLocations, listInvStock, getInvItemDetail,
} from "@/lib/api/inventory/stock";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";

type JenisFilter = "all" | ItemJenis;

/** Status stok dari baris DTO (qty vs ROP/max). Mirror helper mock `stokStatus`. */
function rowStatus(r: { qty: number; max: number; reorderPoint: number }): StokStatus {
  if (r.qty <= 0) return "Habis";
  if (r.qty <= r.reorderPoint * 0.5) return "Kritis";
  if (r.qty <= r.reorderPoint) return "Rendah";
  if (r.max > 0 && r.qty >= r.max * 0.95) return "Berlebih";
  return "Aman";
}

function locSub(tipe: InvLocationDTO["tipe"]): string {
  return tipe === "Gudang" ? "Gudang" : tipe === "Depo" ? "Depo Farmasi" : "Unit";
}

export default function DaftarBarang() {
  const loaded = useSkeletonDelay();
  const [locations, setLocations] = useState<InvLocationDTO[]>([]);
  const [loc, setLoc] = useState<string>("");
  const [rows, setRows] = useState<InvStockRowDTO[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [jenis, setJenis] = useState<JenisFilter>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detail, setDetail] = useState<{ jenis: InvItemJenis; itemId: string } | null>(null);

  // Lokasi farmasi (dropdown). Default = lokasi pertama.
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const locs = await listInvLocations(ac.signal);
        if (ac.signal.aborted) return;
        setLocations(locs);
        setLoc((cur) => cur || locs[0]?.id || "");
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat lokasi", e instanceof ApiError ? e.message : undefined);
      }
    })();
    return () => ac.abort();
  }, []);

  // Stok di lokasi terpilih (re-fetch tiap ganti lokasi).
  useEffect(() => {
    if (!loc) return;
    const ac = new AbortController();
    setRowsLoading(true);
    (async () => {
      try {
        const data = await listInvStock(loc, ac.signal);
        if (ac.signal.aborted) return;
        setRows(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat stok", e instanceof ApiError ? e.message : undefined);
      } finally {
        if (!ac.signal.aborted) setRowsLoading(false);
      }
    })();
    return () => ac.abort();
  }, [loc]);

  const locOptions = useMemo(
    () => locations.map((l) => ({ value: l.id, label: l.nama, sub: locSub(l.tipe) })),
    [locations],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (jenis !== "all" && r.itemJenis !== jenis) return false;
      if (q && !(r.nama.toLowerCase().includes(q) || r.kode.toLowerCase().includes(q) || r.kategori.toLowerCase().includes(q))) return false;
      if (statusFilter !== "all" && rowStatus(r) !== statusFilter) return false;
      return true;
    });
  }, [rows, jenis, search, statusFilter]);

  const stats = useMemo(() => {
    const nilai = rows.reduce((s, r) => s + r.qty * r.hargaSatuan, 0);
    const perlu = rows.filter((r) => ["Habis", "Kritis", "Rendah"].includes(rowStatus(r))).length;
    return { count: rows.length, nilai, perlu };
  }, [rows]);

  return (
    <InvShell
      icon={Boxes}
      title="Daftar Barang"
      description="Stok Obat & BMHP per lokasi — sesuai katalog yang ter-assign (Ketersediaan Farmasi) ke Depo/Gudang terpilih."
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
          <InvSelect value={loc} onChange={setLoc} options={locOptions} icon={MapPin} className="w-full sm:w-64" />
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
          {rowsLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin text-cyan-500" />
              <span className="text-[13px]">Memuat stok…</span>
            </div>
          ) : filtered.length === 0 ? (
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
                  {filtered.map((r) => {
                    const status = rowStatus(r);
                    const cfg = STOK_STATUS_CFG[status];
                    return (
                      <tr key={`${r.itemJenis}:${r.itemId}`} className={cn(trCls, "cursor-pointer")} onClick={() => setDetail({ jenis: r.itemJenis, itemId: r.itemId })}>
                        <td className={tdCls}>
                          <div className="flex items-center gap-2.5">
                            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold", r.itemJenis === "Obat" ? "bg-cyan-50 text-cyan-700" : "bg-teal-50 text-teal-700")}>
                              {itemInitials(r.nama)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800">{r.nama}</p>
                              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                                {r.itemJenis === "Obat" ? <Pill size={10} /> : <Syringe size={10} />}
                                {r.kode}
                                {r.isHAM && <span className="rounded bg-rose-100 px-1 text-[9px] font-bold text-rose-700">HAM</span>}
                                {r.isSteril && <span className="rounded bg-teal-100 px-1 text-[9px] font-bold text-teal-700">Steril</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={cn(tdCls, "text-slate-500")}>{r.kategori}</td>
                        <td className={cn(tdCls, "text-right text-base font-bold tabular-nums text-slate-900")}>
                          {r.qty.toLocaleString("id-ID")}
                        </td>
                        <td className={cn(tdCls, "text-center")}>
                          <StatusPill label={cfg.label} bg={cfg.bg} text={cfg.text} dot={cfg.dot} />
                        </td>
                        <td className={cn(tdCls, "text-right tabular-nums text-slate-600")}>{fmtIDR(r.qty * r.hargaSatuan)}</td>
                        <td className={cn(tdCls, "text-right tabular-nums text-slate-400")}>{r.reorderPoint.toLocaleString("id-ID")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>

      <ItemDetail target={detail} onClose={() => setDetail(null)} />
    </InvShell>
  );
}

// ── Detail drawer ─────────────────────────────────────────

function ItemDetail({ target, onClose }: { target: { jenis: InvItemJenis; itemId: string } | null; onClose: () => void }) {
  const [data, setData] = useState<InvItemDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!target) { setData(null); return; }
    const ac = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const d = await getInvItemDetail(target.jenis, target.itemId, ac.signal);
        if (!ac.signal.aborted) setData(d);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat detail", e instanceof ApiError ? e.message : undefined);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [target]);

  const total = data ? data.balances.reduce((s, b) => s + b.qty, 0) : 0;

  return (
    <SlideOver
      open={!!target}
      onClose={onClose}
      title={data?.nama ?? "Memuat…"}
      subtitle={data ? `${data.kode} · ${data.kategori}` : ""}
    >
      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 size={16} className="animate-spin text-cyan-500" />
          <span className="text-[13px]">Memuat detail…</span>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Total Stok (semua lokasi)" value={total.toLocaleString("id-ID")} />
            <MiniStat label="Nilai Total" value={fmtIDR(total * data.hargaSatuan)} />
          </div>

          <Panel title="Saldo per Lokasi" icon={MapPin}>
            {data.balances.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-slate-400">Belum ada saldo.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.balances.map((b) => {
                  const cfg = STOK_STATUS_CFG[rowStatus(b)];
                  return (
                    <li key={b.locationId} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-700">{b.locationNama}</p>
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
            )}
          </Panel>

          <Panel title="Batch / Kedaluwarsa (FEFO)" icon={CalendarClock}>
            {data.batches.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-slate-400">Tidak ada data batch.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.batches.map((b) => {
                  const d = b.expiryDate ? daysToExpiry(b.expiryDate) : null;
                  const urgent = d !== null && d <= 30;
                  return (
                    <li key={b.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-700">{b.batchNo}</p>
                        <p className="text-[11px] text-slate-400">{b.locationNama} · {b.qty.toLocaleString("id-ID")}</p>
                      </div>
                      <span className={cn("rounded-lg px-2 py-0.5 text-[11px] font-bold", b.expiryDate == null ? "bg-slate-50 text-slate-400" : urgent ? "bg-rose-50 text-rose-600" : d !== null && d <= 90 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500")}>
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Pergerakan Terkini" icon={Boxes}>
            {data.movements.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-slate-400">Belum ada pergerakan.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.movements.map((m) => {
                  const cfg = MOVEMENT_CFG[m.jenis as keyof typeof MOVEMENT_CFG] ?? MOVEMENT_CFG.ADJUST;
                  return (
                    <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-700">{cfg.label} <span className="font-normal text-slate-400">· {m.refNo ?? "—"}</span></p>
                        <p className="text-[11px] text-slate-400">{new Date(m.waktu).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <span className={cn("rounded px-1.5 py-0.5 text-[12px] font-bold", cfg.bg, cfg.text)}>{cfg.sign}{Math.abs(m.qty)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      ) : null}
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
