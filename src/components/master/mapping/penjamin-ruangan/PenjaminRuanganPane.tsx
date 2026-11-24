"use client";

// Mapping Hub → Penjamin × Ruangan. Menghubungkan kode ruangan/SMF penjamin (mis. BPJS V-Claim
// "INT", "IGD") dengan ruangan RS untuk routing klaim & kamar.
//
// Pola (pengganti tabel + <select> bawaan): navigasi penjamin di kiri → papan kode per kategori di
// kanan; tiap kode menampilkan ruangan terhubung sebagai chip (status toggle + lepas) dan tombol
// "+ Ruangan" (combobox bisa dicari). Tidak ada pilihan default — menambah = memilih ruangan.
// Lepas ruangan → bar "Urungkan" (bertahan sampai ditutup / ada pelepasan lain; menambah ruangan
// yang sama lewat "+ Ruangan" tetap bisa — Urungkan hanya pintasan).
// Data masih lokal (mock penjaminStore + RUANGAN_MOCK) — backend Penjamin × Ruangan belum ada.

import { useMemo, useState } from "react";
import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import {
  AlertCircle, ArrowUpRight, Building, CheckCircle2, Link2, Network, RotateCcw, Search, X,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import {
  MAPPING_INITIAL, PENJAMIN_INITIAL, type MappingRuanganRecord, type PenjaminRecord,
} from "@/lib/master/penjaminStore";
import { TIPE_CFG } from "@/components/master/penjamin/penjaminShared";
import { KodeRuanganCard } from "./KodeRuanganCard";
import { PenjaminNav } from "./PenjaminNav";
import { LOC_BY_ID, coverageOf, groupByKategori, pct } from "./prShared";

type StatusFilter = "all" | "Aktif" | "Non_Aktif" | "kosong";
const STATUS_OPTS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "Aktif", label: "Aktif" },
  { id: "Non_Aktif", label: "Nonaktif" },
  { id: "kosong", label: "Belum dipetakan" },
];

const norm = (s: string) => s.toLowerCase().trim();

export default function PenjaminRuanganPane() {
  const penjaminList = useMemo(() => structuredClone(PENJAMIN_INITIAL) as PenjaminRecord[], []);
  const [mappings, setMappings] = useState<MappingRuanganRecord[]>(() => structuredClone(MAPPING_INITIAL));
  const [selected, setSelected] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [undo, setUndo] = useState<{ m: MappingRuanganRecord; index: number; label: string } | null>(null);
  const [announce, setAnnounce] = useState("");

  const kodeById = useMemo(() => {
    const map = new Map<string, { kode: string; nama: string }>();
    for (const p of penjaminList) for (const k of p.kelas) map.set(k.id, k);
    return map;
  }, [penjaminList]);
  const labelOf = (m: MappingRuanganRecord) =>
    `${LOC_BY_ID.get(m.ruanganId)?.name ?? "Ruangan"} ↔ ${kodeById.get(m.penjaminKelasId)?.kode ?? "kode"}`;

  // ── Aksi ──
  const add = (penjaminId: string, kelasId: string, ruanganId: string) => {
    if (mappings.some((m) => m.penjaminKelasId === kelasId && m.ruanganId === ruanganId)) return;
    const m: MappingRuanganRecord = { id: `map-${Date.now()}`, penjaminId, penjaminKelasId: kelasId, ruanganId, status: "Aktif" };
    setMappings((prev) => [...prev, m]);
    setAnnounce(`${labelOf(m)} terhubung.`);
  };
  const toggle = (m: MappingRuanganRecord) => {
    const next = m.status === "Aktif" ? "Non_Aktif" : "Aktif";
    setMappings((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: next } : x)));
    setAnnounce(`${labelOf(m)} ${next === "Aktif" ? "diaktifkan" : "dinonaktifkan"}.`);
  };
  const remove = (m: MappingRuanganRecord) => {
    const index = mappings.findIndex((x) => x.id === m.id);
    setMappings((prev) => prev.filter((x) => x.id !== m.id));
    setUndo({ m, index, label: labelOf(m) });
    setAnnounce(`${labelOf(m)} dilepas. Urungkan tersedia.`);
  };
  const undoRemove = () => {
    if (!undo) return;
    setMappings((prev) => {
      const next = [...prev];
      next.splice(Math.min(undo.index, next.length), 0, undo.m);
      return next;
    });
    setAnnounce(`${undo.label} dikembalikan.`);
    setUndo(null);
  };

  // ── Ringkasan ──
  const stats = useMemo(() => {
    const totalKode = penjaminList.reduce((n, p) => n + p.kelas.length, 0);
    const mapped = penjaminList.reduce((n, p) => n + coverageOf(p, mappings).mapped, 0);
    return {
      aktif: mappings.filter((m) => m.status === "Aktif").length,
      total: mappings.length,
      kosong: totalKode - mapped,
      ruangan: new Set(mappings.filter((m) => m.status === "Aktif").map((m) => m.ruanganId)).size,
      cakupan: pct(mapped, totalKode),
    };
  }, [mappings, penjaminList]);

  // ── Data tampilan: penjamin → kategori → kode (+ mapping tersaring) ──
  const view = useMemo(() => {
    const q = norm(query);
    const scope = selected === "all" ? penjaminList : penjaminList.filter((p) => p.id === selected);
    return scope.map((p) => {
      const pMatch = !q || norm(`${p.nama} ${p.kode}`).includes(q);
      const groups = groupByKategori(p.kelas).map((g) => ({
        kategori: g.kategori,
        items: g.items.flatMap((k) => {
          const all = mappings.filter((m) => m.penjaminKelasId === k.id);
          const adaAktif = all.some((m) => m.status === "Aktif");
          if (status === "kosong" && adaAktif) return [];
          const shown = status === "Aktif" || status === "Non_Aktif" ? all.filter((m) => m.status === status) : all;
          if ((status === "Aktif" || status === "Non_Aktif") && shown.length === 0) return [];
          if (q) {
            const kMatch = norm(`${k.kode} ${k.nama} ${k.deskripsi ?? ""}`).includes(q);
            const rMatch = all.some((m) => {
              const l = LOC_BY_ID.get(m.ruanganId);
              return !!l && norm(`${l.name} ${l.kode}`).includes(q);
            });
            if (!pMatch && !kMatch && !rMatch) return [];
          }
          return [{ kelas: k, mappings: shown }];
        }),
      })).filter((g) => g.items.length > 0);
      return { p, groups, count: groups.reduce((n, g) => n + g.items.length, 0) };
    }).filter((s) => s.count > 0 || (selected !== "all" && !q && status === "all"));
  }, [penjaminList, mappings, selected, status, query]);

  const shownCount = view.reduce((n, s) => n + s.count, 0);
  const filterAktif = !!query || status !== "all";

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-full min-h-0 flex-col gap-3">
        {/* ── Header + KPI ── */}
        <header className="shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="m-base font-bold text-slate-900">Penjamin × Ruangan</h2>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 m-tiny font-semibold text-amber-800 ring-1 ring-amber-200">
                  Data demo — belum tersimpan ke server
                </span>
              </div>
              <p className="mt-1 m-xs leading-relaxed text-slate-500">
                Hubungkan kode ruangan / SMF penjamin (mis. BPJS V-Claim <span className="font-mono text-slate-700">INT</span>,{" "}
                <span className="font-mono text-slate-700">IGD</span>) dengan ruangan rumah sakit untuk routing klaim &amp; kamar.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
              <Kpi icon={Link2} label="Mapping aktif" value={`${stats.aktif}`} sub={`dari ${stats.total}`} tone="emerald" />
              <button
                type="button"
                onClick={() => setStatus(status === "kosong" ? "all" : "kosong")}
                aria-pressed={status === "kosong"}
                className="rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              >
                <Kpi icon={AlertCircle} label="Belum dipetakan" value={`${stats.kosong}`} sub="kode" tone="amber" active={status === "kosong"} />
              </button>
              <Kpi icon={Building} label="Ruangan terhubung" value={`${stats.ruangan}`} tone="sky" />
              <Kpi icon={CheckCircle2} label="Cakupan kode" value={`${stats.cakupan}%`} tone="teal" bar={stats.cakupan} />
            </div>
          </div>
        </header>

        {/* ── Navigasi + papan ── */}
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 lg:grid-cols-[17rem_minmax(0,1fr)] lg:grid-rows-1">
          <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:min-h-0 lg:overflow-y-auto">
            <p className="hidden px-2.5 pt-1 pb-2 m-tiny font-bold uppercase tracking-wider text-slate-500 lg:block">Penjamin</p>
            <PenjaminNav penjaminList={penjaminList} mappings={mappings} selected={selected} onSelect={setSelected} />
          </aside>

          <section aria-label="Kode ruangan penjamin" className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex shrink-0 flex-col gap-2.5 border-b border-slate-100 px-4 py-3 md:flex-row md:items-center">
              <search className="relative min-w-0 md:w-72">
                <label htmlFor="pr-q" className="sr-only">Cari penjamin, kode, atau ruangan</label>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="pr-q"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari kode, nama, atau ruangan…"
                  autoComplete="off"
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-base text-slate-900 transition placeholder:text-slate-400 hover:border-slate-400 focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-500/15 sm:text-sm"
                />
              </search>
              <fieldset className="min-w-0">
                <legend className="sr-only">Saring status</legend>
                <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 [scrollbar-width:none]">
                  {STATUS_OPTS.map((o) => {
                    const on = status === o.id;
                    return (
                      <label key={o.id} className={cn(
                        "relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 m-xs font-semibold transition",
                        "has-focus-visible:ring-2 has-focus-visible:ring-emerald-600",
                        on ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
                      )}>
                        <input type="radio" name="pr-status" value={o.id} checked={on} onChange={() => setStatus(o.id)} className="sr-only" />
                        {o.id === "kosong" && <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" />}
                        {o.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <p className="m-xs text-slate-500 md:ml-auto" aria-live="polite">
                {shownCount} kode{filterAktif && (
                  <button type="button" onClick={() => { setQuery(""); setStatus("all"); }} className="ml-2 font-semibold text-emerald-700 underline-offset-2 hover:underline">
                    Reset
                  </button>
                )}
              </p>
            </div>

            {/* Papan */}
            <div className="relative min-h-0 flex-1 overflow-y-auto p-4">
              {view.length === 0 ? (
                <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-center">
                  <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <Network className="size-5" />
                  </span>
                  <div>
                    <p className="m-sm font-semibold text-slate-800">Tidak ada kode yang cocok</p>
                    <p className="mt-0.5 m-xs text-slate-500">Ubah kata kunci atau filter status.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {view.map(({ p, groups }) => {
                    const cfg = TIPE_CFG[p.tipe];
                    const cov = coverageOf(p, mappings);
                    return (
                      <motion.section
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                        aria-labelledby={`pr-${p.id}`}
                        className="flex flex-col gap-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 id={`pr-${p.id}`} className="m-sm font-bold text-slate-900">{p.nama}</h3>
                          <span className={cn("rounded px-1.5 py-0.5 m-mini font-bold tracking-wide ring-1 ring-inset", cfg.bg, cfg.text, cfg.ring)}>{cfg.short}</span>
                          <span className="m-tiny tabular-nums text-slate-500">{cov.mapped} dari {cov.total} kode terpetakan</span>
                          <Link
                            href="/ehis-master/penjamin"
                            className="ml-auto inline-flex items-center gap-1 m-tiny font-semibold text-slate-500 underline-offset-2 hover:text-emerald-700 hover:underline"
                          >
                            Kelola kode <ArrowUpRight className="size-3" aria-hidden="true" />
                          </Link>
                        </div>

                        {p.kelas.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center m-xs text-slate-500">
                            Penjamin ini belum punya kode ruangan — tambahkan di Master Penjamin.
                          </p>
                        ) : (
                          groups.map((g) => (
                            <div key={g.kategori} className="flex flex-col gap-2">
                              <h4 className="flex items-center gap-2 m-tiny font-bold uppercase tracking-wider text-slate-500">
                                {g.kategori}
                                <span className="font-medium normal-case tracking-normal text-slate-400">{g.items.length} kode</span>
                                <span aria-hidden="true" className="h-px flex-1 bg-slate-100" />
                              </h4>
                              <div className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
                                {g.items.map(({ kelas, mappings: ms }) => (
                                  <KodeRuanganCard
                                    key={kelas.id}
                                    kelas={kelas}
                                    mappings={ms}
                                    onToggle={toggle}
                                    onRemove={remove}
                                    onAdd={(kelasId, ruanganId) => add(p.id, kelasId, ruanganId)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </motion.section>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Urungkan + pengumuman */}
            <p role="status" className="sr-only">{announce}</p>
            {undo && (
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-900 px-4 py-2.5 text-white">
                <p className="min-w-0 flex-1 m-xs">
                  <span className="font-semibold">{undo.label}</span> dilepas.
                </p>
                <button
                  type="button"
                  onClick={undoRemove}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 m-xs font-semibold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" /> Urungkan
                </button>
                <button
                  type="button"
                  onClick={() => setUndo(null)}
                  aria-label="Tutup pemberitahuan"
                  className="rounded-md p-1 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </MotionConfig>
  );
}

const TONE = {
  emerald: { icon: "bg-emerald-50 text-emerald-700", ring: "ring-emerald-300" },
  amber: { icon: "bg-amber-50 text-amber-700", ring: "ring-amber-400" },
  sky: { icon: "bg-sky-50 text-sky-700", ring: "ring-sky-300" },
  teal: { icon: "bg-teal-50 text-teal-700", ring: "ring-teal-300" },
} as const;

function Kpi({ icon: Icon, label, value, sub, tone, active, bar }: {
  icon: typeof Link2;
  label: string;
  value: string;
  sub?: string;
  tone: keyof typeof TONE;
  active?: boolean;
  bar?: number;
}) {
  const t = TONE[tone];
  // Hanya <span> (konten frasa) → sah dipakai di dalam <button> (KPI "Belum dipetakan").
  return (
    <span className={cn(
      "flex h-full min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 transition",
      active && cn("ring-2", t.ring),
    )}>
      <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", t.icon)}>
        <Icon className="size-4" />
      </span>
      <span className="block min-w-0 flex-1">
        <span className="block truncate m-tiny font-medium text-slate-500">{label}</span>
        <span className="flex items-baseline gap-1">
          <span className="m-base font-bold tabular-nums text-slate-900">{value}</span>
          {sub && <span className="m-tiny text-slate-400">{sub}</span>}
        </span>
        {bar != null && (
          <span aria-hidden="true" className="mt-1 block h-1 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-teal-500" style={{ width: `${bar}%` }} />
          </span>
        )}
      </span>
    </span>
  );
}
