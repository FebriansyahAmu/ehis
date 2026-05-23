"use client";

import { useState, useMemo } from "react";
import { FlaskConical, CheckCircle2, AlertOctagon, TrendingUp } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  LAB_KATALOG_MOCK, emptyLabKatalogItem,
  type LabKatalogItem,
} from "@/lib/master/labCatalogMock";
import { hasCriticalConfig, hasDeltaConfig, type LabTabKey } from "./katalogLabShared";
import LabItemList from "./LabItemList";
import LabItemDetail from "./LabItemDetail";
import LabItemEmptyState from "./LabItemEmptyState";

export default function KatalogLabPage() {
  const loaded = useSkeletonDelay();
  const [tab, setTab] = useState<LabTabKey>("identitas");

  const crud = useMasterCrud<LabKatalogItem>({
    initial: LAB_KATALOG_MOCK,
    emptyFactory: emptyLabKatalogItem,
  });

  const stats = useMemo(() => {
    const total  = crud.items.length;
    const aktif  = crud.items.filter((i) => (i.status ?? "Aktif") === "Aktif").length;
    const kritis = crud.items.filter(hasCriticalConfig).length;
    const delta  = crud.items.filter(hasDeltaConfig).length;
    return { total, aktif, kritis, delta };
  }, [crud.items]);

  const handleSelect = (id: string) => {
    crud.handleSelect(id);
    setTab("identitas");
  };
  const handleAddNew = () => {
    crud.handleAddNew();
    setTab("identitas");
  };
  const handleDelete = () => {
    if (!crud.selected) return;
    crud.handleDelete(`Hapus pemeriksaan "${crud.selected.nama}"? Aksi ini tidak dapat di-undo.`);
  };

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="sky"
      eyebrow="EHIS Master · Katalog Klinis"
      title="Katalog Laboratorium"
      description="Nilai rujukan, nilai kritis, dan delta threshold — source-of-truth untuk HasilPane autoFlag dan Trend & Delta Check. Standar ISO 15189:2022 · SNARS AP 5."
      stats={
        <>
          <StatCard icon={FlaskConical} label="Total"        value={stats.total}  tone="sky" />
          <StatCard icon={CheckCircle2} label="Aktif"        value={stats.aktif}  tone="emerald" />
          <StatCard icon={AlertOctagon} label="Nilai Kritis" value={stats.kritis} tone="rose" />
          <StatCard icon={TrendingUp}   label="Delta Check"  value={stats.delta}  tone="amber" />
        </>
      }
      list={
        <LabItemList
          items={crud.items}
          selectedId={crud.selectedId}
          onSelect={handleSelect}
          onAddNew={handleAddNew}
        />
      }
      detail={
        crud.draft ? (
          <LabItemDetail
            draft={crud.draft}
            isNew={crud.isNew}
            isDirty={crud.isDirty}
            tab={tab}
            onTabChange={setTab}
            onPatch={crud.handlePatch}
            onSave={crud.handleSave}
            onCancel={crud.handleCancel}
            onDelete={!crud.isNew ? handleDelete : undefined}
          />
        ) : (
          <LabItemEmptyState totalItem={crud.items.length} onAddNew={handleAddNew} />
        )
      }
    />
  );
}
