"use client";

import { useState, useMemo } from "react";
import { Siren, CheckCircle2, Layers, Activity } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  TRIASE_MOCK, emptyTriaseRecord,
  type TriaseRecord,
} from "@/lib/master/triaseMock";
import TriaseList from "./TriaseList";
import TriaseDetail from "./TriaseDetail";
import TriaseEmptyState from "./TriaseEmptyState";
import type { TriaseTabKey } from "./triaseShared";

export default function TriaseIGDPage() {
  const loaded = useSkeletonDelay();
  const [tab, setTab] = useState<TriaseTabKey>("identitas");

  const crud = useMasterCrud<TriaseRecord>({
    initial: TRIASE_MOCK,
    emptyFactory: emptyTriaseRecord,
  });

  const stats = useMemo(() => {
    const total = crud.items.length;
    const aktif = crud.items.filter((i) => i.status === "Aktif").length;
    const totalLevel = crud.items.reduce((acc, i) => acc + i.levels.length, 0);
    const totalParam = crud.items.reduce((acc, i) => acc + i.parameters.length, 0);
    return { total, aktif, totalLevel, totalParam };
  }, [crud.items]);

  const handleSelect = (id: string) => { crud.handleSelect(id); setTab("identitas"); };
  const handleAddNew = () => { crud.handleAddNew(); setTab("identitas"); };
  const handleDelete = () => {
    if (!crud.selected) return;
    crud.handleDelete(`Hapus protokol "${crud.selected.nama}"? Aksi ini tidak dapat di-undo.`);
  };

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="amber"
      eyebrow="EHIS Master · Skala Klinis"
      title="Triase IGD"
      description="Master protokol triase IGD dengan matrix level × parameter klinis. Standar: ESI 5-level (ENA 2020) + DOA · PMK 47/2018 tentang Klasifikasi & Standar Pelayanan IGD."
      stats={
        <>
          <StatCard icon={Siren}        label="Protokol"    value={stats.total}       tone="amber"   />
          <StatCard icon={CheckCircle2} label="Aktif"       value={stats.aktif}       tone="emerald" />
          <StatCard icon={Layers}       label="Total Level" value={stats.totalLevel}  tone="rose"    />
          <StatCard icon={Activity}     label="Parameter"   value={stats.totalParam}  tone="sky"     />
        </>
      }
      list={
        <TriaseList
          items={crud.items}
          selectedId={crud.selectedId}
          onSelect={handleSelect}
          onAddNew={handleAddNew}
        />
      }
      detail={
        crud.draft ? (
          <TriaseDetail
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
          <TriaseEmptyState totalItem={crud.items.length} onAddNew={handleAddNew} />
        )
      }
    />
  );
}
