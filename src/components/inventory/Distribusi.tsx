"use client";

import { useEffect, useMemo, useState } from "react";
import { Share2, ArrowRight, PackageCheck, Inbox, FileStack, Send, Plus, Trash2, Loader2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import {
  InvShell, KpiCard, SectionCard, StatusPill, SearchInput, FilterChip, PrimaryButton,
  EmptyState, SlideOver, InvSelect, useSkeletonDelay, INV_ACCENT,
  tableWrap, tableCls, thCls, tdCls, trCls,
} from "./inventoryShared";
import { DOC_STATUS_CFG } from "@/lib/inventory/inventoryMock";
import { ApiError } from "@/lib/api/client";
import {
  listDistribusi, createDistribusi, fulfillDistribusi, cancelDistribusi, type DistribusiDTO,
} from "@/lib/api/inventory/distribusi";
import { listInvLocations, listInvStock, type InvLocationDTO, type InvStockRowDTO } from "@/lib/api/inventory/stock";

type DocStatus = DistribusiDTO["status"];

function fmtTgl(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Distribusi() {
  const loaded = useSkeletonDelay();
  const [list, setList] = useState<DistribusiDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<DocStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refetch(signal?: AbortSignal) {
    try {
      const { items } = await listDistribusi({ limit: 100 }, signal);
      if (!signal?.aborted) setList(items);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Gagal memuat permintaan", e instanceof ApiError ? e.message : undefined);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    void refetch(ac.signal);
    return () => ac.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((d) => status === "all" || d.status === status)
      .filter((d) => !q || d.noDokumen.toLowerCase().includes(q) || d.pemohon.toLowerCase().includes(q));
  }, [list, status, search]);

  const stats = useMemo(() => ({
    total: list.length,
    draft: list.filter((d) => d.status === "Draft").length,
    proses: list.filter((d) => d.status === "Diproses").length,
    selesai: list.filter((d) => d.status === "Selesai").length,
  }), [list]);

  const open = openId ? list.find((d) => d.id === openId) ?? null : null;

  async function doFulfill(id: string) {
    setBusy(true);
    try {
      const dto = await fulfillDistribusi(id);
      toast.success("Permintaan diproses", `${dto.noDokumen} — barang dikeluarkan, stok diperbarui`);
      await refetch();
    } catch (e) {
      toast.error("Gagal memproses permintaan", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function doCancel(id: string) {
    setBusy(true);
    try {
      const dto = await cancelDistribusi(id);
      toast.success("Permintaan dibatalkan", `${dto.noDokumen} — reservasi stok dilepas`);
      setOpenId(null);
      await refetch();
    } catch (e) {
      toast.error("Gagal membatalkan", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InvShell
      icon={Share2}
      title="Distribusi"
      description="Permintaan (amprahan) antar lokasi farmasi → pengeluaran barang dari gudang/depo sumber."
      loaded={loaded}
      actions={<PrimaryButton onClick={() => setAddOpen(true)}>Tambah Permintaan</PrimaryButton>}
    >
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={FileStack} label="Total Permintaan" value={stats.total} tone="cyan" />
        <KpiCard icon={Inbox} label="Draft" value={stats.draft} tone="slate" />
        <KpiCard icon={Send} label="Diproses" value={stats.proses} tone="amber" />
        <KpiCard icon={PackageCheck} label="Selesai" value={stats.selesai} tone="emerald" />
      </div>

      <SectionCard className="min-h-0 flex-1" bodyClassName="flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari no. dokumen / pemohon…" className="min-w-50 flex-1" />
          <div className="flex flex-wrap gap-1.5">
            {(["all", "Draft", "Diproses", "Selesai", "Dibatalkan"] as const).map((s) => (
              <FilterChip key={s} label={s === "all" ? "Semua" : DOC_STATUS_CFG[s].label} active={status === s} onClick={() => setStatus(s)} />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin text-cyan-500" /><span className="text-[13px]">Memuat permintaan…</span>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Share2} title="Tidak ada permintaan" description="Klik “Tambah Permintaan” untuk membuat amprahan." />
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
                            {d.fromLocationNama} <ArrowRight size={12} className="text-slate-300" /> {d.toLocationNama}
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
          <div className="flex gap-2">
            <button
              type="button" disabled={busy} onClick={() => doCancel(open.id)}
              className={cn("inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-semibold transition",
                busy ? "cursor-not-allowed border-slate-200 text-slate-300" : "border-rose-200 text-rose-600 hover:bg-rose-50")}>
              <X size={14} /> Batalkan
            </button>
            <button
              type="button" disabled={busy} onClick={() => doFulfill(open.id)}
              className={cn("inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition",
                busy ? "cursor-not-allowed bg-slate-300" : cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover))}>
              {busy ? <><Loader2 size={13} className="animate-spin" /> Memproses…</> : <><PackageCheck size={15} /> Proses & Keluarkan Barang</>}
            </button>
          </div>
        ) : undefined}
      >
        {open && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Sumber" value={open.fromLocationNama} />
              <Field label="Tujuan" value={open.toLocationNama} />
              <Field label="Status" value={DOC_STATUS_CFG[open.status].label} />
              <Field label="Petugas" value={open.petugas ?? "—"} />
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
                  {open.lines.map((l, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-800">{l.nama}</p>
                        <p className="text-[11px] text-slate-400">{l.kode}</p>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-600">{l.qtyMinta}</td>
                      <td className={cn("px-3 py-2 text-right font-mono font-bold tabular-nums", l.qtyKeluar > 0 ? "text-emerald-600" : "text-slate-300")}>{l.qtyKeluar}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {open.status === "Selesai" && <p className="text-center text-[12px] font-medium text-emerald-600">✓ Diproses — stok dipindah ke lokasi tujuan.</p>}
          </div>
        )}
      </SlideOver>

      <AddDistribusiDrawer open={addOpen} onClose={() => setAddOpen(false)} onCreated={() => { setAddOpen(false); void refetch(); }} />
    </InvShell>
  );
}

// ── Create drawer ─────────────────────────────────────────

interface NewLine { key: number; itemKey: string; qtyMinta: string; }
let lineSeq = 1;
const blankLine = (): NewLine => ({ key: lineSeq++, itemKey: "", qtyMinta: "" });

function AddDistribusiDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [locations, setLocations] = useState<InvLocationDTO[]>([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [pemohon, setPemohon] = useState("");
  const [items, setItems] = useState<InvStockRowDTO[]>([]);
  const [lines, setLines] = useState<NewLine[]>([blankLine()]);
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

  // Item ber-stok di lokasi sumber (untuk picker baris).
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

  const validLines = lines.filter((l) => l.itemKey && Number(l.qtyMinta) > 0);
  const valid = !!(fromId && toId && fromId !== toId && pemohon.trim() && validLines.length > 0);

  function reset() {
    setFromId(""); setToId(""); setPemohon(""); setItems([]); setLines([blankLine()]);
  }

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await createDistribusi({
        fromLocationId: fromId,
        toLocationId: toId,
        pemohon: pemohon.trim(),
        lines: validLines.map((l) => {
          const [jenis, itemId] = l.itemKey.split(":");
          return { itemJenis: jenis as "Obat" | "BMHP", itemId, qtyMinta: Number(l.qtyMinta) };
        }),
      });
      toast.success("Draft permintaan dibuat", "Stok sumber direservasi · buka dokumen → Proses untuk mengeluarkan.");
      reset();
      onCreated();
    } catch (e) {
      toast.error("Gagal menyimpan permintaan", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  const setLine = (key: number, patch: Partial<NewLine>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <SlideOver
      open={open} onClose={onClose} title="Tambah Permintaan (Amprahan)" subtitle="Draft — stok sumber direservasi saat disimpan"
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
            <InvSelect value={toId} onChange={setToId} placeholder="Depo/Unit…" icon={MapPin}
              options={tujuanOptions.map((l) => ({ value: l.id, label: l.nama, sub: l.tipe === "Gudang" ? "Gudang" : "Depo" }))} />
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pemohon *</span>
          <input value={pemohon} onChange={(e) => setPemohon(e.target.value)} placeholder="Nama unit / petugas peminta…"
            className={cn("w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-800 outline-none transition", INV_ACCENT.focus)} />
        </label>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Baris Barang</span>
          <button type="button" onClick={() => setLines((prev) => [...prev, blankLine()])}
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
                <input type="number" min={0} value={l.qtyMinta} onChange={(e) => setLine(l.key, { qtyMinta: e.target.value })} placeholder="0"
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
