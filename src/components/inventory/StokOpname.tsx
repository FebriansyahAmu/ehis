"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, FileStack, ClipboardList, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import {
  InvShell, KpiCard, SectionCard, StatusPill, SearchInput, FilterChip,
  EmptyState, SlideOver, useSkeletonDelay, INV_ACCENT,
  tableWrap, tableCls, thCls, tdCls, trCls,
} from "./inventoryShared";
import {
  INV_OPNAME, type OpnameSession, type OpnameStatus,
  DOC_STATUS_CFG, locById, itemById,
} from "@/lib/inventory/inventoryMock";

export default function StokOpname() {
  const loaded = useSkeletonDelay();
  const [list, setList] = useState<OpnameSession[]>(INV_OPNAME);
  const [status, setStatus] = useState<OpnameStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((s) => status === "all" || s.status === status)
      .filter((s) => !q || s.noDokumen.toLowerCase().includes(q) || (locById(s.locationId)?.nama.toLowerCase().includes(q) ?? false))
      .sort((a, z) => z.tanggal.localeCompare(a.tanggal) || z.noDokumen.localeCompare(a.noDokumen));
  }, [list, status, search]);

  const stats = useMemo(() => ({
    total: list.length,
    counting: list.filter((s) => s.status === "Counting" || s.status === "Draft").length,
    review: list.filter((s) => s.status === "Review").length,
    posted: list.filter((s) => s.status === "Posted").length,
  }), [list]);

  function setFisik(sessionId: string, itemId: string, val: number | null) {
    setList((prev) => prev.map((s) => s.id === sessionId
      ? { ...s, lines: s.lines.map((l) => l.itemId === itemId ? { ...l, qtyFisik: val } : l) }
      : s));
  }

  function posting(sessionId: string) {
    setList((prev) => prev.map((s) => s.id === sessionId ? { ...s, status: "Posted" } : s));
    toast.success("Opname diposting", "Selisih ditulis sebagai penyesuaian (ADJUST) stok");
    setOpenId(null);
  }

  const open = openId ? list.find((s) => s.id === openId) ?? null : null;
  const openSelisih = open ? open.lines.reduce((n, l) => n + (l.qtyFisik !== null && l.qtyFisik !== l.qtySistem ? 1 : 0), 0) : 0;
  const openComplete = open ? open.lines.length > 0 && open.lines.every((l) => l.qtyFisik !== null) : false;

  return (
    <InvShell
      icon={ClipboardCheck}
      title="Stok Opname"
      description="Hitung fisik stok per lokasi; bandingkan dengan sistem; posting selisih sebagai penyesuaian."
      loaded={loaded}
    >
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={FileStack} label="Total Sesi" value={stats.total} tone="cyan" />
        <KpiCard icon={ClipboardList} label="Berjalan" value={stats.counting} tone="amber" />
        <KpiCard icon={AlertTriangle} label="Review" value={stats.review} tone="orange" />
        <KpiCard icon={CheckCircle2} label="Diposting" value={stats.posted} tone="emerald" />
      </div>

      <SectionCard className="min-h-0 flex-1" bodyClassName="flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari no. opname / lokasi…" className="min-w-[200px] flex-1" />
          <div className="flex flex-wrap gap-1.5">
            {(["all", "Draft", "Counting", "Review", "Posted"] as const).map((s) => (
              <FilterChip key={s} label={s === "all" ? "Semua" : DOC_STATUS_CFG[s].label} active={status === s} onClick={() => setStatus(s)} />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="Tidak ada sesi opname" />
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
                      <tr key={s.id} className={cn(trCls, "cursor-pointer")} onClick={() => setOpenId(s.id)}>
                        <td className={cn(tdCls, "font-mono font-semibold text-slate-800")}>{s.noDokumen}</td>
                        <td className={tdCls}>{locById(s.locationId)?.nama}</td>
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
        subtitle={open ? `${locById(open.locationId)?.nama} · ${fmtTgl(open.tanggal)}` : ""}
        width="max-w-2xl"
        footer={open && open.status !== "Posted" ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-400">{openSelisih > 0 ? `${openSelisih} item selisih` : "Belum ada selisih"}</p>
            <button
              type="button"
              disabled={!openComplete}
              onClick={() => posting(open.id)}
              className={cn("inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", openComplete ? cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover) : "cursor-not-allowed bg-slate-300")}
            >
              <CheckCircle2 size={15} /> Posting Opname
            </button>
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
                  const it = itemById(l.itemId);
                  const sel = l.qtyFisik === null ? null : l.qtyFisik - l.qtySistem;
                  const editable = open.status !== "Posted";
                  return (
                    <tr key={l.itemId} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-800">{it?.nama}</p>
                        <p className="text-[11px] text-slate-400">{it?.kode}{l.alasan ? ` · ${l.alasan}` : ""}</p>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-500">{l.qtySistem}</td>
                      <td className="px-3 py-2 text-right">
                        {editable ? (
                          <input
                            type="number" min={0}
                            value={l.qtyFisik ?? ""}
                            onChange={(e) => setFisik(open.id, l.itemId, e.target.value === "" ? null : Number(e.target.value))}
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
                {open.lines.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-[12px] text-slate-400">Sesi kosong — tambahkan item untuk dihitung.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SlideOver>
    </InvShell>
  );
}

function fmtTgl(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
