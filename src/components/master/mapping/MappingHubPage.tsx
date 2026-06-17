"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  SUBPAGE_REGISTRY, type SubpageKey, getSubpage,
} from "./mappingShared";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import type { DokterListItemDTO } from "@/lib/api/dokter";
import type { PegawaiListItemDTO } from "@/lib/api/pegawai";
import type { PenugasanRuanganDTO } from "@/lib/api/penugasanRuangan";
import type { TindakanDTO } from "@/lib/schemas/master/tindakan";
import type { LabTestDTO } from "@/lib/schemas/master/labTest";
import type { RadCatalogDTO } from "@/lib/schemas/master/radCatalog";
import type { LayananUnitRadEdgeDTO } from "@/lib/schemas/master/layananUnitRad";
import type { LayananUnitEdgeDTO } from "@/lib/schemas/master/layananUnit";
import type { LayananUnitLabEdgeDTO } from "@/lib/schemas/master/layananUnitLab";
import type { TarifTindakanDTO } from "@/lib/schemas/master/tarifTindakan";
import type { TarifLabTestDTO } from "@/lib/schemas/master/tarifLabTest";
import type { ObatDTO } from "@/lib/schemas/master/obat";
import type { FormulariumEdgeDTO } from "@/lib/schemas/master/formularium";
import MappingHubSidebar from "./MappingHubSidebar";
import SDMAssignmentPane from "./sdm/SDMAssignmentPane";
import KewenanganPane from "./kewenangan/KewenanganPane";
import LayananUnitPane from "./layanan/LayananUnitPane";
import TarifPane from "./tarif/TarifPane";
import FormulariumPane from "./formularium/FormulariumPane";
import DistribusiPane from "./distribusi/DistribusiPane";
import PenjaminRuanganPane from "./penjamin-ruangan/PenjaminRuanganPane";
import RBACPane from "./rbac/RBACPane";
import ComingSoonPane from "./ComingSoonPane";
import DensityToggle, { useDensity } from "./DensityToggle";

// ── Skeleton ───────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-4 w-44" />
          <Bone className="h-3 w-72" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <Bone className="h-full w-65" />
        <Bone className="h-full flex-1" />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

const VALID_KEYS = new Set<SubpageKey>(SUBPAGE_REGISTRY.map((s) => s.key));

interface MappingHubPageProps {
  /** Tree Ruangan dari SSR — diteruskan ke SDM Assignment (API-RULES §6.1). */
  initialTree?: AnyNode[];
  /** Daftar dokter dari SSR — diteruskan ke SDM Assignment (roster). */
  initialDokters?: DokterListItemDTO[];
  /** Daftar pegawai aktif dari SSR — diteruskan ke SDM Assignment (roster non-dokter). */
  initialPegawai?: PegawaiListItemDTO[];
  /** Penugasan ruangan dari SSR — diteruskan ke SDM Assignment (assignment map). */
  initialPenugasan?: PenugasanRuanganDTO[];
  /** Katalog tindakan dari SSR — diteruskan ke Layanan Unit (baris matrix). */
  initialTindakan?: TindakanDTO[];
  /** Katalog laboratorium dari SSR — diteruskan ke Layanan Unit (baris grup Lab). */
  initialLab?: LabTestDTO[];
  /** Katalog radiologi dari SSR — diteruskan ke Layanan Unit (baris grup Rad). */
  initialRad?: RadCatalogDTO[];
  /** Edge mapping Tindakan dari SSR — diteruskan ke Layanan Unit (seed map persist). */
  initialLayanan?: LayananUnitEdgeDTO[];
  /** Edge mapping Lab dari SSR — diteruskan ke Layanan Unit (seed map persist). */
  initialLayananLab?: LayananUnitLabEdgeDTO[];
  /** Edge mapping Radiologi dari SSR — diteruskan ke Layanan Unit (seed map persist). */
  initialLayananRad?: LayananUnitRadEdgeDTO[];
  /** Edge tarif tindakan dari SSR — diteruskan ke Tarif Matrix (seed map persist). */
  initialTarif?: TarifTindakanDTO[];
  /** Edge tarif lab dari SSR — diteruskan ke Tarif Matrix grup Lab (seed map persist). */
  initialTarifLab?: TarifLabTestDTO[];
  /** Katalog obat dari SSR — diteruskan ke Formularium (baris matrix). */
  initialObat?: ObatDTO[];
  /** Edge formularium dari SSR — diteruskan ke Formularium (seed override map). */
  initialFormularium?: FormulariumEdgeDTO[];
}

export default function MappingHubPage({ initialTree, initialDokters, initialPegawai, initialPenugasan, initialTindakan, initialLab, initialRad, initialLayanan, initialLayananLab, initialLayananRad, initialTarif, initialTarifLab, initialObat, initialFormularium }: MappingHubPageProps = {}) {
  const searchParams = useSearchParams();
  const initialKey = (() => {
    const param = searchParams?.get("sub") as SubpageKey | null;
    return param && VALID_KEYS.has(param) ? param : "sdm";
  })();

  const [activeKey, setActiveKey] = useState<SubpageKey>(initialKey);
  const [loaded, setLoaded] = useState(false);
  const { density, setDensity, mounted } = useDensity();

  // Sync state when URL query changes (e.g., deep-link from Penjamin Page)
  useEffect(() => {
    const param = searchParams?.get("sub") as SubpageKey | null;
    if (param && VALID_KEYS.has(param) && param !== activeKey) {
      setActiveKey(param);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, []);

  // Hindari flash dengan default density saat server-side / sebelum mount
  const dataDensity = mounted ? density : "comfortable";

  return (
    <div data-density={dataDensity} className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <PageSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col gap-4 p-6"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex shrink-0 items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="m-mini font-semibold uppercase tracking-widest text-teal-600">
                  EHIS Master
                </p>
                <h1 className="mt-0.5 m-lg font-bold text-slate-900">Mapping Hub</h1>
                <p className="mt-0.5 m-xs text-slate-500">
                  Satu pintu untuk mengelola semua relasi antar entitas master — penugasan SDM,
                  kewenangan klinis, tarif, formularium, dan distribusi.
                </p>
              </div>
              <DensityToggle density={density} onChange={setDensity} />
            </motion.div>

            {/* Body: Sidebar + Content */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
              <MappingHubSidebar activeKey={activeKey} onSelect={setActiveKey} />

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeKey}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                    {renderPane(activeKey, initialTree, initialDokters, initialPegawai, initialPenugasan, initialTindakan, initialLab, initialRad, initialLayanan, initialLayananLab, initialLayananRad, initialTarif, initialTarifLab, initialObat, initialFormularium)}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderPane(
  key: SubpageKey,
  initialTree?: AnyNode[],
  initialDokters?: DokterListItemDTO[],
  initialPegawai?: PegawaiListItemDTO[],
  initialPenugasan?: PenugasanRuanganDTO[],
  initialTindakan?: TindakanDTO[],
  initialLab?: LabTestDTO[],
  initialRad?: RadCatalogDTO[],
  initialLayanan?: LayananUnitEdgeDTO[],
  initialLayananLab?: LayananUnitLabEdgeDTO[],
  initialLayananRad?: LayananUnitRadEdgeDTO[],
  initialTarif?: TarifTindakanDTO[],
  initialTarifLab?: TarifLabTestDTO[],
  initialObat?: ObatDTO[],
  initialFormularium?: FormulariumEdgeDTO[],
) {
  if (key === "sdm")
    return <SDMAssignmentPane initialTree={initialTree} initialDokters={initialDokters} initialPegawai={initialPegawai} initialPenugasan={initialPenugasan} />;
  if (key === "kewenangan")  return <KewenanganPane initialDokters={initialDokters} />;
  if (key === "layanan")     return <LayananUnitPane tindakan={initialTindakan} lab={initialLab} rad={initialRad} tree={initialTree} layanan={initialLayanan} layananLab={initialLayananLab} layananRad={initialLayananRad} />;
  if (key === "tarif")       return <TarifPane tindakan={initialTindakan} lab={initialLab} tree={initialTree} tarif={initialTarif} tarifLab={initialTarifLab} />;
  if (key === "formularium") return <FormulariumPane obat={initialObat} tree={initialTree} formularium={initialFormularium} />;
  if (key === "distribusi")  return <DistribusiPane />;
  if (key === "penjamin-ruangan") return <PenjaminRuanganPane />;
  if (key === "rbac")        return <RBACPane />;

  // Fallback (semua sub-page sekarang sudah ready)
  const config = getSubpage(key);
  return (
    <div className="flex min-h-0 flex-1 items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ComingSoonPane config={config} />
    </div>
  );
}

// Silence unused warning if registry shifts later
void SUBPAGE_REGISTRY;
