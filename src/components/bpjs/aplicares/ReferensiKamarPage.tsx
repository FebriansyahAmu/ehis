"use client";

/**
 * BP7.1 — Referensi Kamar BPJS Aplicares.
 *
 * Route: /ehis-bpjs/aplicares/referensi-kamar
 * Accent: pink · Adapter: getRefKelas() + getMapKelas() preview
 *
 * Tampil daftar kelas resmi BPJS Aplicares — seed untuk mapping bed RS lokal.
 * Cache TTL 24 jam · "Sync Now" manual refresh.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, ShieldCheck, Clock, RotateCw, Database, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRefKelas } from "@/lib/bpjs/aplicaresAdapter";
import type { RefKelasAplicaresItem } from "@/lib/bpjs/bpjsContracts";
import {
  kelasBPJSChipCls,
  kelasBPJSNote,
  cacheStatusCls,
  cacheStatusLabel,
  type CacheStatus,
} from "./aplicaresShared";

// ── Skeleton ───────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-2">
        <Bone className="h-2.5 w-28" />
        <Bone className="h-5 w-44" />
        <Bone className="h-2.5 w-80" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <Bone key={i} className="h-16 rounded-2xl" />)}
      </div>
      <Bone className="h-80 rounded-2xl" />
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, iconCls, delay = 0,
}: {
  icon: React.ElementType; label: string; value: string;
  sub: string; iconCls: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconCls)}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-black leading-none text-slate-900">{value}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────

export default function ReferensiKamarPage() {
  const [loaded, setLoaded]       = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [rows, setRows]           = useState<RefKelasAplicaresItem[]>([]);
  const [lastSync, setLastSync]   = useState<Date | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>("empty");

  async function doSync() {
    setSyncing(true);
    try {
      const res = await getRefKelas();
      if (res.ok && res.value.response) {
        setRows(res.value.response as RefKelasAplicaresItem[]);
        setLastSync(new Date());
        setCacheStatus("fresh");
      }
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(async () => {
      await doSync();
      setLoaded(true);
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tarifCount = rows.filter((r) => !["NON", "VVP"].includes(r.kodekelas)).length;

  function fmtSyncTime(d: Date): string {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  return (
    <AnimatePresence mode="wait">
      {!loaded ? (
        <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <PageSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-4 p-6"
        >
          {/* ── Header ── */}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-pink-600">
              EHIS BPJS · Aplicares
            </p>
            <h1 className="mt-0.5 text-base font-bold text-slate-900">Referensi Kamar</h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Daftar kelas kamar resmi BPJS Aplicares —{" "}
              <span className="font-semibold">seed untuk mapping bed RS lokal</span>.
              Cache TTL 24 jam · klik <em>Sync Now</em> untuk refresh manual.
            </p>
          </div>

          {/* ── StatCards ── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon={Tag}
              label="Total Kelas BPJS"
              value={String(rows.length)}
              sub="termasuk kelas khusus (VVIP / NON)"
              iconCls="bg-pink-100 text-pink-600"
              delay={0}
            />
            <StatCard
              icon={ShieldCheck}
              label="Kelas Tarif Valid"
              value={String(tarifCount)}
              sub="valid untuk SEP & MAP kelas"
              iconCls="bg-emerald-100 text-emerald-600"
              delay={0.07}
            />
            <StatCard
              icon={Clock}
              label="Status Cache"
              value={cacheStatusLabel(cacheStatus)}
              sub={lastSync ? `Sync: ${fmtSyncTime(lastSync)}` : "Belum di-sync"}
              iconCls={
                cacheStatus === "fresh"
                  ? "bg-emerald-100 text-emerald-600"
                  : cacheStatus === "stale"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-slate-100 text-slate-500"
              }
              delay={0.14}
            />
          </div>

          {/* ── Table Panel ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Database size={13} className="text-pink-500" />
                <span className="text-[11px] font-semibold text-slate-700">
                  Daftar Kelas BPJS Aplicares
                </span>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  cacheStatusCls(cacheStatus),
                )}>
                  {cacheStatusLabel(cacheStatus)}
                </span>
              </div>
              <button
                onClick={doSync}
                disabled={syncing}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition",
                  "border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <RotateCw size={11} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Syncing…" : "Sync Now"}
              </button>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2 border-b border-slate-100 bg-pink-50/40 px-4 py-2.5">
              <Info size={12} className="mt-0.5 shrink-0 text-pink-400" />
              <p className="text-[10px] leading-relaxed text-slate-500">
                Data ini di-fetch dari <code className="rounded bg-slate-100 px-1 font-mono text-[9px]">/ref/kelas</code>{" "}
                Aplicares. Digunakan sebagai pilihan <strong>Kelas BPJS</strong> saat mapping ke kelas RS lokal
                di halaman <span className="font-semibold text-pink-600">Map Kelas</span>.
                Kelas <strong>NON</strong> dan <strong>VVP</strong> tidak dapat digunakan untuk pembuatan SEP reguler.
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      No
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      Kode Kelas
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      Nama Kelas
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      Catatan
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const isNonTarif = ["NON", "VVP"].includes(row.kodekelas);
                    return (
                      <tr
                        key={row.kodekelas}
                        className={cn(
                          "border-b border-slate-50 transition",
                          isNonTarif ? "hover:bg-slate-50" : "hover:bg-pink-50/30",
                        )}
                      >
                        <td className="px-4 py-2.5 tabular-nums text-slate-400">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-bold",
                            kelasBPJSChipCls(row.kodekelas),
                          )}>
                            {row.kodekelas}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">
                          {row.namakelas}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">
                          {kelasBPJSNote(row.kodekelas)}
                        </td>
                        <td className="px-4 py-2.5">
                          {isNonTarif ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                              Tidak Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              Tarif Aktif
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {rows.length === 0 && !syncing && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[11px] text-slate-400">
                        Belum ada data — klik <strong>Sync Now</strong> untuk memuat dari Aplicares.
                      </td>
                    </tr>
                  )}

                  {syncing && rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <RotateCw size={12} className="animate-spin text-pink-400" />
                          Memuat dari Aplicares BPJS…
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2">
              <span className="text-[10px] text-slate-400">
                {rows.length} kelas · Sumber: <code className="font-mono text-[9px]">GET /ref/kelas</code> Aplicares
              </span>
              {lastSync && (
                <span className="text-[10px] text-slate-400">
                  Terakhir sync: {fmtSyncTime(lastSync)}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
