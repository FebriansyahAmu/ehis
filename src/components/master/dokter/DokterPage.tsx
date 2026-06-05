"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCog, Stethoscope, Activity, MousePointer2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import {
  listDokter, getDokter,
  type DokterListItemDTO, type DokterDTO,
} from "@/lib/api/dokter";
import DokterList from "./DokterList";
import DokterDetail from "./DokterDetail";
import DokterProvisionModal from "./DokterProvisionModal";

interface DokterPageProps {
  initialDokters: DokterListItemDTO[];
  prefetched: boolean;
}

// ── Skeleton ───────────────────────────────────────────────
function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-2">
        <Bone className="h-4 w-44" />
        <Bone className="h-3 w-72" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => <Bone key={i} className="h-16 rounded-2xl" />)}
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Bone className="h-[560px] w-full rounded-2xl lg:w-[380px]" />
        <Bone className="h-[560px] flex-1 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, iconCls, delay = 0,
}: {
  icon: React.ElementType; label: string; value: string; sub: string; iconCls: string; delay?: number;
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
        <p className="text-[10px] font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-black leading-none text-slate-900">{value}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function DokterPage({ initialDokters, prefetched }: DokterPageProps) {
  const [dokters, setDokters] = useState<DokterListItemDTO[]>(initialDokters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(prefetched);
  const [listErr, setListErr] = useState<string | null>(null);
  const [provisionOpen, setProvisionOpen] = useState(false);

  // Detail cache (id → DokterDTO) + status fetch detail terpilih.
  const detailCache = useRef<Map<string, DokterDTO>>(new Map());
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);

  // Fallback fetch list bila SSR gagal prefetch (degradasi anggun).
  useEffect(() => {
    if (prefetched) return;
    const ctrl = new AbortController();
    listDokter({ limit: 50 }, ctrl.signal)
      .then(({ items }) => { setDokters(items); setListErr(null); })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setListErr(e instanceof ApiError ? e.message : "Gagal memuat daftar dokter");
      })
      .finally(() => setLoaded(true));
    return () => ctrl.abort();
  }, [prefetched]);

  // Fetch detail saat pilih (cache-aside).
  useEffect(() => {
    if (!selectedId || detailCache.current.has(selectedId)) {
      setDetailErr(null);
      return;
    }
    const ctrl = new AbortController();
    setDetailLoading(true);
    setDetailErr(null);
    getDokter(selectedId, ctrl.signal)
      .then((dto) => { detailCache.current.set(dto.id, dto); rerender(); })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setDetailErr(e instanceof ApiError ? e.message : "Gagal memuat detail dokter");
      })
      .finally(() => setDetailLoading(false));
    return () => ctrl.abort();
  }, [selectedId, rerender]);

  const selectedDetail = selectedId ? detailCache.current.get(selectedId) ?? null : null;

  const stats = useMemo(() => {
    const total = dokters.length;
    const active = dokters.filter((d) => d.statusPraktik === "Aktif").length;
    const cuti = dokters.filter((d) => d.statusPraktik === "Cuti").length;
    const spesialis = dokters.filter((d) => d.spesialisKode !== "Umum").length;
    return { total, active, cuti, spesialis };
  }, [dokters]);

  const handleSaved = useCallback((next: DokterDTO) => {
    detailCache.current.set(next.id, next);
    setDokters((prev) => prev.map((d) => (d.id === next.id ? next : d)));
    rerender();
  }, [rerender]);

  const handleDeleted = useCallback((id: string) => {
    detailCache.current.delete(id);
    setDokters((prev) => prev.filter((d) => d.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const handleCreated = useCallback((created: DokterDTO) => {
    detailCache.current.set(created.id, created);
    setDokters((prev) => [created, ...prev.filter((d) => d.id !== created.id)]);
    setSelectedId(created.id);
    setProvisionOpen(false);
  }, []);

  if (!loaded) return <PageSkeleton />;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="flex h-full flex-col gap-4 p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-600">EHIS Master</p>
            <h1 className="mt-0.5 text-base font-bold text-slate-900">Dokter & Nakes</h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Profil klinis tenaga medis — kredensial STR/SIP, spesialisasi, dan status praktik.
              Identitas bersumber dari data Pegawai; penugasan & jadwal dikelola di modul terpisah.
            </p>
          </div>
        </div>

        {listErr && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            <AlertCircle size={13} /> {listErr}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={UserCog} label="Total Profil Dokter" value={`${stats.total}`}
            sub={`${stats.active} aktif · ${stats.cuti} cuti`} iconCls="bg-teal-100 text-teal-600" delay={0} />
          <StatCard icon={Stethoscope} label="Dokter Spesialis" value={`${stats.spesialis}`}
            sub={`${stats.total - stats.spesialis} dokter umum`} iconCls="bg-sky-100 text-sky-600" delay={0.07} />
          <StatCard icon={Activity} label="Sedang Bertugas" value={`${stats.active}`}
            sub="status Aktif" iconCls="bg-emerald-100 text-emerald-600" delay={0.14} />
        </div>

        {/* Two-panel */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <DokterList
            dokters={dokters}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onProvision={() => setProvisionOpen(true)}
          />
          <section className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-5 py-5">
              <AnimatePresence mode="wait">
                {!selectedId ? (
                  <EmptyDetail key="empty" onProvision={() => setProvisionOpen(true)} />
                ) : detailLoading && !selectedDetail ? (
                  <div key="loading" className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 size={22} className="animate-spin text-teal-500" />
                    <p className="text-[11px]">Memuat detail…</p>
                  </div>
                ) : detailErr && !selectedDetail ? (
                  <div key="err" className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-center">
                    <AlertCircle size={22} className="text-rose-500" />
                    <p className="text-[12px] font-semibold text-rose-600">{detailErr}</p>
                  </div>
                ) : selectedDetail ? (
                  <motion.div
                    key={selectedDetail.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    <DokterDetail
                      dokter={selectedDetail}
                      onSaved={handleSaved}
                      onDeleted={handleDeleted}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </motion.div>

      <DokterProvisionModal
        open={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

// ── Empty Detail ───────────────────────────────────────────
function EmptyDetail({ onProvision }: { onProvision: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[500px] flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 ring-4 ring-teal-100">
        <MousePointer2 size={22} className="text-teal-600" />
      </span>
      <div className="max-w-xs">
        <p className="text-sm font-bold text-slate-800">Pilih dokter di kiri</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Atau lengkapi profil klinis untuk pegawai berprofesi dokter yang belum punya
          profil — STR, SIP, dan spesialisasi.
        </p>
      </div>
      <button
        type="button"
        onClick={onProvision}
        className="rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
      >
        Lengkapi Profil Dokter
      </button>
    </motion.div>
  );
}
