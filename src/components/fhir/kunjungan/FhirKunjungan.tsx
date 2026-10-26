"use client";

// Daftar kunjungan + status sinkron SatuSehat. Cari by no. kunjungan / nama / RM / ID kunjungan /
// IHS Encounter id → kartu → halaman detail resource per kunjungan.

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Route, Search, RefreshCw, ChevronLeft, ChevronRight, Inbox, Layers, TriangleAlert, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { listEncounters, type EncounterPageDTO, type KunjunganSyncFilter, type KunjunganUnit } from "@/lib/api/fhir/resources";
import { FhirShell, Pill, Button, EmptyState, SkeletonRows, errMsg, isAbort, FHIR_ACCENT } from "../fhirShared";
import { IdChip } from "../resource/resourceUi";
import { fmtDateTime } from "../resource/resourceTime";
import { KUNJUNGAN_STATUS_LABEL, SYNC_STATE, UNIT_LABEL, syncStateOf } from "./kunjunganShared";

const PAGE_SIZE = 18;
const UNITS: (KunjunganUnit | "")[] = ["", "IGD", "RawatJalan", "RawatInap"];
const SYNCS: (KunjunganSyncFilter | "")[] = ["", "terkirim", "belum", "antre", "gagal"];

export default function FhirKunjungan() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState<KunjunganUnit | "">("");
  const [sync, setSync] = useState<KunjunganSyncFilter | "">("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EncounterPageDTO | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const ac = new AbortController();
    listEncounters({ q: query || undefined, unit: unit || undefined, sync: sync || undefined, page, pageSize: PAGE_SIZE }, ac.signal)
      .then((d) => { if (!ac.signal.aborted) setData(d); })
      .catch((e) => { if (!isAbort(e)) toast.error("Gagal memuat kunjungan", errMsg(e)); });
    return () => ac.abort();
  }, [query, unit, sync, page, tick]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const filter = (fn: () => void) => { setData(null); setPage(1); fn(); };

  return (
    <FhirShell
      icon={Route}
      title="Kunjungan"
      description="Status kirim SatuSehat per kunjungan. Buka kartu untuk melihat semua resource milik kunjungan itu — mana yang sudah terkirim, berubah, atau belum — beserta data yang dikirim."
      actions={<Button variant="secondary" icon={RefreshCw} onClick={() => { setData(null); setTick((t) => t + 1); }}>Muat ulang</Button>}
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="relative block">
          <span className="sr-only">Cari kunjungan</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="No. kunjungan, nama pasien, No. RM, ID kunjungan, atau IHS Encounter id…"
            className={cn("w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:bg-white", FHIR_ACCENT.focus)}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented
            label="Unit"
            options={UNITS.map((u) => ({ value: u, label: u ? UNIT_LABEL[u] : "Semua unit" }))}
            value={unit}
            onChange={(v) => filter(() => setUnit(v as KunjunganUnit | ""))}
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter status sinkron">
            {SYNCS.map((s) => (
              <button
                key={s || "all"}
                type="button"
                onClick={() => { if (s !== sync) filter(() => setSync(s)); }}
                aria-pressed={sync === s}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-teal-300",
                  sync === s ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {s ? SYNC_STATE[s].label : "Semua status"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!data ? (
        <div className="rounded-2xl border border-slate-200 bg-white"><SkeletonRows rows={6} /></div>
      ) : data.rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState icon={Inbox} title="Tidak ada kunjungan" desc={query ? "Tidak ada yang cocok dengan pencarian ini." : "Kunjungan muncul setelah pasien diterima di unit layanan."} />
        </div>
      ) : (
        <>
          <p className="text-[11px] text-slate-400">{data.total.toLocaleString("id-ID")} kunjungan</p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {data.rows.map((r, i) => {
              const st = SYNC_STATE[syncStateOf(r)];
              return (
                <motion.li key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(i * 0.025, 0.2) }}>
                  <Link
                    href={`/ehis-fhir/kunjungan/${r.id}`}
                    className="group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition outline-none hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{r.pasienNama}</p>
                        <p className="truncate text-[11px] text-slate-400">RM {r.noRm} · {r.noKunjungan}</p>
                      </div>
                      <Pill label={st.label} tone={st.tone} dot />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill label={UNIT_LABEL[r.unit] ?? r.unit} tone="teal" />
                      <Pill label={KUNJUNGAN_STATUS_LABEL[r.status] ?? r.status} />
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><CalendarClock size={11} aria-hidden />{fmtDateTime(r.waktuKunjungan)}</span>
                    </div>
                    {r.jobStatus === "Failed" && r.jobError && (
                      <p className="flex items-start gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] leading-snug text-rose-700">
                        <TriangleAlert size={12} className="mt-0.5 shrink-0" aria-hidden />
                        <span className="line-clamp-2">{r.jobError}</span>
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px]">
                      <span className="min-w-0 truncate"><span className="text-slate-400">Encounter </span><IdChip value={r.encounterIhsId} muted="belum ada" /></span>
                      <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-slate-500 group-hover:text-teal-700">
                        <Layers size={12} aria-hidden />{r.resourceCount} resource →
                      </span>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
          {pages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Halaman {page} dari {pages}</span>
              <div className="flex gap-1">
                <Button variant="secondary" icon={ChevronLeft} disabled={page <= 1} onClick={() => { setData(null); setPage((p) => p - 1); }}>Sebelumnya</Button>
                <Button variant="secondary" disabled={page >= pages} onClick={() => { setData(null); setPage((p) => p + 1); }}>
                  Berikutnya <ChevronRight size={13} aria-hidden />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </FhirShell>
  );
}

function Segmented({ label, options, value, onChange }: {
  label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-0.5" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value || "all"}
          type="button"
          onClick={() => { if (o.value !== value) onChange(o.value); }}
          aria-pressed={value === o.value}
          className={cn(
            "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-teal-300",
            value === o.value ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-800",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
