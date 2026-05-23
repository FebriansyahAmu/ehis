"use client";

import { useState, useMemo } from "react";
import { Layers, ListChecks, Power, Tag } from "lucide-react";
import {
  MasterPageLayout, StatCard, useSkeletonDelay,
} from "@/components/master/shared";
import {
  EDUKASI_COLLECTIONS, type EdukasiCollectionKey, type EdukasiEntry,
} from "@/lib/master/edukasiMock";
import EdukasiSidebar from "./EdukasiSidebar";
import EdukasiTable from "./EdukasiTable";

export default function WorkflowEdukasiPage() {
  const loaded = useSkeletonDelay();
  const [activeKey, setActiveKey] = useState<EdukasiCollectionKey>("topik-edukasi");
  const [collectionsState, setCollectionsState] = useState(EDUKASI_COLLECTIONS);

  const activeCollection = useMemo(
    () => collectionsState.find((c) => c.key === activeKey) ?? collectionsState[0],
    [collectionsState, activeKey],
  );

  const stats = useMemo(() => {
    const total = collectionsState.reduce((sum, c) => sum + c.entries.length, 0);
    const aktif = collectionsState.reduce(
      (sum, c) => sum + c.entries.filter((e) => e.status === "Aktif").length,
      0,
    );
    const nonAktif = total - aktif;
    return { kategori: collectionsState.length, total, aktif, nonAktif };
  }, [collectionsState]);

  const handleEntriesChange = (entries: EdukasiEntry[]) => {
    setCollectionsState((prev) =>
      prev.map((c) => (c.key === activeCollection.key ? { ...c, entries } : c)),
    );
  };

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="amber"
      eyebrow="EHIS Master · Workflow & Operasional"
      title="Workflow Edukasi"
      description="Katalog komponen workflow edukasi pasien & keluarga — topik, media, metode, hambatan, pemahaman, tanda bahaya, dan tipe instruksi pulang. Single source untuk EdukasiPane (IGD) dan DischargePlanTab (RI)."
      stats={
        <>
          <StatCard icon={Layers}     label="Kategori"    value={stats.kategori}  tone="amber"   />
          <StatCard icon={ListChecks} label="Total Entri" value={stats.total}     tone="sky"     />
          <StatCard icon={Power}      label="Aktif"       value={stats.aktif}     tone="emerald" />
          <StatCard icon={Tag}        label="Non-Aktif"   value={stats.nonAktif}  tone="slate"   />
        </>
      }
      list={<EdukasiSidebar collections={collectionsState} activeKey={activeCollection.key} onSelect={setActiveKey} />}
      detail={<EdukasiTable collection={activeCollection} onChange={handleEntriesChange} />}
    />
  );
}
