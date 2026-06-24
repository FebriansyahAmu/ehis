"use client";

// Worklist BMHP (Farmasi) — order BMHP masuk dari klinis (IGD/RI/RJ), lintas-kunjungan.
// Depo menekan "Terima & Keluarkan" → status Menunggu→Selesai + stok OUT dari depo (1 langkah,
// tanpa telaah; BMHP = konsumsi langsung). Beda dari Worklist Resep (telaah → dispensing → serah).
// Data: GET /farmasi/bmhp · aksi: POST /farmasi/bmhp/:id/receive. Accent teal (selaras tab Order BMHP).

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Syringe, Search, Loader2, Inbox, PackageCheck, ChevronDown, CheckCircle2, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { listFarmasiBmhp, receiveFarmasiBmhp, type BmhpOrderFarmasiDTO } from "@/lib/api/bmhpOrder/bmhpOrder";
import { bmhpOrderStatusCfg, bmhpOrderBucket, formatRp } from "@/components/shared/medical-records/orderBmhp/bmhpOrderShared";

const PRIORITAS_CFG: Record<string, { label: string; cls: string }> = {
  CITO:   { label: "CITO",   cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
  Segera: { label: "Segera", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  Rutin:  { label: "Rutin",  cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200" },
};

function fmtWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function orderCost(o: BmhpOrderFarmasiDTO): number {
  return o.items.reduce((s, it) => s + (it.harga ?? 0) * it.jumlah, 0);
}

export default function FarmasiBmhpBoard() {
  const [orders, setOrders] = useState<BmhpOrderFarmasiDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const refetch = useCallback(async (signal?: AbortSignal) => {
    try {
      const rows = await listFarmasiBmhp({}, signal);
      if (!signal?.aborted) setOrders(rows);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Gagal memuat worklist BMHP", e instanceof ApiError ? e.message : undefined);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void refetch(ac.signal);
    return () => ac.abort();
  }, [refetch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      o.namaPasien.toLowerCase().includes(q) || o.noRM.toLowerCase().includes(q) ||
      o.noOrder.toLowerCase().includes(q) || o.depoNama.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const belum = filtered.filter((o) => bmhpOrderBucket(o.status) === "belum");
  const selesai = filtered.filter((o) => bmhpOrderBucket(o.status) !== "belum");

  const stats = useMemo(() => ({
    belum: orders.filter((o) => bmhpOrderBucket(o.status) === "belum").length,
    selesai: orders.filter((o) => o.status === "Selesai").length,
    total: orders.length,
  }), [orders]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function doReceive(id: string) {
    setBusyId(id);
    try {
      const dto = await receiveFarmasiBmhp(id);
      toast.success("Order BMHP diterima", `${dto.noOrder} — barang dikeluarkan dari ${dto.depoNama}`);
      await refetch();
    } catch (e) {
      toast.error("Gagal menerima order", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stat strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat icon={<Clock size={16} />} label="Belum Diterima" value={stats.belum} cls="border-amber-200 bg-amber-50 text-amber-700" dot="bg-amber-400" />
        <Stat icon={<CheckCircle2 size={16} />} label="Selesai · Diserahkan" value={stats.selesai} cls="border-emerald-200 bg-emerald-50 text-emerald-700" dot="bg-emerald-500" />
        <Stat icon={<Syringe size={16} />} label="Total Order" value={stats.total} cls="border-teal-200 bg-teal-50 text-teal-700" dot="bg-teal-500" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pasien / No. RM / No. order / depo…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 size={16} className="animate-spin text-teal-500" /><span className="text-[13px]">Memuat worklist BMHP…</span>
        </div>
      ) : filtered.length === 0 ? (
        <Empty />
      ) : (
        <div className="flex flex-col gap-6">
          <Section title="Belum Diterima" count={belum.length} tone="amber">
            {belum.length === 0
              ? <p className="px-1 text-[12px] text-slate-400">Tak ada order menunggu.</p>
              : belum.map((o) => (
                  <BmhpCard key={o.id} order={o} expanded={expanded.has(o.id)} onToggle={() => toggle(o.id)}
                    onReceive={() => doReceive(o.id)} busy={busyId === o.id} />
                ))}
          </Section>

          {selesai.length > 0 && (
            <Section title="Selesai / Riwayat" count={selesai.length} tone="emerald">
              {selesai.map((o) => (
                <BmhpCard key={o.id} order={o} expanded={expanded.has(o.id)} onToggle={() => toggle(o.id)} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-komponen ──────────────────────────────────────────

function Stat({ icon, label, value, cls, dot }: { icon: React.ReactNode; label: string; value: number; cls: string; dot: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", cls)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60">{icon}</span>
      <div>
        <p className="text-xl font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs font-medium opacity-80">{label}</p>
      </div>
      <span className={cn("ml-auto h-2 w-2 rounded-full", dot)} />
    </div>
  );
}

function Section({ title, count, tone, children }: { title: string; count: number; tone: "amber" | "emerald"; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", tone === "amber" ? "bg-amber-400" : "bg-emerald-500")} />
        <h3 className="text-[13px] font-bold text-slate-700">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-500">{count}</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function BmhpCard({
  order, expanded, onToggle, onReceive, busy,
}: {
  order: BmhpOrderFarmasiDTO;
  expanded: boolean;
  onToggle: () => void;
  onReceive?: () => void;
  busy?: boolean;
}) {
  const cfg = bmhpOrderStatusCfg(order.status);
  const prio = PRIORITAS_CFG[order.prioritas] ?? PRIORITAS_CFG.Rutin;
  const cost = orderCost(order);
  return (
    <motion.div
      layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-mono text-[12px] font-bold text-slate-800">{order.noOrder}</p>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", prio.cls)}>{prio.label}</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{order.unit}</span>
          </div>
          <p className="mt-1 truncate text-[13px] font-semibold text-slate-800">{order.namaPasien}</p>
          <p className="text-[11px] text-slate-400">RM {order.noRM} · {fmtWaktu(order.createdAt)}</p>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", cfg.badge)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />{cfg.label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 px-3.5 py-2">
        <button type="button" onClick={onToggle}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 transition hover:text-teal-700">
          {order.items.length} item BMHP
          <ChevronDown size={13} className={cn("text-slate-400 transition-transform", expanded && "rotate-180")} />
        </button>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <User size={12} /><span className="truncate max-w-[10rem]">{order.penulis}</span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }} className="overflow-hidden border-t border-slate-100 bg-slate-50/40"
          >
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-1.5 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-slate-700">{it.nama}</p>
                  <p className="text-[10.5px] text-slate-400">{it.kode}{it.keterangan ? ` · ${it.keterangan}` : ""}</p>
                </div>
                <span className="shrink-0 font-mono text-[12px] tabular-nums text-slate-600">{it.jumlah} {it.satuan}</span>
              </li>
            ))}
            {order.depoNama && <li className="px-3.5 py-1.5 text-[10.5px] text-slate-400">Tujuan: {order.depoNama}</li>}
          </motion.ul>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3.5 py-2.5">
        <span className="text-[11px] text-slate-400">
          Est. <span className="font-semibold tabular-nums text-slate-600">{cost > 0 ? formatRp(cost) : "—"}</span>
        </span>
        {onReceive ? (
          <button type="button" disabled={busy} onClick={onReceive}
            className={cn("inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition",
              busy ? "cursor-not-allowed bg-slate-300" : "bg-teal-600 hover:bg-teal-700")}>
            {busy ? <><Loader2 size={13} className="animate-spin" /> Memproses…</> : <><PackageCheck size={14} /> Terima &amp; Keluarkan</>}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <CheckCircle2 size={13} /> Diserahkan
          </span>
        )}
      </div>
    </motion.div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300"><Inbox size={26} /></span>
      <p className="text-sm font-semibold text-slate-600">Belum ada order BMHP</p>
      <p className="max-w-sm text-xs text-slate-400">Order BMHP dari unit klinis (IGD/RI/RJ) akan muncul di sini untuk diterima &amp; dikeluarkan stoknya.</p>
    </div>
  );
}
