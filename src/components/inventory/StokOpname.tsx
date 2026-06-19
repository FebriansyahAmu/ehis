"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, FileStack, ClipboardList, CheckCircle2, AlertTriangle, Loader2, MapPin, Save } from "lucide-react";
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
  listOpname, createOpname, saveOpnameCounts, postOpname, type OpnameDTO,
} from "@/lib/api/inventory/opname";
import { listInvLocations, type InvLocationDTO } from "@/lib/api/inventory/stock";

type OpnameStatus = OpnameDTO["status"];

function fmtTgl(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function StokOpname() {
  const loaded = useSkeletonDelay();
  const [list, setList] = useState<OpnameDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OpnameStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, string>>({}); // line id → input
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  async function refetch(signal?: AbortSignal) {
    try {
      const { items } = await listOpname({ limit: 100 }, signal);
      if (!signal?.aborted) setList(items);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Gagal memuat sesi opname", e instanceof ApiError ? e.message : undefined);
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
      .filter((s) => status === "all" || s.status === status)
      .filter((s) => !q || s.noDokumen.toLowerCase().includes(q) || s.locationNama.toLowerCase().includes(q));
  }, [list, status, search]);

  const stats = useMemo(() => ({
    total: list.length,
    counting: list.filter((s) => s.status === "Counting" || s.status === "Draft").length,
    review: list.filter((s) => s.status === "Review").length,
    posted: list.filter((s) => s.status === "Posted").length,
  }), [list]);

  const open = openId ? list.find((s) => s.id === openId) ?? null : null;

  // Inisialisasi input hitungan saat membuka sesi (per id, agar edit tak ter-reset oleh refetch).
  function openSession(s: OpnameDTO) {
    setCounts(Object.fromEntries(s.lines.map((l) => [l.id, l.qtyFisik === null ? "" : String(l.qtyFisik)])));
    setOpenId(s.id);
  }

  const editable = open ? open.status !== "Posted" : false;
  const openComplete = open ? open.lines.length > 0 && open.lines.every((l) => counts[l.id] !== undefined && counts[l.id] !== "") : false;
  const openSelisih = open
    ? open.lines.reduce((n, l) => n + (counts[l.id] !== "" && counts[l.id] !== undefined && Number(counts[l.id]) !== l.qtySistem ? 1 : 0), 0)
    : 0;

  function buildItems(s: OpnameDTO) {
    return s.lines.map((l) => ({
      itemRowId: l.id,
      qtyFisik: counts[l.id] === "" || counts[l.id] === undefined ? null : Number(counts[l.id]),
      alasan: l.alasan,
    }));
  }

  async function doSave(s: OpnameDTO) {
    setBusy(true);
    try {
      await saveOpnameCounts(s.id, { items: buildItems(s) });
      toast.success("Hitungan disimpan", `${s.noDokumen} — progres tersimpan`);
      await refetch();
    } catch (e) {
      toast.error("Gagal menyimpan hitungan", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function doPost(s: OpnameDTO) {
    setBusy(true);
    try {
      await saveOpnameCounts(s.id, { items: buildItems(s) }); // persist dulu sebelum posting
      const dto = await postOpname(s.id);
      toast.success("Opname diposting", `${dto.noDokumen} — selisih ditulis sebagai penyesuaian stok`);
      await refetch();
    } catch (e) {
      toast.error("Gagal posting opname", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InvShell
      icon={ClipboardCheck}
      title="Stok Opname"
      description="Hitung fisik stok per lokasi; bandingkan dengan sistem; posting selisih sebagai penyesuaian."
      loaded={loaded}
      actions={<PrimaryButton onClick={() => setAddOpen(true)}>Mulai Opname</PrimaryButton>}
    >
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={FileStack} label="Total Sesi" value={stats.total} tone="cyan" />
        <KpiCard icon={ClipboardList} label="Berjalan" value={stats.counting} tone="amber" />
        <KpiCard icon={AlertTriangle} label="Review" value={stats.review} tone="orange" />
        <KpiCard icon={CheckCircle2} label="Diposting" value={stats.posted} tone="emerald" />
      </div>

      <SectionCard className="min-h-0 flex-1" bodyClassName="flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari no. opname / lokasi…" className="min-w-50 flex-1" />
          <div className="flex flex-wrap gap-1.5">
            {(["all", "Counting", "Review", "Posted"] as const).map((s) => (
              <FilterChip key={s} label={s === "all" ? "Semua" : DOC_STATUS_CFG[s].label} active={status === s} onClick={() => setStatus(s)} />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin text-cyan-500" /><span className="text-[13px]">Memuat sesi opname…</span>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="Tidak ada sesi opname" description="Klik “Mulai Opname” untuk men-snapshot stok lokasi." />
          ) : (
            <div className={tableWrap}>
              <table className={tableCls}>
                <thead><tr>
                  <th className={thCls}>No. Opname</th><th className={thCls}>Lokasi</th>
                  <th className={cn(thCls, "text-center")}>Item</th><th className={cn(thCls, "text-center")}>Status</th><th className={cn(thCls, "text-right")}>Tanggal</th>
                </tr></thead>
                <tbody>
                  {filtered.map((s) => {
                    const cfg = DOC_STATUS_CFG[s.status];
                    return (
                      <tr key={s.id} className={cn(trCls, "cursor-pointer")} onClick={() => openSession(s)}>
                        <td className={cn(tdCls, "font-mono font-semibold text-slate-800")}>{s.noDokumen}</td>
                        <td className={tdCls}>{s.locationNama}</td>
                        <td className={cn(tdCls, "text-center tabular-nums")}>{s.lines.length}</td>
                        <td className={cn(tdCls, "text-center")}><StatusPill label={cfg.label} bg={cfg.bg} text={cfg.text} /></td>
                        <td className={cn(tdCls, "text-right tabular-nums text-slate-400")}>{fmtTgl(s.tanggal)}</td>
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
        subtitle={open ? `${open.locationNama} · ${fmtTgl(open.tanggal)}` : ""}
        width="max-w-2xl"
        footer={open && editable ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-400">{openSelisih > 0 ? `${openSelisih} item selisih` : "Belum ada selisih"}</p>
            <div className="flex gap-2">
              <button
                type="button" disabled={busy} onClick={() => doSave(open)}
                className={cn("inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-semibold transition", busy ? "cursor-not-allowed border-slate-200 text-slate-300" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                <Save size={14} /> Simpan
              </button>
              <button
                type="button" disabled={!openComplete || busy} onClick={() => doPost(open)}
                className={cn("inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", openComplete && !busy ? cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover) : "cursor-not-allowed bg-slate-300")}>
                {busy ? <><Loader2 size={13} className="animate-spin" /> Memproses…</> : <><CheckCircle2 size={15} /> Posting Opname</>}
              </button>
            </div>
          </div>
        ) : undefined}
      >
        {open && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 text-left font-semibold">Barang</th>
                <th className="px-3 py-2 text-right font-semibold">Sistem</th>
                <th className="px-3 py-2 text-right font-semibold">Fisik</th>
                <th className="px-3 py-2 text-right font-semibold">Selisih</th>
              </tr></thead>
              <tbody>
                {open.lines.map((l) => {
                  const raw = counts[l.id];
                  const fisik = editable
                    ? (raw === "" || raw === undefined ? null : Number(raw))
                    : l.qtyFisik;
                  const sel = fisik === null ? null : fisik - l.qtySistem;
                  return (
                    <tr key={l.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-800">{l.nama}</p>
                        <p className="text-[11px] text-slate-400">{l.kode} · {l.satuan}{l.alasan ? ` · ${l.alasan}` : ""}</p>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-500">{l.qtySistem}</td>
                      <td className="px-3 py-2 text-right">
                        {editable ? (
                          <input
                            type="number" min={0}
                            value={raw ?? ""}
                            onChange={(e) => setCounts((prev) => ({ ...prev, [l.id]: e.target.value }))}
                            placeholder="—"
                            className={cn("w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-[13px] font-mono tabular-nums text-slate-800 outline-none transition", INV_ACCENT.focus)}
                          />
                        ) : (
                          <span className="font-mono tabular-nums text-slate-700">{l.qtyFisik ?? "—"}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {sel === null ? <span className="text-slate-300">—</span> : (
                          <span className={cn("font-mono font-bold tabular-nums", sel === 0 ? "text-slate-400" : sel > 0 ? "text-emerald-600" : "text-rose-600")}>
                            {sel > 0 ? `+${sel}` : sel}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {open.status === "Posted" && <p className="px-3 py-3 text-center text-[12px] font-medium text-emerald-600">✓ Diposting — selisih tercatat sebagai penyesuaian (OPNAME) di ledger.</p>}
          </div>
        )}
      </SlideOver>

      <AddOpnameDrawer open={addOpen} onClose={() => setAddOpen(false)} onCreated={(s) => { setAddOpen(false); void refetch(); openSession(s); }} />
    </InvShell>
  );
}

// ── Create drawer (pilih lokasi → snapshot) ─────────────────────────

function AddOpnameDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (s: OpnameDTO) => void }) {
  const [locations, setLocations] = useState<InvLocationDTO[]>([]);
  const [locId, setLocId] = useState("");
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

  async function submit() {
    if (!locId || saving) return;
    setSaving(true);
    try {
      const s = await createOpname({ locationId: locId });
      toast.success("Sesi opname dimulai", `${s.noDokumen} — ${s.lines.length} item di-snapshot`);
      setLocId("");
      onCreated(s);
    } catch (e) {
      toast.error("Gagal memulai opname", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SlideOver
      open={open} onClose={onClose} title="Mulai Stok Opname" subtitle="Snapshot saldo sistem di lokasi terpilih"
      footer={
        <button type="button" disabled={!locId || saving} onClick={submit}
          className={cn("inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", locId && !saving ? cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover) : "cursor-not-allowed bg-slate-300")}>
          {saving && <Loader2 size={13} className="animate-spin" />} {saving ? "Menyiapkan…" : "Mulai Hitung"}
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lokasi *</span>
          <InvSelect value={locId} onChange={setLocId} placeholder="Pilih depo/gudang…" icon={MapPin}
            options={locations.map((l) => ({ value: l.id, label: l.nama, sub: l.tipe === "Gudang" ? "Gudang" : "Depo Farmasi" }))} />
        </div>
        <p className="text-[12px] leading-relaxed text-slate-400">
          Semua item ber-saldo di lokasi akan di-snapshot sebagai kolom <b>Sistem</b>. Masukkan hasil
          hitung fisik, lalu posting — selisih ditulis sebagai penyesuaian (OPNAME) di ledger stok.
        </p>
      </div>
    </SlideOver>
  );
}
