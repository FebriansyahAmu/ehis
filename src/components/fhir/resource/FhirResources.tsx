"use client";

// Konsol Resource SatuSehat — kartu per resourceType (jumlah terpetakan, sinkron terakhir), klik kartu
// → daftar resource tipe itu, klik baris → drawer detail + payload yang dikirim (dibangun ulang dari
// data terkini; status Terkirim/Berubah menunjukkan apakah identik dengan yang diterima SatuSehat).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Boxes, RefreshCw, Search, Layers, Clock, ChevronLeft, ChevronRight, ArrowUpRight, Inbox, Hospital } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import {
  getResourceSummary, listResources, getResource,
  type ResourceSummaryDTO, type ResourcePageDTO, type ResourceDetailDTO, type ResourceRowDTO,
} from "@/lib/api/fhir/resources";
import { FhirShell, KpiCard, SectionCard, Pill, Button, EmptyState, SkeletonRows, errMsg, isAbort, FHIR_ACCENT, TONE_SOFT } from "../fhirShared";
import { ALL_META, GROUPS, metaOf, groupTone } from "./resourceCatalog";
import { IdChip, ResourceDrawer } from "./resourceUi";
import { fmtDateTime, fmtRelative } from "./resourceTime";
import { Button as UiButton } from "@/components/ui/button";

const PAGE_SIZE = 24;
const MODE_LABEL: Record<string, { label: string; tone: "slate" | "amber" | "emerald" }> = {
  mock: { label: "Mock", tone: "slate" },
  sandbox: { label: "Sandbox", tone: "amber" },
  prod: { label: "Produksi", tone: "emerald" },
};

export default function FhirResources() {
  const [summary, setSummary] = useState<ResourceSummaryDTO | null>(null);
  const [type, setType] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    getResourceSummary(ac.signal)
      .then((s) => { if (!ac.signal.aborted) setSummary(s); })
      .catch((e) => { if (!isAbort(e)) toast.error("Gagal memuat ringkasan resource", errMsg(e)); });
    return () => ac.abort();
  }, [reloadTick]);

  const countOf = new Map((summary?.types ?? []).map((t) => [t.resourceType, t]));
  // Tipe di luar katalog (mis. resource baru) tetap tampil di grup klinis.
  const extra = (summary?.types ?? []).filter((t) => !ALL_META.some((m) => m.type === t.resourceType)).map((t) => metaOf(t.resourceType));
  const metas = [...ALL_META, ...extra];
  const lastSync = (summary?.types ?? []).map((t) => t.lastSyncAt).filter(Boolean).sort().at(-1) ?? null;
  const mode = summary ? (MODE_LABEL[summary.mode] ?? { label: summary.mode, tone: "slate" as const }) : null;

  function pick(t: string) {
    setType((cur) => (cur === t ? null : t));
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <FhirShell
      icon={Boxes}
      title="Resource"
      description="Semua resource FHIR yang sudah terpetakan ke SatuSehat, dikelompokkan per jenis. Pilih kartu untuk melihat daftarnya, lalu buka detail untuk melihat data yang dikirim."
      actions={<Button variant="secondary" icon={RefreshCw} onClick={() => { setSummary(null); setReloadTick((t) => t + 1); }}>Muat ulang</Button>}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard icon={Layers} label="Resource terpetakan" value={summary ? summary.total.toLocaleString("id-ID") : "…"} sub={mode ? `Lingkungan ${mode.label}` : undefined} />
        <KpiCard icon={Boxes} label="Jenis resource" value={summary ? summary.types.length : "…"} sub={`dari ${ALL_META.length} jenis yang didukung`} tone="sky" />
        <KpiCard icon={Clock} label="Sinkron terakhir" value={summary ? fmtRelative(lastSync) : "…"} sub={lastSync ? fmtDateTime(lastSync) : "belum ada"} tone="emerald" />
      </div>

      {GROUPS.map((g) => {
        const items = metas.filter((m) => m.group === g.key);
        if (!items.length) return null;
        return (
          <section key={g.key} aria-labelledby={`grp-${g.key}`} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <h2 id={`grp-${g.key}`} className="text-sm font-bold text-slate-800">{g.label}</h2>
              <p className="truncate text-[11px] text-slate-400">{g.desc}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {items.map((m, i) => {
                const s = countOf.get(m.type);
                const active = type === m.type;
                const Icon = m.icon;
                return (
                  <motion.button
                    key={m.type}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2) }}
                    onClick={() => pick(m.type)}
                    aria-pressed={active}
                    className={cn(
                      "group flex flex-col gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition outline-none",
                      "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-300",
                      active ? "border-teal-500 ring-2 ring-teal-100" : "border-slate-200",
                      !s && "opacity-80",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", TONE_SOFT[groupTone(m.group)])}>
                        <Icon size={18} aria-hidden />
                      </span>
                      <span className="text-right">
                        <span className={cn("block text-2xl font-black leading-none tabular-nums", s ? "text-slate-900" : "text-slate-300")}>
                          {summary ? (s?.count ?? 0).toLocaleString("id-ID") : "…"}
                        </span>
                        <span className="text-[10.5px] text-slate-400">terpetakan</span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-bold text-slate-800">{m.label}</p>
                      <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{m.desc}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                      <span className="text-slate-400">{s?.lastSyncAt ? `Sinkron ${fmtRelative(s.lastSyncAt)}` : "Belum ada"}</span>
                      <span className={cn("font-semibold transition", active ? "text-teal-700" : "text-slate-400 group-hover:text-teal-700")}>
                        {active ? "Dipilih" : "Lihat"} →
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        );
      })}

      <div ref={listRef} className="scroll-mt-4">
        {type && <ResourceList key={type} type={type} onClose={() => setType(null)} />}
      </div>
    </FhirShell>
  );
}

// ── Daftar per tipe ─────────────────────────────────────────

function ResourceList({ type, onClose }: { type: string; onClose: () => void }) {
  const meta = metaOf(type);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ResourcePageDTO | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const ac = new AbortController();
    listResources({ type, q: query || undefined, page, pageSize: PAGE_SIZE }, ac.signal)
      .then((d) => { if (!ac.signal.aborted) setData(d); })
      .catch((e) => { if (!isAbort(e)) toast.error("Gagal memuat daftar resource", errMsg(e)); });
    return () => ac.abort();
  }, [type, query, page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const clinical = !["Organization", "Location", "Practitioner", "Patient"].includes(type);

  return (
    <SectionCard
      title={`Daftar ${meta.label}`}
      desc={data ? `${data.total.toLocaleString("id-ID")} resource ${type} · klik untuk detail & payload` : "Memuat…"}
      action={<Button variant="ghost" onClick={onClose}>Tutup</Button>}
    >
      <div className="border-b border-slate-100 p-3">
        <label className="relative block">
          <span className="sr-only">Cari IHS id atau ID lokal</span>
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); }}
            placeholder="Cari awalan IHS id atau ID lokal…"
            className={cn("w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 font-mono text-xs outline-none transition placeholder:font-sans placeholder:text-slate-400", FHIR_ACCENT.focus)}
          />
        </label>
      </div>

      {!data ? <SkeletonRows rows={6} /> : data.rows.length === 0 ? (
        <EmptyState icon={Inbox} title={query ? "Tidak ada yang cocok" : `Belum ada ${meta.label} terpetakan`} desc={query ? "Coba awalan id lain." : "Resource muncul setelah onboarding atau job kunjungan berhasil dikirim."} />
      ) : (
        <ul className="grid grid-cols-1 gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
          {data.rows.map((r) => (
            <li key={r.id}>
              <RowCard row={r} clinical={clinical} onOpen={() => setOpenId(r.id)} />
            </li>
          ))}
        </ul>
      )}

      {data && pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          <span>Halaman {page} dari {pages}</span>
          <div className="flex gap-1">
            <Button variant="secondary" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
            <Button variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Berikutnya <ChevronRight size={13} aria-hidden />
            </Button>
          </div>
        </div>
      )}

      <ResourceDetailDrawer id={openId} onClose={() => setOpenId(null)} />
    </SectionCard>
  );
}

function RowCard({ row, clinical, onOpen }: { row: ResourceRowDTO; clinical: boolean; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="flex h-full cursor-pointer flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 transition outline-none hover:border-teal-300 hover:bg-teal-50/30 focus-visible:ring-2 focus-visible:ring-teal-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-800">{row.label ?? "Tanpa label lokal"}</p>
          <p className="truncate text-[11px] text-slate-400">
            {clinical && row.sub ? <span className="inline-flex items-center gap-1"><Hospital size={11} aria-hidden />{row.sub}</span> : (row.sub ?? row.localType)}
          </p>
        </div>
        {row.versionId && <Pill label={`v${row.versionId}`} />}
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="min-w-0 truncate"><span className="text-slate-400">IHS </span><IdChip value={row.ihsId} /></span>
        <span className="shrink-0 text-slate-400">{fmtRelative(row.lastSyncAt)}</span>
      </div>
    </div>
  );
}

/** Drawer detail 1 peta resource — fetch saat dibuka. Dipakai juga oleh halaman lain. */
export function ResourceDetailDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  // Hasil terakhir disimpan beserta id-nya: saat drawer menutup (id → null) isi lama tetap tampil
  // selama animasi keluar; saat id baru dibuka, hasil lama tak cocok → status memuat.
  const [loaded, setLoaded] = useState<{ id: string; d: ResourceDetailDTO | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    getResource(id, ac.signal)
      .then((x) => { if (!ac.signal.aborted) setLoaded({ id, d: x, error: null }); })
      .catch((e) => { if (!isAbort(e)) setLoaded({ id, d: null, error: errMsg(e) ?? "Gagal memuat detail" }); });
    return () => ac.abort();
  }, [id]);

  const current = id ? (loaded?.id === id ? loaded : null) : loaded;
  const d = current?.d ?? null;
  const error = current?.error ?? null;

  return (
    <ResourceDrawer
      open={!!id}
      onClose={onClose}
      resourceType={d?.resourceType ?? "Resource"}
      status={d?.payloadStatus ?? null}
      payload={d?.payload ?? null}
      note={d?.payloadNote}
      loading={!!id && !current}
      error={error}
      meta={d ? [
        { label: "IHS id", value: <IdChip value={d.ihsId} /> },
        { label: "ID lokal", value: <IdChip value={d.localId} /> },
        { label: "Data lokal", value: d.label ? `${d.label}${d.sub ? ` · ${d.sub}` : ""}` : "—" },
        { label: "Versi SatuSehat", value: d.versionId ?? "—" },
        { label: "Sinkron terakhir", value: fmtDateTime(d.lastSyncAt) },
        { label: "Hash payload", value: d.hash ? <code className="font-mono text-[11px]">{d.hash.slice(0, 16)}…</code> : "— (belum diselaraskan)" },
      ] : []}
      footer={d?.kunjunganId ? (
        <UiButton asChild size="sm" className="text-xs font-semibold">
          <Link href={`/ehis-fhir/kunjungan/${d.kunjunganId}`}>
            Buka kunjungan <ArrowUpRight aria-hidden />
          </Link>
        </UiButton>
      ) : undefined}
    />
  );
}
