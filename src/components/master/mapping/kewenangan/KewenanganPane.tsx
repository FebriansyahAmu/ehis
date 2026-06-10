"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Users, Network, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listDokter, type DokterListItemDTO } from "@/lib/api/dokter";
import {
  type KewenanganMap,
  getTindakanList, initKewenanganMap, countAllGranted,
} from "./kewenanganShared";
import DokterListPanel from "./DokterListPanel";
import KewenanganMatrix from "./KewenanganMatrix";

interface KewenanganPaneProps {
  /** Daftar dokter (API /master/dokter) dari SSR. Absen → client fetch (degradasi anggun). */
  initialDokters?: DokterListItemDTO[];
}

export default function KewenanganPane({ initialDokters }: KewenanganPaneProps) {
  const tindakan = useMemo(() => getTindakanList(), []);

  // Dokter REAL (API). SSR hybrid: pakai initialDokters bila ada, else fetch client.
  const [dokters, setDokters] = useState<DokterListItemDTO[]>(initialDokters ?? []);
  const [map, setMap] = useState<KewenanganMap>(() =>
    initKewenanganMap(initialDokters ?? [], tindakan),
  );
  const [selectedId, setSelectedId] = useState<string | null>(initialDokters?.[0]?.id ?? null);

  useEffect(() => {
    if (initialDokters != null) return;
    const ctrl = new AbortController();
    listDokter({ limit: 50 }, ctrl.signal)
      .then(({ items }) => setDokters(items))
      .catch((e) => { if (!(e instanceof DOMException && e.name === "AbortError")) { /* kosong bila gagal */ } });
    return () => ctrl.abort();
  }, [initialDokters]);

  // Map default mengikuti dokter yang termuat (pertahankan edit per-dokter yang sudah ada).
  useEffect(() => {
    setMap((prev) => {
      const base = initKewenanganMap(dokters, tindakan);
      for (const k of Object.keys(base)) if (prev[k]) base[k] = prev[k];
      return base;
    });
  }, [dokters, tindakan]);

  // Pilih dokter pertama begitu data tersedia (bila belum ada pilihan).
  useEffect(() => {
    setSelectedId((cur) => cur ?? dokters[0]?.id ?? null);
  }, [dokters]);

  const selected = useMemo(
    () => dokters.find((d) => d.id === selectedId) ?? null,
    [dokters, selectedId],
  );

  const stats = useMemo(() => {
    const totalCells = dokters.length * tindakan.length;
    const granted = countAllGranted(map);
    const dokterWithPrivilege = dokters.filter(
      (d) => (map[d.id]?.length ?? 0) > 0,
    ).length;
    const pct = totalCells ? Math.round((granted / totalCells) * 100) : 0;
    return { totalCells, granted, dokterWithPrivilege, pct };
  }, [dokters, tindakan, map]);

  const handleToggle = (tindakanId: string) => {
    if (!selectedId) return;
    setMap((prev) => {
      const current = prev[selectedId] ?? [];
      const has = current.includes(tindakanId);
      return {
        ...prev,
        [selectedId]: has ? current.filter((id) => id !== tindakanId) : [...current, tindakanId],
      };
    });
  };

  const handleResetDefault = () => {
    if (!selected) return;
    if (!confirm(`Reset kewenangan ${selected.namaTampil} ke default berdasarkan spesialis?`)) return;
    const defaultMap = initKewenanganMap([selected], tindakan);
    setMap((prev) => ({ ...prev, [selected.id]: defaultMap[selected.id] ?? [] }));
  };

  const handleClearAll = () => {
    if (!selected) return;
    if (!confirm(`Hapus semua kewenangan ${selected.namaTampil}?`)) return;
    setMap((prev) => ({ ...prev, [selected.id]: [] }));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Pane Header */}
      <PaneHeader
        stats={stats}
        totalDokter={dokters.length}
        totalTindakan={tindakan.length}
      />

      {/* Two-panel body */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <DokterListPanel
          dokters={dokters}
          map={map}
          totalTindakan={tindakan.length}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {selected ? (
          <KewenanganMatrix
            dokter={selected}
            tindakan={tindakan}
            map={map}
            onToggle={handleToggle}
            onResetDefault={handleResetDefault}
            onClearAll={handleClearAll}
          />
        ) : (
          <EmptySelection />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PaneHeader({
  stats, totalDokter, totalTindakan,
}: {
  stats: { granted: number; totalCells: number; dokterWithPrivilege: number; pct: number };
  totalDokter: number;
  totalTindakan: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-base font-bold text-slate-900">Kewenangan Klinis</h2>
          <p className="mt-0.5 m-tiny text-slate-500">
            SNARS PMK 755 — dokter hanya boleh lakukan tindakan yang ter-credentialed.
            Pilih dokter di kiri, atur per kategori di kanan.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Stat icon={Users}       label="Dokter"            value={`${stats.dokterWithPrivilege}/${totalDokter}`} cls="bg-teal-50 text-teal-600" />
          <Stat icon={Network}     label="Tindakan"          value={`${totalTindakan}`}                            cls="bg-sky-50 text-sky-600" />
          <Stat icon={ShieldCheck} label="Coverage"          value={`${stats.pct}%`}                               cls="bg-emerald-50 text-emerald-600" />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon, label, value, cls,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  cls: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", cls)}>
        <Icon size={12} />
      </span>
      <div>
        <p className="m-mini font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="m-base font-black leading-none text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function EmptySelection() {
  return (
    <section className="flex h-full min-w-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
          <MousePointer2 size={20} className="text-teal-600" />
        </span>
        <p className="mt-3 m-sm font-semibold text-slate-700">Pilih dokter di kiri</p>
        <p className="mt-1 m-tiny text-slate-400">
          untuk mengatur kewenangan tindakan klinis
        </p>
      </div>
    </section>
  );
}
