"use client";

import { useEffect, useMemo, useState } from "react";
import { Truck, ArrowRight, Inbox, ArrowLeftRight, PackageCheck, Plus, Trash2, Loader2, MapPin, Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import {
  InvShell, KpiCard, SectionCard, StatusPill, SearchInput, FilterChip, PrimaryButton,
  EmptyState, SlideOver, InvSelect, useSkeletonDelay, INV_ACCENT,
  tableWrap, tableCls, thCls, tdCls, trCls,
} from "./inventoryShared";
import { DOC_STATUS_CFG, fmtIDR } from "@/lib/inventory/inventoryMock";
import { ApiError } from "@/lib/api/client";
import { listReceipts, createReceipt, postReceipt, type GoodsReceiptDTO } from "@/lib/api/inventory/receipt";
import { listTransfers, createTransfer, postTransfer, cancelTransfer, type StockTransferDTO } from "@/lib/api/inventory/transfer";
import { listInvLocations, listInvStock, type InvLocationDTO, type InvStockRowDTO } from "@/lib/api/inventory/stock";
import { fetchAllVendors, type VendorDTO } from "@/lib/api/inventory/vendor";

type Tab = "penerimaan" | "transfer";

function fmtTgl(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Pengiriman() {
  const loaded = useSkeletonDelay();
  const [tab, setTab] = useState<Tab>("penerimaan");
  const [search, setSearch] = useState("");
  const [receipts, setReceipts] = useState<GoodsReceiptDTO[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const [transfers, setTransfers] = useState<StockTransferDTO[]>([]);
  const [trfLoading, setTrfLoading] = useState(true);
  const [grnOpen, setGrnOpen] = useState<GoodsReceiptDTO | null>(null);
  const [trfOpen, setTrfOpen] = useState<StockTransferDTO | null>(null);
  const [addRcpOpen, setAddRcpOpen] = useState(false);
  const [addTrfOpen, setAddTrfOpen] = useState(false);
  const [grnBusy, setGrnBusy] = useState(false);
  const [trfBusy, setTrfBusy] = useState(false);

  async function refetchReceipts(signal?: AbortSignal) {
    try {
      const { items } = await listReceipts({ limit: 100 }, signal);
      if (!signal?.aborted) setReceipts(items);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Gagal memuat penerimaan", e instanceof ApiError ? e.message : undefined);
    } finally {
      if (!signal?.aborted) setRecLoading(false);
    }
  }
  async function refetchTransfers(signal?: AbortSignal) {
    try {
      const { items } = await listTransfers({ limit: 100 }, signal);
      if (!signal?.aborted) setTransfers(items);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Gagal memuat transfer", e instanceof ApiError ? e.message : undefined);
    } finally {
      if (!signal?.aborted) setTrfLoading(false);
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    void refetchReceipts(ac.signal);
    void refetchTransfers(ac.signal);
    return () => ac.abort();
  }, []);

  const filteredReceipts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return receipts.filter((r) => !q || r.noDokumen.toLowerCase().includes(q) || r.vendorNama.toLowerCase().includes(q));
  }, [receipts, search]);

  const filteredTransfers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transfers.filter((t) => !q || t.noDokumen.toLowerCase().includes(q) || t.fromLocationNama.toLowerCase().includes(q) || t.toLocationNama.toLowerCase().includes(q));
  }, [transfers, search]);

  const isPending = (s: string) => s === "Draft" || s === "Diproses";
  const kpi = useMemo(() => ({
    penerimaan: receipts.length,
    transfer: transfers.length,
    selesai: receipts.filter((r) => r.status === "Selesai").length + transfers.filter((t) => t.status === "Selesai").length,
    pending: receipts.filter((r) => isPending(r.status)).length + transfers.filter((t) => isPending(t.status)).length,
  }), [receipts, transfers]);

  async function doPostReceipt(id: string) {
    setGrnBusy(true);
    try {
      const dto = await postReceipt(id);
      toast.success("Penerimaan diposting", `${dto.noDokumen} — stok diperbarui`);
      setGrnOpen(dto);
      await refetchReceipts();
    } catch (e) {
      toast.error("Gagal posting penerimaan", e instanceof ApiError ? e.message : undefined);
    } finally {
      setGrnBusy(false);
    }
  }

  async function doPostTransfer(id: string) {
    setTrfBusy(true);
    try {
      const dto = await postTransfer(id);
      toast.success("Transfer diposting", `${dto.noDokumen} — stok dipindahkan`);
      setTrfOpen(dto);
      await refetchTransfers();
    } catch (e) {
      toast.error("Gagal posting transfer", e instanceof ApiError ? e.message : undefined);
    } finally {
      setTrfBusy(false);
    }
  }

  async function doCancelTransfer(id: string) {
    setTrfBusy(true);
    try {
      const dto = await cancelTransfer(id);
      toast.success("Transfer dibatalkan", `${dto.noDokumen} — reservasi stok dilepas`);
      setTrfOpen(null);
      await refetchTransfers();
    } catch (e) {
      toast.error("Gagal membatalkan transfer", e instanceof ApiError ? e.message : undefined);
    } finally {
      setTrfBusy(false);
    }
  }

  return (
    <InvShell
      icon={Truck}
      title="Pengiriman"
      description="Penerimaan barang dari rekanan (GRN) dan transfer/mutasi stok antar-lokasi."
      loaded={loaded}
      actions={
        tab === "penerimaan"
          ? <PrimaryButton onClick={() => setAddRcpOpen(true)}>Tambah Penerimaan</PrimaryButton>
          : <PrimaryButton onClick={() => setAddTrfOpen(true)}>Tambah Transfer</PrimaryButton>
      }
    >
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Inbox} label="Penerimaan" value={kpi.penerimaan} sub="dari rekanan" tone="emerald" />
        <KpiCard icon={ArrowLeftRight} label="Transfer" value={kpi.transfer} sub="antar lokasi" tone="cyan" />
        <KpiCard icon={PackageCheck} label="Selesai" value={kpi.selesai} tone="emerald" />
        <KpiCard icon={Truck} label="Draft / Diproses" value={kpi.pending} tone="amber" />
      </div>

      <div className="flex shrink-0 gap-1.5">
        <FilterChip label="Penerimaan (GRN)" active={tab === "penerimaan"} onClick={() => setTab("penerimaan")} count={receipts.length} />
        <FilterChip label="Transfer Internal" active={tab === "transfer"} onClick={() => setTab("transfer")} count={transfers.length} />
      </div>

      <SectionCard className="min-h-0 flex-1" bodyClassName="flex min-h-0 flex-col">
        <div className="border-b border-slate-100 p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari no. dokumen / lokasi / rekanan…" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === "penerimaan" ? (
            recLoading ? (
              <Loading label="Memuat penerimaan…" />
            ) : filteredReceipts.length === 0 ? (
              <EmptyState icon={Inbox} title="Tidak ada penerimaan" description="Klik “Tambah Penerimaan” untuk membuat draft GRN." />
            ) : (
              <div className={tableWrap}>
                <table className={tableCls}>
                  <thead><tr>
                    <th className={thCls}>No. GRN</th><th className={thCls}>Rekanan</th><th className={thCls}>Tujuan</th>
                    <th className={cn(thCls, "text-center")}>Item</th><th className={cn(thCls, "text-center")}>Status</th><th className={cn(thCls, "text-right")}>Tanggal</th>
                  </tr></thead>
                  <tbody>
                    {filteredReceipts.map((r) => {
                      const cfg = DOC_STATUS_CFG[r.status];
                      return (
                        <tr key={r.id} className={cn(trCls, "cursor-pointer")} onClick={() => setGrnOpen(r)}>
                          <td className={cn(tdCls, "font-mono font-semibold text-slate-800")}>{r.noDokumen}</td>
                          <td className={tdCls}>{r.vendorNama}</td>
                          <td className={cn(tdCls, "text-slate-500")}>{r.toLocationNama}</td>
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
            trfLoading ? (
              <Loading label="Memuat transfer…" />
            ) : filteredTransfers.length === 0 ? (
              <EmptyState icon={ArrowLeftRight} title="Tidak ada transfer" description="Klik “Tambah Transfer” untuk membuat draft mutasi antar-lokasi." />
            ) : (
              <div className={tableWrap}>
                <table className={tableCls}>
                  <thead><tr>
                    <th className={thCls}>No. Transfer</th><th className={thCls}>Sumber → Tujuan</th>
                    <th className={cn(thCls, "text-center")}>Item</th><th className={cn(thCls, "text-center")}>Status</th><th className={cn(thCls, "text-right")}>Tanggal</th>
                  </tr></thead>
                  <tbody>
                    {filteredTransfers.map((t) => {
                      const cfg = DOC_STATUS_CFG[t.status];
                      return (
                        <tr key={t.id} className={cn(trCls, "cursor-pointer")} onClick={() => setTrfOpen(t)}>
                          <td className={cn(tdCls, "font-mono font-semibold text-slate-800")}>{t.noDokumen}</td>
                          <td className={cn(tdCls, "text-slate-500")}>
                            <span className="inline-flex items-center gap-1.5 text-[12px]">{t.fromLocationNama} <ArrowRight size={12} className="text-slate-300" /> {t.toLocationNama}</span>
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
      <SlideOver
        open={!!grnOpen} onClose={() => setGrnOpen(null)} title={grnOpen?.noDokumen ?? ""}
        subtitle={grnOpen ? `${grnOpen.vendorNama} · ${fmtTgl(grnOpen.tanggal)}` : ""}
        footer={grnOpen && grnOpen.status !== "Selesai" && grnOpen.status !== "Dibatalkan" ? (
          <button type="button" disabled={grnBusy} onClick={() => doPostReceipt(grnOpen.id)}
            className={cn("inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", grnBusy ? "cursor-not-allowed bg-slate-300" : cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover))}>
            {grnBusy ? <><Loader2 size={13} className="animate-spin" /> Memposting…</> : <><PackageCheck size={14} /> Posting — Terima Barang</>}
          </button>
        ) : undefined}
      >
        {grnOpen && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Status" value={DOC_STATUS_CFG[grnOpen.status].label} />
              <Field label="Tujuan" value={grnOpen.toLocationNama} />
              <Field label="Surat Jalan" value={grnOpen.noSuratJalan ?? "—"} />
              <Field label="No. PO" value={grnOpen.noPo ?? "—"} />
              <Field label="Petugas" value={grnOpen.petugas} />
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 text-left font-semibold">Barang / Batch</th><th className="px-3 py-2 text-right font-semibold">Qty</th><th className="px-3 py-2 text-right font-semibold">Harga Beli</th>
                </tr></thead>
                <tbody>
                  {grnOpen.lines.map((l, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-800">{l.nama}</p>
                        <p className="text-[11px] text-slate-400">{l.kode} · Batch {l.batchNo}{l.expiryDate ? ` · ED ${fmtTgl(l.expiryDate)}` : ""}</p>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-700">{l.qty}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-500">{fmtIDR(l.hargaBeli)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {grnOpen.status === "Selesai" && <p className="text-center text-[12px] font-medium text-emerald-600">✓ Sudah diposting — stok lokasi tujuan bertambah.</p>}
          </div>
        )}
      </SlideOver>

      {/* Transfer detail */}
      <SlideOver
        open={!!trfOpen} onClose={() => setTrfOpen(null)} title={trfOpen?.noDokumen ?? ""}
        subtitle={trfOpen ? `${trfOpen.petugas} · ${fmtTgl(trfOpen.tanggal)}` : ""}
        footer={trfOpen && trfOpen.status !== "Selesai" && trfOpen.status !== "Dibatalkan" ? (
          <div className="flex gap-2">
            <button type="button" disabled={trfBusy} onClick={() => doCancelTransfer(trfOpen.id)}
              className={cn("inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-semibold transition", trfBusy ? "cursor-not-allowed border-slate-200 text-slate-300" : "border-rose-200 text-rose-600 hover:bg-rose-50")}>
              <X size={14} /> Batalkan
            </button>
            <button type="button" disabled={trfBusy} onClick={() => doPostTransfer(trfOpen.id)}
              className={cn("inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", trfBusy ? "cursor-not-allowed bg-slate-300" : cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover))}>
              {trfBusy ? <><Loader2 size={13} className="animate-spin" /> Memposting…</> : <><PackageCheck size={14} /> Posting — Pindahkan Stok</>}
            </button>
          </div>
        ) : undefined}
      >
        {trfOpen && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Sumber" value={trfOpen.fromLocationNama} />
              <Field label="Tujuan" value={trfOpen.toLocationNama} />
              <Field label="Status" value={DOC_STATUS_CFG[trfOpen.status].label} />
              <Field label="Petugas" value={trfOpen.petugas} />
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 text-left font-semibold">Barang</th><th className="px-3 py-2 text-right font-semibold">Qty</th>
                </tr></thead>
                <tbody>
                  {trfOpen.lines.map((l, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2"><p className="font-semibold text-slate-800">{l.nama}</p><p className="text-[11px] text-slate-400">{l.kode}{l.batchNo ? ` · Batch ${l.batchNo}` : " · FEFO"}</p></td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-700">{l.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {trfOpen.status === "Selesai" && <p className="text-center text-[12px] font-medium text-emerald-600">✓ Sudah diposting — stok pindah ke lokasi tujuan.</p>}
          </div>
        )}
      </SlideOver>

      <AddReceiptDrawer open={addRcpOpen} onClose={() => setAddRcpOpen(false)} onCreated={() => { setAddRcpOpen(false); void refetchReceipts(); }} />
      <AddTransferDrawer open={addTrfOpen} onClose={() => setAddTrfOpen(false)} onCreated={() => { setAddTrfOpen(false); void refetchTransfers(); }} />
    </InvShell>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-slate-400">
      <Loader2 size={16} className="animate-spin text-cyan-500" /><span className="text-[13px]">{label}</span>
    </div>
  );
}

// ── Create Penerimaan drawer ─────────────────────────────────────────

interface RcpLine { key: number; itemKey: string; batchNo: string; expiryDate: string; qty: string; hargaBeli: string; }
let rcpSeq = 1;
const blankRcp = (): RcpLine => ({ key: rcpSeq++, itemKey: "", batchNo: "", expiryDate: "", qty: "", hargaBeli: "" });

function AddReceiptDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [vendors, setVendors] = useState<VendorDTO[]>([]);
  const [locations, setLocations] = useState<InvLocationDTO[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [tujuanId, setTujuanId] = useState("");
  const [noSuratJalan, setNoSuratJalan] = useState("");
  const [items, setItems] = useState<InvStockRowDTO[]>([]);
  const [lines, setLines] = useState<RcpLine[]>([blankRcp()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    (async () => {
      try {
        const [vs, ls] = await Promise.all([fetchAllVendors(ac.signal), listInvLocations(ac.signal)]);
        if (ac.signal.aborted) return;
        setVendors(vs.filter((v) => v.status === "Aktif"));
        setLocations(ls);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat data", e instanceof ApiError ? e.message : undefined);
      }
    })();
    return () => ac.abort();
  }, [open]);

  useEffect(() => {
    if (!tujuanId) { setItems([]); return; }
    const ac = new AbortController();
    (async () => {
      try {
        const rows = await listInvStock(tujuanId, ac.signal);
        if (!ac.signal.aborted) setItems(rows);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat item lokasi", e instanceof ApiError ? e.message : undefined);
      }
    })();
    return () => ac.abort();
  }, [tujuanId]);

  const itemOptions = useMemo(
    () => items.map((r) => ({ value: `${r.itemJenis}:${r.itemId}`, label: r.nama, sub: r.kode })),
    [items],
  );

  const validLines = lines.filter((l) => l.itemKey && l.batchNo.trim() && Number(l.qty) > 0);
  const valid = !!(vendorId && tujuanId && validLines.length > 0);

  function reset() {
    setVendorId(""); setTujuanId(""); setNoSuratJalan(""); setItems([]); setLines([blankRcp()]);
  }

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await createReceipt({
        vendorId,
        toLocationId: tujuanId,
        noSuratJalan: noSuratJalan.trim() || undefined,
        lines: validLines.map((l) => {
          const [jenis, itemId] = l.itemKey.split(":");
          return {
            itemJenis: jenis as "Obat" | "BMHP",
            itemId,
            batchNo: l.batchNo.trim(),
            expiryDate: l.expiryDate || undefined,
            qty: Number(l.qty),
            hargaBeli: l.hargaBeli ? Number(l.hargaBeli) : undefined,
          };
        }),
      });
      toast.success("Draft penerimaan dibuat", "Buka dokumen → Posting untuk menambah stok.");
      reset();
      onCreated();
    } catch (e) {
      toast.error("Gagal menyimpan penerimaan", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  const setLine = (key: number, patch: Partial<RcpLine>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <SlideOver
      open={open} onClose={onClose} title="Tambah Penerimaan (GRN)" subtitle="Draft — stok bertambah saat diposting"
      footer={
        <button type="button" disabled={!valid || saving} onClick={submit}
          className={cn("inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", valid && !saving ? cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover) : "cursor-not-allowed bg-slate-300")}>
          {saving && <Loader2 size={13} className="animate-spin" />} {saving ? "Menyimpan…" : "Simpan Draft"}
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rekanan *</span>
          <InvSelect value={vendorId} onChange={setVendorId} placeholder="Pilih rekanan…" icon={Building2}
            options={vendors.map((v) => ({ value: v.id, label: v.nama, sub: v.jenis }))} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lokasi Tujuan *</span>
          <InvSelect value={tujuanId} onChange={setTujuanId} placeholder="Pilih depo/gudang…" icon={MapPin}
            options={locations.map((l) => ({ value: l.id, label: l.nama, sub: l.tipe === "Gudang" ? "Gudang" : "Depo Farmasi" }))} />
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">No. Surat Jalan</span>
          <input value={noSuratJalan} onChange={(e) => setNoSuratJalan(e.target.value)} placeholder="SJ/…"
            className={cn("w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-800 outline-none transition", INV_ACCENT.focus)} />
        </label>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Baris Barang</span>
          <button type="button" onClick={() => setLines((prev) => [...prev, blankRcp()])}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
            <Plus size={12} /> Baris
          </button>
        </div>

        {!tujuanId && <p className="text-[12px] text-slate-400">Pilih lokasi tujuan dulu untuk memilih barang.</p>}

        <div className="flex flex-col gap-2.5">
          {lines.map((l) => (
            <div key={l.key} className="rounded-xl border border-slate-200 bg-slate-50/40 p-2.5">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <InvSelect value={l.itemKey} onChange={(v) => setLine(l.key, { itemKey: v })} placeholder={tujuanId ? "Pilih barang…" : "Pilih lokasi dulu"} options={itemOptions} />
                </div>
                {lines.length > 1 && (
                  <button type="button" onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                    className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-rose-500 transition hover:bg-rose-50" aria-label="Hapus baris">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <LineInput label="No. Batch *" value={l.batchNo} onChange={(v) => setLine(l.key, { batchNo: v })} placeholder="LOT…" />
                <LineInput label="ED" type="date" value={l.expiryDate} onChange={(v) => setLine(l.key, { expiryDate: v })} />
                <LineInput label="Qty *" type="number" value={l.qty} onChange={(v) => setLine(l.key, { qty: v })} placeholder="0" />
                <LineInput label="Harga Beli" type="number" value={l.hargaBeli} onChange={(v) => setLine(l.key, { hargaBeli: v })} placeholder="0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideOver>
  );
}

// ── Create Transfer drawer ─────────────────────────────────────────

interface TrfLine { key: number; itemKey: string; qty: string; }
let trfSeq = 1;
const blankTrf = (): TrfLine => ({ key: trfSeq++, itemKey: "", qty: "" });

function AddTransferDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [locations, setLocations] = useState<InvLocationDTO[]>([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [items, setItems] = useState<InvStockRowDTO[]>([]);
  const [lines, setLines] = useState<TrfLine[]>([blankTrf()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    (async () => {
      try {
        const ls = await listInvLocations(ac.signal);
        if (!ac.signal.aborted) setLocations(ls);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat lokasi", e instanceof ApiError ? e.message : undefined);
      }
    })();
    return () => ac.abort();
  }, [open]);

  useEffect(() => {
    if (!fromId) { setItems([]); return; }
    const ac = new AbortController();
    (async () => {
      try {
        const rows = await listInvStock(fromId, ac.signal);
        if (!ac.signal.aborted) setItems(rows.filter((r) => r.qty > 0));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat item lokasi", e instanceof ApiError ? e.message : undefined);
      }
    })();
    return () => ac.abort();
  }, [fromId]);

  const itemOptions = useMemo(
    () => items.map((r) => ({ value: `${r.itemJenis}:${r.itemId}`, label: r.nama, sub: `${r.kode} · sisa ${r.qty - r.qtyReserved} ${r.satuan}` })),
    [items],
  );
  const tujuanOptions = useMemo(() => locations.filter((l) => l.id !== fromId), [locations, fromId]);

  const validLines = lines.filter((l) => l.itemKey && Number(l.qty) > 0);
  const valid = !!(fromId && toId && fromId !== toId && validLines.length > 0);

  function reset() {
    setFromId(""); setToId(""); setItems([]); setLines([blankTrf()]);
  }

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await createTransfer({
        fromLocationId: fromId,
        toLocationId: toId,
        lines: validLines.map((l) => {
          const [jenis, itemId] = l.itemKey.split(":");
          return { itemJenis: jenis as "Obat" | "BMHP", itemId, qty: Number(l.qty) };
        }),
      });
      toast.success("Draft transfer dibuat", "Stok sumber direservasi · buka dokumen → Posting untuk memindahkan.");
      reset();
      onCreated();
    } catch (e) {
      toast.error("Gagal menyimpan transfer", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  const setLine = (key: number, patch: Partial<TrfLine>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <SlideOver
      open={open} onClose={onClose} title="Tambah Transfer Internal" subtitle="Draft — stok sumber direservasi (FEFO saat posting)"
      footer={
        <button type="button" disabled={!valid || saving} onClick={submit}
          className={cn("inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", valid && !saving ? cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover) : "cursor-not-allowed bg-slate-300")}>
          {saving && <Loader2 size={13} className="animate-spin" />} {saving ? "Menyimpan…" : "Simpan Draft"}
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sumber *</span>
            <InvSelect value={fromId} onChange={setFromId} placeholder="Gudang/Depo…" icon={MapPin}
              options={locations.map((l) => ({ value: l.id, label: l.nama, sub: l.tipe === "Gudang" ? "Gudang" : "Depo" }))} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tujuan *</span>
            <InvSelect value={toId} onChange={setToId} placeholder="Gudang/Depo…" icon={MapPin}
              options={tujuanOptions.map((l) => ({ value: l.id, label: l.nama, sub: l.tipe === "Gudang" ? "Gudang" : "Depo" }))} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Baris Barang</span>
          <button type="button" onClick={() => setLines((prev) => [...prev, blankTrf()])}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
            <Plus size={12} /> Baris
          </button>
        </div>

        {!fromId && <p className="text-[12px] text-slate-400">Pilih lokasi sumber dulu untuk memilih barang.</p>}

        <div className="flex flex-col gap-2.5">
          {lines.map((l) => (
            <div key={l.key} className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/40 p-2.5">
              <div className="min-w-0 flex-1">
                <InvSelect value={l.itemKey} onChange={(v) => setLine(l.key, { itemKey: v })} placeholder={fromId ? "Pilih barang…" : "Pilih sumber dulu"} options={itemOptions} />
              </div>
              <label className="flex w-24 shrink-0 flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Qty *</span>
                <input type="number" min={0} value={l.qty} onChange={(e) => setLine(l.key, { qty: e.target.value })} placeholder="0"
                  className={cn("w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12px] font-mono tabular-nums text-slate-800 outline-none transition", INV_ACCENT.focus)} />
              </label>
              {lines.length > 1 && (
                <button type="button" onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                  className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-rose-500 transition hover:bg-rose-50" aria-label="Hapus baris">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </SlideOver>
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

function LineInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min={type === "number" ? 0 : undefined}
        className={cn("w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12px] text-slate-800 outline-none transition", type === "number" && "font-mono tabular-nums", INV_ACCENT.focus)} />
    </label>
  );
}
