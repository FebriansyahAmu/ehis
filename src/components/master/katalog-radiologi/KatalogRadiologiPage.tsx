"use client";

import { useState, useMemo } from "react";
import { Radiation, CheckCircle2, ShieldAlert, Droplets } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  RAD_KATALOG_MOCK, emptyRadCatalogRecord,
  type RadCatalogRecord,
} from "@/lib/master/radCatalogMock";
import { hasDRLConfig, usesKontras, type RadTabKey } from "./katalogRadiologiShared";
import RadiologiList from "./RadiologiList";
import RadiologiDetail from "./RadiologiDetail";
import RadiologiEmptyState from "./RadiologiEmptyState";

export default function KatalogRadiologiPage() {
  const loaded = useSkeletonDelay();
  const [tab, setTab] = useState<RadTabKey>("identitas");

  const crud = useMasterCrud<RadCatalogRecord>({
    initial: RAD_KATALOG_MOCK,
    emptyFactory: emptyRadCatalogRecord,
  });

  const stats = useMemo(() => {
    const total   = crud.items.length;
    const aktif   = crud.items.filter((i) => i.status === "Aktif").length;
    const drl     = crud.items.filter(hasDRLConfig).length;
    const kontras = crud.items.filter(usesKontras).length;
    return { total, aktif, drl, kontras };
  }, [crud.items]);

  // Wrap select/addNew untuk reset tab ke "identitas" saat ganti item
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
      accent="rose"
      eyebrow="EHIS Master · Katalog Klinis"
      title="Katalog Radiologi"
      description="Pemeriksaan per modalitas + protap persiapan, kontras, Diagnostic Reference Level (DRL), dan reporting template terstandar. Standar PMK 1014/2008 · BAPETEN No. 2/2018 · ACR."
      stats={
        <>
          <StatCard icon={Radiation}    label="Total"         value={stats.total}   tone="rose" />
          <StatCard icon={CheckCircle2} label="Aktif"         value={stats.aktif}   tone="emerald" />
          <StatCard icon={ShieldAlert}  label="Dengan DRL"    value={stats.drl}     tone="amber" />
          <StatCard icon={Droplets}     label="Pakai Kontras" value={stats.kontras} tone="sky" />
        </>
      }
      list={
        <RadiologiList
          items={crud.items}
          selectedId={crud.selectedId}
          onSelect={handleSelect}
          onAddNew={handleAddNew}
        />
      }
      detail={
        crud.draft ? (
          <RadiologiDetail
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
          <RadiologiEmptyState totalItem={crud.items.length} onAddNew={handleAddNew} />
        )
      }
    />
  );
}
