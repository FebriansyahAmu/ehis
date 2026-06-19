"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ClipboardCheck, FileStack, ClipboardList, CheckCircle2, AlertTriangle, Loader2, MapPin, Save, Equal, X, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import {
  InvShell, KpiCard, SectionCard, StatusPill, SearchInput, FilterChip, PrimaryButton,
  EmptyState, SlideOver, Modal, InvSelect, useSkeletonDelay, INV_ACCENT,
  tableWrap, tableCls, thCls, tdCls, trCls,
} from "./inventoryShared";
import { DOC_STATUS_CFG } from "@/lib/inventory/inventoryMock";
import { ApiError } from "@/lib/api/client";
import {
  listOpname, createOpname, saveOpnameCounts, postOpname, type OpnameDTO,
} from "@/lib/api/inventory/opname";
import { listInvLocations, type InvLocationDTO } from "@/lib/api/inventory/stock";
import OpnameCetakModal from "./OpnameCetakModal";

type OpnameStatus = OpnameDTO["status"];

function fmtTgl(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
const parse = (raw: string | undefined): number | null => (raw === "" || raw === undefined ? null : Number(raw));

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
  const [confirmClose, setConfirmClose] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(8);
  const [cetak, setCetak] = useState<OpnameDTO | null>(null);

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
  const editable = open ? open.status !== "Posted" : false;

  // Inisialisasi input hitungan saat membuka sesi (per id, agar edit tak ter-reset oleh refetch).
  function openSession(s: OpnameDTO) {
    setCounts(Object.fromEntries(s.lines.map((l) => [l.id, l.qtyFisik === null ? "" : String(l.qtyFisik)])));
    setPage(0);
    setOpenId(s.id);
  }

  // Ringkasan interaktif sesi terbuka.
  const summary = useMemo(() => {
    if (!open) return { total: 0, counted: 0, selisih: 0, netUp: 0, netDown: 0 };
    let counted = 0, selisih = 0, netUp = 0, netDown = 0;
    for (const l of open.lines) {
      const cur = editable ? parse(counts[l.id]) : l.qtyFisik;
      if (cur === null) continue;
      counted++;
      const d = cur - l.qtySistem;
      if (d > 0) { selisih++; netUp += d; } else if (d < 0) { selisih++; netDown += -d; }
    }
    return { total: open.lines.length, counted, selisih, netUp, netDown };
  }, [open, counts, editable]);

  const openComplete = summary.total > 0 && summary.counted === summary.total;
  const dirty = useMemo(() => {
    if (!open || !editable) return false;
    return open.lines.some((l) => parse(counts[l.id]) !== (l.qtyFisik ?? null));
  }, [open, editable, counts]);

  function buildItems(s: OpnameDTO) {
    return s.lines.map((l) => ({ itemRowId: l.id, qtyFisik: parse(counts[l.id]), alasan: l.alasan }));
  }

  /** Persist hitungan; kembalikan sukses. */
  async function persist(s: OpnameDTO): Promise<boolean> {
    setBusy(true);
    try {
      await saveOpnameCounts(s.id, { items: buildItems(s) });
      await refetch();
      return true;
    } catch (e) {
      toast.error("Gagal menyimpan hitungan", e instanceof ApiError ? e.message : undefined);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function doSave(s: OpnameDTO) {
    if (await persist(s)) toast.success("Hitungan disimpan", `${s.noDokumen} — progres tersimpan`);
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

  // Penutupan modal: read-only → langsung; editable + dirty → konfirmasi simpan; else langsung.
  function requestClose() {
    if (!open) return;
    if (editable && dirty) { setConfirmClose(true); return; }
    setOpenId(null);
  }
  async function confirmSaveAndClose() {
    if (!open) return;
    if (await persist(open)) {
      toast.success("Hitungan disimpan", `${open.noDokumen} — progres tersimpan`);
      setConfirmClose(false);
      setOpenId(null);
    }
  }
  function confirmDiscardAndClose() {
    setConfirmClose(false);
    setOpenId(null);
  }

  // Paginasi baris item (state input tetap aman karena di-key per line id, bukan per halaman).
  const totalLines = open?.lines.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalLines / pageSize));
  const curPage = Math.min(page, totalPages - 1);
  const pagedLines = open ? open.lines.slice(curPage * pageSize, curPage * pageSize + pageSize) : [];
  const rangeFrom = totalLines === 0 ? 0 : curPage * pageSize + 1;
  const rangeTo = Math.min(totalLines, curPage * pageSize + pageSize);

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

      {/* Pengisian SO — modal interaktif (tak bisa ditutup kecuali tombol Batal saat sedang mengisi) */}
      <Modal
        open={!!open}
        onClose={() => setOpenId(null)}
        dismissible={!editable}
        icon={ClipboardCheck}
        title={open?.noDokumen ?? ""}
        subtitle={open ? `${open.locationNama} · ${fmtTgl(open.tanggal)}` : ""}
        width="max-w-5xl"
        footer={open && (editable ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-400">{summary.counted}/{summary.total} terhitung · {summary.selisih} selisih{dirty ? " · belum disimpan" : ""}</p>
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={requestClose}
                className={cn("inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-semibold transition", busy ? "cursor-not-allowed border-slate-200 text-slate-300" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                <X size={14} /> Batal
              </button>
              <button type="button" disabled={busy || !dirty} onClick={() => doSave(open)}
                className={cn("inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-semibold transition", busy || !dirty ? "cursor-not-allowed border-slate-200 text-slate-300" : cn("border-cyan-200 bg-cyan-50", INV_ACCENT.text, "hover:bg-cyan-100"))}>
                <Save size={14} /> Simpan
              </button>
              <button type="button" disabled={!openComplete || busy} onClick={() => doPost(open)}
                className={cn("inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", openComplete && !busy ? cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover) : "cursor-not-allowed bg-slate-300")}>
                {busy ? <><Loader2 size={13} className="animate-spin" /> Memproses…</> : <><CheckCircle2 size={15} /> Posting Opname</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-600"><CheckCircle2 size={14} /> Diposting — selisih tercatat di ledger</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCetak(open)}
                className={cn("inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover)}>
                <Printer size={14} /> Cetak SO
              </button>
              <button type="button" onClick={() => setOpenId(null)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50">Tutup</button>
            </div>
          </div>
        ))}
      >
        {open && (
          <div className="flex flex-col gap-4">
            {/* Ringkasan interaktif */}
            <div className="grid grid-cols-3 gap-2.5">
              <SummaryStat label="Terhitung" value={`${summary.counted}/${summary.total}`} pct={summary.total ? Math.round((summary.counted / summary.total) * 100) : 0} />
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Item Selisih</p>
                <p className={cn("mt-0.5 text-lg font-bold tabular-nums", summary.selisih > 0 ? "text-amber-600" : "text-slate-700")}>{summary.selisih}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Penyesuaian Net</p>
                <p className="mt-0.5 flex items-baseline gap-1.5 text-[13px] font-bold tabular-nums">
                  <span className="text-emerald-600">+{summary.netUp}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-rose-600">−{summary.netDown}</span>
                </p>
              </div>
            </div>

            {editable && (
              <p className="rounded-lg bg-cyan-50/70 px-3 py-2 text-[11px] leading-relaxed text-cyan-700 ring-1 ring-cyan-100">
                Masukkan hasil hitung fisik tiap item. Tombol <Equal size={11} className="-mt-0.5 inline" /> menyalin angka <b>Sistem</b> (tanpa selisih) untuk mempercepat. Posting aktif setelah semua item terhitung.
              </p>
            )}

            {/* Tabel hitung */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 text-left font-semibold">Barang</th>
                  <th className="px-3 py-2 text-right font-semibold">Sistem</th>
                  <th className="px-3 py-2 text-right font-semibold">Fisik</th>
                  <th className="px-3 py-2 text-right font-semibold">Selisih</th>
                </tr></thead>
                <tbody>
                  {pagedLines.map((l) => {
                    const cur = editable ? parse(counts[l.id]) : l.qtyFisik;
                    const sel = cur === null ? null : cur - l.qtySistem;
                    return (
                      <tr key={l.id} className={cn("border-b border-slate-50 transition last:border-0", editable && parse(counts[l.id]) !== null && "bg-cyan-50/30")}>
                        <td className="px-3 py-2">
                          <p className="font-semibold text-slate-800">{l.nama}</p>
                          <p className="text-[11px] text-slate-400">{l.kode} · {l.satuan}{l.alasan ? ` · ${l.alasan}` : ""}</p>
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-500">{l.qtySistem}</td>
                        <td className="px-3 py-2">
                          {editable ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" title="Samakan dengan sistem (tanpa selisih)" onClick={() => setCounts((p) => ({ ...p, [l.id]: String(l.qtySistem) }))}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-cyan-50 hover:text-cyan-600" aria-label="Samakan dengan sistem">
                                <Equal size={13} />
                              </button>
                              <input
                                type="number" min={0} inputMode="numeric"
                                value={counts[l.id] ?? ""}
                                onChange={(e) => setCounts((p) => ({ ...p, [l.id]: e.target.value }))}
                                placeholder="—" aria-label={`Hitung fisik ${l.nama}`}
                                className={cn("w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-[13px] font-mono tabular-nums text-slate-800 outline-none transition", INV_ACCENT.focus)}
                              />
                            </div>
                          ) : (
                            <p className="text-right font-mono tabular-nums text-slate-700">{l.qtyFisik ?? "—"}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {sel === null ? <span className="text-slate-300">—</span> : (
                            <span className={cn("inline-block min-w-[2.5rem] rounded-md px-1.5 py-0.5 text-center font-mono text-[12px] font-bold tabular-nums",
                              sel === 0 ? "bg-slate-100 text-slate-400" : sel > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                              {sel > 0 ? `+${sel}` : sel}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalLines > 8 && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Menampilkan <span className="font-semibold text-slate-600 tabular-nums">{rangeFrom}–{rangeTo}</span> dari <span className="font-semibold text-slate-600 tabular-nums">{totalLines}</span></span>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                      className={cn("rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-medium text-slate-600 outline-none transition", INV_ACCENT.focus)}
                      aria-label="Item per halaman"
                    >
                      {[8, 15, 30].map((n) => <option key={n} value={n}>{n}/hal</option>)}
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
            </div>
          </div>
        )}
      </Modal>

      <SaveConfirmDialog
        open={confirmClose}
        busy={busy}
        onSave={confirmSaveAndClose}
        onDiscard={confirmDiscardAndClose}
        onKeep={() => setConfirmClose(false)}
      />

      <AddOpnameDrawer open={addOpen} onClose={() => setAddOpen(false)} onCreated={(s) => { setAddOpen(false); void refetch(); openSession(s); }} />

      <OpnameCetakModal open={!!cetak} data={cetak} onClose={() => setCetak(null)} />
    </InvShell>
  );
}

function SummaryStat({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-800">{value}</p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Save-confirm dialog (saat Batal dengan perubahan belum disimpan) ───────────

function SaveConfirmDialog({ open, busy, onSave, onDiscard, onKeep }: {
  open: boolean; busy: boolean; onSave: () => void; onDiscard: () => void; onKeep: () => void;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- guard mount portal aman-SSR
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.92, y: 16 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 8 } };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            onClick={() => !busy && onKeep()} />
          <motion.div role="dialog" aria-modal="true" aria-label="Simpan perubahan opname"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} {...card}>
            <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-amber-200">
                <AlertTriangle size={17} className="text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-700">Simpan perubahan?</p>
                <p className="text-[11px] text-amber-500">Ada hitungan yang belum disimpan</p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[12px] leading-relaxed text-slate-500">
                Hitungan fisik yang Anda masukkan belum tersimpan. Simpan dulu sebelum menutup, atau tutup tanpa menyimpan?
              </p>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4">
              <button type="button" onClick={onSave} disabled={busy}
                className={cn("inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-white shadow-sm transition active:scale-95", busy ? "cursor-not-allowed bg-slate-300" : cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover))}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {busy ? "Menyimpan…" : "Simpan & Tutup"}
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={onKeep} disabled={busy}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50">
                  Kembali
                </button>
                <button type="button" onClick={onDiscard} disabled={busy}
                  className="flex-1 rounded-xl border border-rose-200 bg-white py-2.5 text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95 disabled:opacity-50">
                  Tutup Tanpa Simpan
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
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
