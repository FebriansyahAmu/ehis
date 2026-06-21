"use client";

// Register Narkotika & Psikotropika — lapisan KEPATUHAN/LAPORAN (read-only).
// Katalog = master.Obat (golongan N/P) · saldo+mutasi = inventory ledger (getInvItemDetail).
// BUKAN tempat input stok / opname / pengeluaran — itu di modul Master & Inventory & Resep.

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, ShieldAlert, Package, TrendingDown, FileText,
  Printer, AlertTriangle, Check, Loader2, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type NarPsiKategori,
  narPsiKategoriOf, mutasiCfg, KATEGORI_ACCENT,
  getMonthLabel, getAvailableMonths,
} from "./narPsiShared";
import { fetchAllObat } from "@/lib/api/master/obat";
import { getInvItemDetail } from "@/lib/api/inventory/stock";
import type { ObatRecord } from "@/lib/master/obatMock";
import { GOLONGAN_CFG } from "@/lib/master/obatMock";
import type { InvItemMovementDTO } from "@/lib/schemas/inventory/stock";

// ── Derived drug (master katalog + saldo/mutasi inventory) ─────────────────────

interface NpDrug {
  obat:         ObatRecord;
  kategori:     NarPsiKategori;
  saldo:        number;               // Σ balances.qty (lintas lokasi farmasi)
  min:          number;               // Σ balances.min (reorder agregat)
  hasInventory: boolean;
  movements:    InvItemMovementDTO[];
}

const namaObat = (o: ObatRecord) => o.namaGenerik || o.namaDagang || o.kode;

function signedQty(jenis: string, qty: number): { text: string; cls: string } {
  const arah = mutasiCfg(jenis).arah;
  if (arah === "in")  return { text: `+${qty}`, cls: "text-emerald-600" };
  if (arah === "out") return { text: `-${qty}`, cls: "text-rose-600" };
  return { text: qty > 0 ? `+${qty}` : `${qty}`, cls: qty < 0 ? "text-rose-600" : "text-slate-600" };
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, cls }: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string; cls: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", cls)}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-bold tabular-nums leading-none">{value}</p>
        <p className="mt-0.5 text-xs font-medium opacity-80">{label}</p>
        {sub && <p className="text-[10px] opacity-60">{sub}</p>}
      </div>
    </div>
  );
}

function GolonganBadge({ golongan }: { golongan?: string }) {
  const cfg = golongan ? GOLONGAN_CFG[golongan as keyof typeof GOLONGAN_CFG] : undefined;
  if (!cfg) return null;
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold", cfg.bg, cfg.text)}>{cfg.short}</span>
  );
}

// ── Saldo card (per obat) ──────────────────────────────────────────────────────

function SaldoCard({ d, onClick }: { d: NpDrug; onClick: () => void }) {
  const low = d.hasInventory && d.saldo <= d.min;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col rounded-xl border p-3 text-left transition hover:shadow-sm",
        low ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold leading-tight text-slate-700">{namaObat(d.obat)}</p>
        {low && <AlertTriangle size={12} className="shrink-0 text-rose-500" />}
      </div>
      <div className="mt-0.5 flex items-center gap-1.5">
        <GolonganBadge golongan={d.obat.golongan} />
        <p className="text-[10px] text-slate-400">{d.obat.kekuatan}</p>
      </div>
      {d.hasInventory ? (
        <>
          <p className={cn("mt-1 text-2xl font-bold tabular-nums leading-none", low ? "text-rose-600" : "text-slate-900")}>
            {d.saldo}
          </p>
          <p className="text-[10px] text-slate-400">{d.obat.satuanTerkecil ?? "unit"} · min {d.min}</p>
        </>
      ) : (
        <p className="mt-2 text-[11px] italic text-slate-400">Belum ada stok di Inventory</p>
      )}
    </button>
  );
}

// ── Mutasi row (read-only ledger) ──────────────────────────────────────────────

function MutasiRow({ m, index }: { m: InvItemMovementDTO; index: number }) {
  const cfg = mutasiCfg(m.jenis);
  const q   = signedQty(m.jenis, m.qty);
  const dt  = new Date(m.waktu);
  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        "grid grid-cols-[6rem_5.5rem_1fr_4.5rem] items-center gap-x-3 px-3 py-2 text-xs",
        index % 2 === 0 ? "bg-white" : "bg-slate-50/60",
      )}
    >
      <span className="text-slate-500">
        {dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
        <span className="ml-1 text-slate-400">{dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
      </span>
      <span><span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", cfg.badge)}>{cfg.label}</span></span>
      <span className="truncate font-mono text-[11px] text-slate-400">{m.refNo ?? "—"}</span>
      <span className={cn("text-right font-bold tabular-nums", q.cls)}>{q.text}</span>
    </motion.div>
  );
}

// ── Kategori content ───────────────────────────────────────────────────────────

function KategoriPane({ drugs, bulan }: { drugs: NpDrug[]; bulan: string }) {
  const [selectedId, setSelectedId] = useState<string>("Semua");
  const [printDone, setPrintDone]   = useState(false);

  // Mutasi terfilter bulan (per obat)
  const monthMovements = (d: NpDrug) => d.movements.filter((m) => m.waktu.slice(0, 7) === bulan);

  const stats = useMemo(() => {
    let mutasi = 0, keluar = 0, rendah = 0;
    for (const d of drugs) {
      const mm = monthMovements(d);
      mutasi += mm.length;
      keluar += mm.filter((m) => m.jenis === "OUT").reduce((s, m) => s + m.qty, 0);
      if (d.hasInventory && d.saldo <= d.min) rendah += 1;
    }
    return { terdaftar: drugs.length, mutasi, keluar, rendah };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drugs, bulan]);

  const selected = selectedId === "Semua" ? null : drugs.find((d) => d.obat.id === selectedId) ?? null;
  const selMoves = selected ? monthMovements(selected) : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Package size={16} className="text-slate-500" />} label="Obat Terdaftar" value={stats.terdaftar} cls="border-slate-200 bg-white text-slate-700 border" />
        <StatCard icon={<FileText size={16} className="text-sky-500" />} label="Mutasi Bulan Ini" value={stats.mutasi} sub={getMonthLabel(bulan)} cls="border-sky-200 bg-sky-50 text-sky-700 border" />
        <StatCard icon={<TrendingDown size={16} className="text-rose-500" />} label="Total Keluar" value={stats.keluar} sub="dari ledger Inventory" cls="border-rose-200 bg-rose-50 text-rose-700 border" />
        <StatCard icon={<AlertTriangle size={16} className="text-amber-500" />} label="Stok Rendah" value={stats.rendah} sub="≤ reorder point" cls="border-amber-200 bg-amber-50 text-amber-700 border" />
      </div>

      {/* Toolbar (read-only: hanya cetak) */}
      <div className="flex items-center">
        <button
          onClick={() => { setPrintDone(true); setTimeout(() => setPrintDone(false), 2000); window.print(); }}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition",
            printDone ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50",
          )}
        >
          {printDone ? <Check size={12} /> : <Printer size={12} />}
          Cetak Laporan Bulanan
        </button>
      </div>

      {/* Drug filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedId("Semua")}
          className={cn(
            "rounded-lg border px-3 py-1 text-xs font-semibold transition",
            selectedId === "Semua" ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-50",
          )}
        >
          Semua ({drugs.length})
        </button>
        {drugs.map((d) => {
          const low = d.hasInventory && d.saldo <= d.min;
          return (
            <button
              key={d.obat.id}
              onClick={() => setSelectedId(d.obat.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition",
                selectedId === d.obat.id ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50",
              )}
            >
              {namaObat(d.obat)}
              {d.hasInventory && <span className="rounded-full bg-white/30 px-1 text-[9px] tabular-nums">{d.saldo}</span>}
              {low && <AlertTriangle size={9} className="text-rose-400" />}
            </button>
          );
        })}
      </div>

      {/* Content: Semua = saldo overview · obat terpilih = kartu register mutasi */}
      {!selected ? (
        drugs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
            Tidak ada obat golongan ini di Katalog Obat (Master).
          </div>
        ) : (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Saldo Saat Ini per Obat</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {drugs.map((d) => <SaldoCard key={d.obat.id} d={d} onClick={() => setSelectedId(d.obat.id)} />)}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">Pilih obat untuk melihat kartu register (riwayat mutasi).</p>
          </div>
        )
      ) : (
        <div>
          {/* Drug header */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">{namaObat(selected.obat)}</h3>
            <GolonganBadge golongan={selected.obat.golongan} />
            <span className="text-[11px] text-slate-400">{selected.obat.kekuatan}</span>
            <span className="ml-auto rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
              Saldo: <span className="font-bold tabular-nums text-slate-800">{selected.hasInventory ? selected.saldo : "—"}</span>
              <span className="text-slate-400"> {selected.obat.satuanTerkecil ?? ""}</span>
            </span>
          </div>

          {/* Mutasi ledger */}
          <div className="mb-1 grid grid-cols-[6rem_5.5rem_1fr_4.5rem] gap-x-3 rounded-t-lg border border-b-0 border-slate-200 bg-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <span>Waktu</span><span>Jenis</span><span>Ref. Dok.</span><span className="text-right">Qty</span>
          </div>
          <div className="overflow-hidden rounded-b-lg border border-slate-200">
            {selMoves.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Tidak ada mutasi pada {getMonthLabel(bulan)}</p>
            ) : (
              selMoves.map((m, i) => <MutasiRow key={m.id} m={m} index={i} />)
            )}
          </div>

          {/* Catatan identitas dispensing (menyusul) */}
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Info size={12} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-[11px] leading-snug text-slate-500">
              Identitas legal pengeluaran ke pasien (nama pasien · dokter · no. resep · pengambil) akan tampil otomatis
              di baris <span className="font-semibold">Keluar</span> setelah integrasi dispensing Resep → stok Inventory aktif.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function RegisterNarPsiPane() {
  const [drugs, setDrugs]       = useState<NpDrug[] | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [activeKat, setActiveKat] = useState<NarPsiKategori>("Narkotika");
  const months                  = getAvailableMonths();
  const [bulan, setBulan]       = useState(months[0]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const obatAll = await fetchAllObat(ac.signal);
        const np = obatAll
          .map((o) => ({ o, kat: narPsiKategoriOf(o.golongan) }))
          .filter((x): x is { o: ObatRecord; kat: NarPsiKategori } => x.kat !== null);

        const results = await Promise.allSettled(
          np.map((x) => getInvItemDetail("Obat", x.o.id, ac.signal)),
        );

        const built: NpDrug[] = np.map((x, i) => {
          const r = results[i];
          const detail = r.status === "fulfilled" ? r.value : null;
          const balances = detail?.balances ?? [];
          return {
            obat:         x.o,
            kategori:     x.kat,
            saldo:        balances.reduce((s, b) => s + b.qty, 0),
            min:          balances.reduce((s, b) => s + b.min, 0),
            hasInventory: balances.length > 0,
            movements:    detail?.movements ?? [],
          };
        });
        if (!ac.signal.aborted) setDrugs(built);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (!ac.signal.aborted) { setError("Gagal memuat data Register N/P"); setDrugs([]); }
      }
    })();
    return () => ac.abort();
  }, []);

  const drugsInKat = useMemo(
    () => (drugs ?? []).filter((d) => d.kategori === activeKat).sort((a, b) => namaObat(a.obat).localeCompare(namaObat(b.obat))),
    [drugs, activeKat],
  );
  const countKat = (k: NarPsiKategori) => (drugs ?? []).filter((d) => d.kategori === k).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100">
          <ShieldAlert size={18} className="text-rose-600" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Register Narkotika &amp; Psikotropika</h2>
          <p className="text-[11px] text-slate-400">UU 35/2009 · UU 5/1997 · PMK 3/2015 · Laporan SIPNAP (Dinkes/BPOM)</p>
        </div>
        <div className="ml-auto">
          <select
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            {months.map((m) => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
          </select>
        </div>
      </div>

      {/* Banner sumber data — register = lapisan kepatuhan/laporan, BUKAN input stok */}
      <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-sky-600" aria-hidden />
        <p className="text-[11.5px] leading-relaxed text-sky-800">
          <span className="font-bold">Laporan kepatuhan (read-only).</span> Katalog N/P dari <span className="font-semibold">Master · Katalog Obat</span> (golongan),
          saldo &amp; mutasi dari <span className="font-semibold">ledger Inventory</span>. Penerimaan, transfer, &amp; stok opname dilakukan di
          modul <span className="font-semibold">Inventory</span>; pengeluaran ke pasien mengalir dari <span className="font-semibold">Resep</span>.
          Laporan SIPNAP wajib ke Dinkes Kab/Kota paling lambat tanggal 10 bulan berikutnya.
        </p>
      </div>

      {/* Kategori tabs */}
      <div className="flex gap-2">
        {(["Narkotika", "Psikotropika"] as NarPsiKategori[]).map((k) => (
          <button
            key={k}
            onClick={() => setActiveKat(k)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold transition-all",
              activeKat === k ? KATEGORI_ACCENT[k].tab : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
            )}
          >
            <FlaskConical size={12} aria-hidden />
            {k}
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", activeKat === k ? "bg-white/25" : "bg-slate-100 text-slate-500")}>
              {countKat(k)}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {drugs === null ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 size={16} className="animate-spin text-sky-500" /><span className="text-sm">Memuat register…</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${activeKat}-${bulan}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <KategoriPane drugs={drugsInKat} bulan={bulan} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
