"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, Pill, Syringe, PackageX, MapPin, CalendarClock, ShieldAlert, Wallet, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InvShell, KpiCard, SectionCard, StatusPill, SearchInput, FilterChip, InvSelect,
  EmptyState, SlideOver, Modal, useSkeletonDelay, INV_ACCENT,
  tableWrap, tableCls, thCls, tdCls, trCls,
} from "./inventoryShared";
import {
  type ItemJenis, type StokStatus,
  STOK_STATUS_CFG, MOVEMENT_CFG, fmtIDR, daysToExpiry, itemInitials,
} from "@/lib/inventory/inventoryMock";
import {
  type InvLocationDTO, type InvStockRowDTO, type InvItemDetailDTO, type InvItemJenis,
  listInvLocations, listInvStock, getInvItemDetail, setStockPolicy,
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
  const [policyRow, setPolicyRow] = useState<InvStockRowDTO | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);

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
  const locNama = useMemo(() => locations.find((l) => l.id === loc)?.nama ?? "", [locations, loc]);

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

  // Reset ke halaman 1 setiap filter berubah (dilakukan di handler → hindari set-state-in-effect).
  const onLoc = (v: string) => { setLoc(v); setPage(0); };
  const onSearch = (v: string) => { setSearch(v); setPage(0); };
  const onJenis = (j: JenisFilter) => { setJenis(j); setPage(0); };
  const onStatus = (s: string) => { setStatusFilter(s); setPage(0); };

  // Paginasi: render hanya halaman aktif (hindari render seluruh data sekaligus).
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const curPage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(curPage * pageSize, curPage * pageSize + pageSize);
  const rangeFrom = totalItems === 0 ? 0 : curPage * pageSize + 1;
  const rangeTo = Math.min(totalItems, curPage * pageSize + pageSize);

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
          <InvSelect value={loc} onChange={onLoc} options={locOptions} icon={MapPin} className="w-full sm:w-64" />
          <SearchInput value={search} onChange={onSearch} placeholder="Cari nama, kode, kategori…" className="min-w-45 flex-1" />
          <div className="flex gap-1.5">
            {(["all", "Obat", "BMHP"] as JenisFilter[]).map((j) => (
              <FilterChip key={j} label={j === "all" ? "Semua" : j} active={jenis === j} onClick={() => onJenis(j)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["all", "Habis", "Kritis", "Rendah", "Aman"].map((s) => (
              <FilterChip key={s} label={s === "all" ? "Semua Status" : s} active={statusFilter === s} onClick={() => onStatus(s)} />
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
                    <th className={cn(thCls, "text-right")} title="Reorder Point — Titik Pesan Ulang">
                      ROP
                      <span className="block text-[9px] font-normal normal-case tracking-normal text-slate-400">Titik Pesan Ulang</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => {
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
                        <td className={cn(tdCls, "text-right")}>
                          <div className="flex items-center justify-end gap-2">
                            <span className="tabular-nums text-slate-400">{r.reorderPoint.toLocaleString("id-ID")}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPolicyRow(r); }}
                              title="Atur min / ROP / max"
                              aria-label={`Atur kebijakan stok ${r.nama}`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-cyan-50 hover:text-cyan-600"
                            >
                              <SlidersHorizontal size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginasi (di luar area scroll → selalu terlihat) */}
        {!rowsLoading && totalItems > 12 && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Menampilkan <span className="font-semibold tabular-nums text-slate-600">{rangeFrom}–{rangeTo}</span> dari <span className="font-semibold tabular-nums text-slate-600">{totalItems}</span></span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-medium text-slate-600 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                aria-label="Item per halaman"
              >
                {[12, 25, 50].map((n) => <option key={n} value={n}>{n}/hal</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" disabled={curPage === 0} onClick={() => setPage(curPage - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="Halaman sebelumnya">
                <ChevronLeft size={15} />
              </button>
              <span className="px-1 text-[11px] font-semibold tabular-nums text-slate-600">Hal {curPage + 1}/{totalPages}</span>
              <button type="button" disabled={curPage >= totalPages - 1} onClick={() => setPage(curPage + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="Halaman berikutnya">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      <ItemDetail target={detail} onClose={() => setDetail(null)} />

      {policyRow && (
        <PolicyEditor
          row={policyRow}
          locationId={loc}
          locationNama={locNama}
          onClose={() => setPolicyRow(null)}
          onSaved={(p) => {
            setRows((prev) => prev.map((r) =>
              r.itemJenis === policyRow.itemJenis && r.itemId === policyRow.itemId
                ? { ...r, min: p.min, reorderPoint: p.reorderPoint, max: p.max }
                : r));
            setPolicyRow(null);
          }}
        />
      )}
    </InvShell>
  );
}

// ── Policy editor (min / ROP / max per item × lokasi) ─────────────────────────

function PolicyEditor({
  row, locationId, locationNama, onClose, onSaved,
}: {
  row: InvStockRowDTO;
  locationId: string;
  locationNama: string;
  onClose: () => void;
  onSaved: (p: { min: number; reorderPoint: number; max: number }) => void;
}) {
  const [min, setMin] = useState(String(row.min));
  const [rop, setRop] = useState(String(row.reorderPoint));
  const [max, setMax] = useState(String(row.max));
  const [saving, setSaving] = useState(false);

  const nMin = Number(min), nRop = Number(rop), nMax = Number(max);
  const filled = min !== "" && rop !== "" && max !== "";
  const allInt = [nMin, nRop, nMax].every((n) => Number.isInteger(n) && n >= 0);
  const minOk = nMin <= nRop;
  const ropOk = nMax === 0 || nRop <= nMax;
  const valid = filled && allInt && minOk && ropOk;
  const err = !filled ? "" : !allInt ? "Nilai harus bilangan bulat ≥ 0." : !minOk ? "Min tidak boleh melebihi ROP." : !ropOk ? "ROP tidak boleh melebihi Max." : "";

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const dto = await setStockPolicy({ itemJenis: row.itemJenis, itemId: row.itemId, locationId, min: nMin, reorderPoint: nRop, max: nMax });
      toast.success("Kebijakan stok diperbarui", `${row.nama} — Min ${dto.min} · ROP ${dto.reorderPoint} · Max ${dto.max || "—"}`);
      onSaved({ min: dto.min, reorderPoint: dto.reorderPoint, max: dto.max });
    } catch (e) {
      toast.error("Gagal menyimpan kebijakan", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      icon={SlidersHorizontal}
      title="Atur Kebijakan Stok"
      subtitle={`${row.nama} · ${locationNama}`}
      width="max-w-md"
      footer={
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-rose-500">{err}</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="rounded-xl border border-slate-200 px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Batal</button>
            <button type="button" onClick={submit} disabled={!valid || saving}
              className={cn("inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", valid && !saving ? cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover) : "cursor-not-allowed bg-slate-300")}>
              {saving && <Loader2 size={13} className="animate-spin" />} {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="rounded-lg bg-cyan-50/70 px-3 py-2 text-[11px] leading-relaxed text-cyan-700 ring-1 ring-cyan-100">
          <b>ROP</b> (Titik Pesan Ulang) menentukan kapan item ditandai <b>Rendah/Kritis</b> dan masuk daftar reorder.
          Urutan disarankan: <b>Min ≤ ROP ≤ Max</b>. Isi <b>Max = 0</b> bila tanpa batas atas.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <PolicyField label="Min" value={min} onChange={setMin} />
          <PolicyField label="ROP" value={rop} onChange={setRop} accent />
          <PolicyField label="Max" value={max} onChange={setMax} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-[12px] text-slate-500">
          Stok saat ini di lokasi: <span className="font-bold tabular-nums text-slate-700">{row.qty.toLocaleString("id-ID")}</span> {row.satuan}
        </div>
      </div>
    </Modal>
  );
}

function PolicyField({ label, value, onChange, accent }: { label: string; value: string; onChange: (v: string) => void; accent?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={cn("text-[10px] font-bold uppercase tracking-wide", accent ? "text-cyan-600" : "text-slate-400")}>{label}</span>
      <input
        type="number" min={0} inputMode="numeric" value={value}
        onChange={(e) => onChange(e.target.value)} placeholder="0"
        className={cn("w-full rounded-lg border bg-white px-2.5 py-2 text-right text-[14px] font-mono font-bold tabular-nums text-slate-800 outline-none transition", accent ? "border-cyan-200" : "border-slate-200", INV_ACCENT.focus)}
      />
    </label>
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
