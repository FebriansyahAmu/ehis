"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, Loader2, Search, ArrowRightLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { dataSepInternal } from "@/lib/bpjs/vClaimSEP";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import { SEP_MOCK } from "@/lib/bpjs/mock/sepMock";

// ── Helpers ────────────────────────────────────────────────

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Gagal memuat data.";
}

function fmtDate(s: string) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// Derive RI SEPs for a given noKartu from SEP_MOCK (mock-first phase)
function getRiSEPs(noKartu: string) {
  return SEP_MOCK.filter(
    (s) => (!noKartu || s.noKartu === noKartu) && s.jnsPelayanan === "1" && s.statusInternal !== "Deleted",
  );
}

// ── Row ────────────────────────────────────────────────────

function SEPRow({
  noKartu, noSEP, tglTerbit, diagAwal, diagAwalNama, statusInternal, index,
  onSelect,
}: {
  noKartu: string; noSEP: string; tglTerbit: string; diagAwal: string;
  diagAwalNama: string | undefined; statusInternal: string; index: number;
  onSelect: (noSEP: string) => void;
}) {
  const [intCount, setIntCount] = useState<number | null>(null);
  const [loading, setLoading]   = useState(false);

  async function loadCount() {
    if (intCount !== null || loading) return;
    setLoading(true);
    try {
      const res = await dataSepInternal(noSEP);
      if (res.ok) setIntCount(res.value.response?.list.length ?? 0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.03 }}
      className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
      onMouseEnter={loadCount}
    >
      <td className="py-2.5 pl-3 pr-3">
        <p className="font-mono text-[11px] font-medium text-slate-700">{noSEP}</p>
        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{noKartu}</p>
      </td>
      <td className="py-2.5 pr-3">
        <p className="font-mono text-[11px] font-bold text-slate-800">{diagAwal}</p>
        <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-1">{diagAwalNama ?? "—"}</p>
      </td>
      <td className="py-2.5 pr-3 text-[11px] text-slate-500">{fmtDate(tglTerbit)}</td>
      <td className="py-2.5 pr-3">
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-bold",
          statusInternal === "Issued" ? "bg-emerald-100 text-emerald-700" :
          statusInternal === "Updated" ? "bg-sky-100 text-sky-700" :
          "bg-slate-100 text-slate-600",
        )}>
          {statusInternal}
        </span>
      </td>
      <td className="py-2.5 pr-3">
        {loading ? (
          <Loader2 size={11} className="animate-spin text-slate-300" />
        ) : intCount !== null ? (
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            intCount > 0 ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-400",
          )}>
            {intCount}
          </span>
        ) : (
          <span className="text-[10px] text-slate-300">—</span>
        )}
      </td>
      <td className="py-2.5 pr-3">
        <button
          type="button"
          onClick={() => onSelect(noSEP)}
          className="flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-sky-100"
        >
          <ArrowRightLeft size={9} strokeWidth={2.5} />
          Detail
        </button>
      </td>
    </motion.tr>
  );
}

// ── Component ──────────────────────────────────────────────

interface SEPInternalListProps {
  onSelectSEP?: (noSEP: string) => void;
}

const SAMPLES = [
  { label: "Kartu 891", value: "0001234567891" },
  { label: "Kartu 892", value: "0001234567892" },
  { label: "Kartu 899 (KLL)", value: "0001234567899" },
];

export default function SEPInternalList({ onSelectSEP }: SEPInternalListProps) {
  const [noKartu, setNoKartu] = useState("");
  const [rows, setRows]       = useState(() => getRiSEPs(""));

  const handleFilter = useCallback(() => {
    setRows(getRiSEPs(noKartu.trim()));
  }, [noKartu]);

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <List size={13} className="text-sky-500" strokeWidth={2.3} />
        <p className="text-xs font-semibold text-slate-700">Daftar SEP Rawat Inap</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={noKartu}
          onChange={(e) => setNoKartu(e.target.value.replace(/\D/g, "").slice(0, 13))}
          placeholder="Filter No. Kartu (13 digit)…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-xs text-slate-700 placeholder:font-sans placeholder:text-slate-300 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
        <button
          type="button"
          onClick={handleFilter}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-200/50 hover:bg-sky-600 transition-colors"
        >
          <Search size={11} strokeWidth={2.5} />
          Filter
        </button>
      </div>

      {/* Dev samples */}
      <div className="flex flex-wrap gap-1.5">
        {SAMPLES.map((s) => (
          <button key={s.value} type="button"
            onClick={() => { setNoKartu(s.value); setRows(getRiSEPs(s.value)); }}
            className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700"
          >
            {s.label}
          </button>
        ))}
        <button type="button"
          onClick={() => { setNoKartu(""); setRows(getRiSEPs("")); }}
          className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
        >
          Tampilkan Semua
        </button>
      </div>

      {/* Note */}
      <p className="text-[10px] leading-relaxed text-slate-400">
        Hover baris untuk muat jumlah SEP Internal. Klik "Detail" untuk lihat transfer di panel kiri.
      </p>

      {/* Table */}
      <AnimatePresence mode="wait">
        <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {rows.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
              <p className="text-xs text-slate-400">Tidak ada SEP Rawat Inap untuk kartu ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/60">
              <table className="w-full min-w-[580px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {["No. SEP / Kartu", "Diagnosa", "Tgl Terbit", "Status", "Internal", ""].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {rows.map((sep, i) => (
                    <SEPRow
                      key={sep.noSEP}
                      noKartu={sep.noKartu}
                      noSEP={sep.noSEP}
                      tglTerbit={sep.tglTerbit}
                      diagAwal={sep.diagAwal}
                      diagAwalNama={sep.diagAwalNama}
                      statusInternal={sep.statusInternal}
                      index={i}
                      onSelect={(noSEP) => onSelectSEP?.(noSEP)}
                    />
                  ))}
                </tbody>
              </table>
              <p className="border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-[10px] text-slate-400">
                {rows.length} SEP Rawat Inap aktif
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
