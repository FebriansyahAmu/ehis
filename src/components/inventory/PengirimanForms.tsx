"use client";

// Form tambah Pengiriman — modal dua panel (katalog ↔ keranjang), gaya Distribusi.
// AddReceiptDrawer (Penerimaan/GRN: katalog lokasi tujuan + batch/ED/qty/harga per item) &
// AddTransferDrawer (Transfer internal: katalog sumber qty>0 + qty per item). Petugas = sesi login
// (read-only; server menetapkan dari actor). CatalogPanel di-remount via `key` saat lokasi berganti.

import { useEffect, useMemo, useState } from "react";
import { Inbox, ArrowLeftRight, Plus, Trash2, Loader2, MapPin, Building2, Check, Search, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { useSession } from "@/contexts/SessionContext";
import { Modal, InvSelect, SearchInput, INV_ACCENT } from "./inventoryShared";
import { ApiError } from "@/lib/api/client";
import { createReceipt } from "@/lib/api/inventory/receipt";
import { createTransfer } from "@/lib/api/inventory/transfer";
import { listInvLocations, listInvStock, type InvLocationDTO, type InvStockRowDTO } from "@/lib/api/inventory/stock";
import { fetchAllVendors, type VendorDTO } from "@/lib/api/inventory/vendor";
import { DatePicker } from "@/components/shared/inputs";

// ── Create Penerimaan (GRN) — modal dua panel (katalog ↔ keranjang) ───────────

interface RcpCartRow { itemKey: string; batchNo: string; expiryDate: string; qty: string; hargaBeli: string; }

export function AddReceiptDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { session } = useSession();
  const petugas = session?.namaTampil?.trim() ?? "";
  const [vendors, setVendors] = useState<VendorDTO[]>([]);
  const [locations, setLocations] = useState<InvLocationDTO[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [tujuanId, setTujuanId] = useState("");
  const [noSuratJalan, setNoSuratJalan] = useState("");
  const [items, setItems] = useState<InvStockRowDTO[]>([]);
  const [cart, setCart] = useState<RcpCartRow[]>([]);
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

  // Katalog = item ber-saldo di lokasi tujuan (termasuk qty 0 → bisa diisi ulang). Ganti tujuan → reset keranjang.
  useEffect(() => {
    setCart([]);
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

  const itemByKey = useMemo(() => {
    const m = new Map<string, InvStockRowDTO>();
    for (const r of items) m.set(`${r.itemJenis}:${r.itemId}`, r);
    return m;
  }, [items]);
  const inCart = useMemo(() => new Set(cart.map((c) => c.itemKey)), [cart]);

  const validLines = cart.filter((c) => Number(c.qty) > 0);
  const valid = !!(vendorId && tujuanId && validLines.length > 0);

  const addToCart = (key: string) =>
    setCart((prev) => (prev.some((c) => c.itemKey === key) ? prev : [...prev, { itemKey: key, batchNo: "", expiryDate: "", qty: "1", hargaBeli: "" }]));
  const removeFromCart = (key: string) => setCart((prev) => prev.filter((c) => c.itemKey !== key));
  const setRow = (key: string, patch: Partial<RcpCartRow>) => setCart((prev) => prev.map((c) => (c.itemKey === key ? { ...c, ...patch } : c)));

  function reset() {
    setVendorId(""); setTujuanId(""); setNoSuratJalan(""); setItems([]); setCart([]);
  }

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await createReceipt({
        vendorId,
        toLocationId: tujuanId,
        noSuratJalan: noSuratJalan.trim() || undefined,
        lines: validLines.map((c) => {
          const [jenis, itemId] = c.itemKey.split(":");
          return {
            itemJenis: jenis as "Obat" | "BMHP",
            itemId,
            batchNo: c.batchNo.trim() || undefined,
            expiryDate: c.expiryDate || undefined,
            qty: Number(c.qty),
            hargaBeli: c.hargaBeli ? Number(c.hargaBeli) : undefined,
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

  return (
    <Modal
      open={open} onClose={onClose} icon={Inbox} width="max-w-5xl"
      title="Tambah Penerimaan (GRN)" subtitle="Pilih barang dari katalog lokasi tujuan → isi batch / ED / qty / harga"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-slate-500">
            {validLines.length > 0
              ? <><span className="font-bold text-slate-700">{validLines.length}</span> barang diterima</>
              : "Belum ada barang dipilih"}
          </span>
          <button type="button" disabled={!valid || saving} onClick={submit}
            className={cn("inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", valid && !saving ? cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover) : "cursor-not-allowed bg-slate-300")}>
            {saving && <Loader2 size={13} className="animate-spin" />} {saving ? "Menyimpan…" : "Simpan Draft"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <input value={noSuratJalan} onChange={(e) => setNoSuratJalan(e.target.value)} placeholder="SJ/… (opsional)"
              className={cn("w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-800 outline-none transition", INV_ACCENT.focus)} />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Petugas</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[13px] text-slate-700">
              <User size={14} className="shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate font-semibold">{petugas || "—"}</span>
              <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-200">Sesi login</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <CatalogPanel key={tujuanId || "none"} items={items} ready={!!tujuanId} emptyHint="Pilih lokasi tujuan dulu" inCart={inCart} onAdd={addToCart} />

          <div className="flex h-96 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
              <p className="text-[12px] font-bold text-slate-700">Barang Diterima</p>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", cart.length > 0 ? cn(INV_ACCENT.bg, INV_ACCENT.text) : "bg-slate-100 text-slate-500")}>{cart.length}</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {cart.length === 0 ? (
                <PanelHint icon={Inbox} text="Keranjang kosong — pilih barang di panel kiri." />
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {cart.map((c) => {
                    const it = itemByKey.get(c.itemKey);
                    return (
                      <li key={c.itemKey} className="rounded-lg border border-slate-200 bg-slate-50/40 p-2">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-semibold text-slate-800">{it?.nama ?? c.itemKey}</p>
                            <p className="text-[11px] text-slate-400">{it?.kode}</p>
                          </div>
                          <button type="button" onClick={() => removeFromCart(c.itemKey)}
                            className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-rose-500 transition hover:bg-rose-50" aria-label="Hapus barang">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <LineInput label="No. Batch" value={c.batchNo} onChange={(v) => setRow(c.itemKey, { batchNo: v })} placeholder="LOT… (opsional)" />
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">ED</span>
                            <DatePicker value={c.expiryDate} onChange={(v) => setRow(c.itemKey, { expiryDate: v })} placeholder="ED (opsional)" />
                          </div>
                          <LineInput label="Qty *" type="number" value={c.qty} onChange={(v) => setRow(c.itemKey, { qty: v })} placeholder="0" />
                          <LineInput label="Harga Beli" type="number" value={c.hargaBeli} onChange={(v) => setRow(c.itemKey, { hargaBeli: v })} placeholder="0" />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Create Transfer — modal dua panel (katalog sumber ↔ keranjang) ────────────

interface TrfCartRow { itemKey: string; qty: string; }

export function AddTransferDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { session } = useSession();
  const petugas = session?.namaTampil?.trim() ?? "";
  const [locations, setLocations] = useState<InvLocationDTO[]>([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [items, setItems] = useState<InvStockRowDTO[]>([]);
  const [cart, setCart] = useState<TrfCartRow[]>([]);
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

  // Item ber-stok di lokasi sumber (qty>0). Ganti sumber → reset keranjang.
  useEffect(() => {
    setCart([]);
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

  const itemByKey = useMemo(() => {
    const m = new Map<string, InvStockRowDTO>();
    for (const r of items) m.set(`${r.itemJenis}:${r.itemId}`, r);
    return m;
  }, [items]);
  const inCart = useMemo(() => new Set(cart.map((c) => c.itemKey)), [cart]);
  const tujuanOptions = useMemo(() => locations.filter((l) => l.id !== fromId), [locations, fromId]);

  const validLines = cart.filter((c) => Number(c.qty) > 0);
  const valid = !!(fromId && toId && fromId !== toId && validLines.length > 0);

  const addToCart = (key: string) =>
    setCart((prev) => (prev.some((c) => c.itemKey === key) ? prev : [...prev, { itemKey: key, qty: "1" }]));
  const removeFromCart = (key: string) => setCart((prev) => prev.filter((c) => c.itemKey !== key));
  const setQty = (key: string, qty: string) => setCart((prev) => prev.map((c) => (c.itemKey === key ? { ...c, qty } : c)));

  function reset() {
    setFromId(""); setToId(""); setItems([]); setCart([]);
  }

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await createTransfer({
        fromLocationId: fromId,
        toLocationId: toId,
        lines: validLines.map((c) => {
          const [jenis, itemId] = c.itemKey.split(":");
          return { itemJenis: jenis as "Obat" | "BMHP", itemId, qty: Number(c.qty) };
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

  return (
    <Modal
      open={open} onClose={onClose} icon={ArrowLeftRight} width="max-w-5xl"
      title="Tambah Transfer Internal" subtitle="Pilih barang dari lokasi sumber → atur jumlah (FEFO saat posting)"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-slate-500">
            {validLines.length > 0
              ? <><span className="font-bold text-slate-700">{validLines.length}</span> barang dipindahkan</>
              : "Belum ada barang dipilih"}
          </span>
          <button type="button" disabled={!valid || saving} onClick={submit}
            className={cn("inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", valid && !saving ? cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover) : "cursor-not-allowed bg-slate-300")}>
            {saving && <Loader2 size={13} className="animate-spin" />} {saving ? "Menyimpan…" : "Simpan Draft"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Petugas</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[13px] text-slate-700">
              <User size={14} className="shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate font-semibold">{petugas || "—"}</span>
              <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-200">Sesi login</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <CatalogPanel key={fromId || "none"} items={items} ready={!!fromId} emptyHint="Pilih lokasi sumber dulu" inCart={inCart} onAdd={addToCart} />

          <div className="flex h-96 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
              <p className="text-[12px] font-bold text-slate-700">Akan Dipindahkan</p>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", cart.length > 0 ? cn(INV_ACCENT.bg, INV_ACCENT.text) : "bg-slate-100 text-slate-500")}>{cart.length}</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {cart.length === 0 ? (
                <PanelHint icon={ArrowLeftRight} text="Keranjang kosong — pilih barang di panel kiri." />
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {cart.map((c) => {
                    const it = itemByKey.get(c.itemKey);
                    const sisa = it ? it.qty - it.qtyReserved : 0;
                    const over = Number(c.qty) > sisa;
                    return (
                      <li key={c.itemKey} className="rounded-lg border border-slate-200 bg-slate-50/40 p-2">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-semibold text-slate-800">{it?.nama ?? c.itemKey}</p>
                            <p className="text-[11px] text-slate-400">{it?.kode} · sisa {sisa} {it?.satuan}</p>
                          </div>
                          <input type="number" min={0} value={c.qty} onChange={(e) => setQty(c.itemKey, e.target.value)} placeholder="0"
                            className={cn("w-20 shrink-0 rounded-lg border bg-white px-2 py-1.5 text-right text-[12px] font-mono tabular-nums text-slate-800 outline-none transition",
                              over ? "border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100" : cn("border-slate-200", INV_ACCENT.focus))} />
                          <button type="button" onClick={() => removeFromCart(c.itemKey)}
                            className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-rose-500 transition hover:bg-rose-50" aria-label="Hapus barang">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {over && <p className="mt-1 text-[10.5px] font-medium text-amber-600">Melebihi stok tersedia ({sisa} {it?.satuan}).</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Shared: panel katalog kiri (toggle Obat/BMHP + search + klik-tambah) ──────
// Reset pencarian/toggle saat lokasi berganti dilakukan via remount (`key` di pemanggil).

type JenisSeg = "all" | "Obat" | "BMHP";

function CatalogPanel({
  items, ready, emptyHint, inCart, onAdd,
}: {
  items: InvStockRowDTO[];
  ready: boolean;
  emptyHint: string;
  inCart: Set<string>;
  onAdd: (key: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [jenis, setJenis] = useState<JenisSeg>("all");

  const counts = useMemo(() => {
    let obat = 0;
    for (const r of items) if (r.itemJenis === "Obat") obat++;
    return { all: items.length, Obat: obat, BMHP: items.length - obat };
  }, [items]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (r) =>
        (jenis === "all" || r.itemJenis === jenis) &&
        (!q || r.nama.toLowerCase().includes(q) || r.kode.toLowerCase().includes(q)),
    );
  }, [items, query, jenis]);

  return (
    <div className="flex h-96 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
        <p className="text-[12px] font-bold text-slate-700">Katalog Barang</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{visible.length}</span>
      </div>
      <div className="shrink-0 space-y-2 border-b border-slate-100 p-2">
        <SearchInput value={query} onChange={setQuery} placeholder={ready ? "Cari nama / kode barang…" : emptyHint} />
        <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
          {([
            ["all", "Semua", counts.all],
            ["Obat", "Obat · OBT", counts.Obat],
            ["BMHP", "BMHP · BHP", counts.BMHP],
          ] as const).map(([j, label, n]) => (
            <button key={j} type="button" onClick={() => setJenis(j)}
              className={cn("flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition",
                jenis === j ? cn("bg-white shadow-sm", INV_ACCENT.text) : "text-slate-500 hover:text-slate-700")}>
              {label}
              <span className={cn("rounded px-1 text-[9px] font-bold tabular-nums", jenis === j ? cn(INV_ACCENT.bg, INV_ACCENT.text) : "bg-slate-200 text-slate-500")}>{n}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {!ready ? (
          <PanelHint icon={MapPin} text={emptyHint} />
        ) : visible.length === 0 ? (
          <PanelHint icon={Search} text="Tak ada barang cocok." />
        ) : (
          <ul className="flex flex-col gap-1">
            {visible.map((r) => {
              const key = `${r.itemJenis}:${r.itemId}`;
              const sisa = r.qty - r.qtyReserved;
              const added = inCart.has(key);
              return (
                <li key={key}>
                  <button type="button" disabled={added} onClick={() => onAdd(key)}
                    className={cn("flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition",
                      added ? cn("cursor-default", INV_ACCENT.border, INV_ACCENT.bg) : "border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/40")}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-slate-800">{r.nama}</p>
                      <p className="text-[11px] text-slate-400">{r.kode} · sisa <span className={cn("font-mono tabular-nums", sisa <= 0 ? "text-rose-500" : "text-slate-500")}>{sisa}</span> {r.satuan}</p>
                    </div>
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", added ? INV_ACCENT.text : "bg-slate-100 text-slate-500")}>
                      {added ? <Check size={14} /> : <Plus size={14} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function PanelHint({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4 text-center text-slate-400">
      <Icon size={22} className="text-slate-300" />
      <p className="text-[12px]">{text}</p>
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
