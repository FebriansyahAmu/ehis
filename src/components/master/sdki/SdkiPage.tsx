"use client";

import { useState, useMemo } from "react";
import { ClipboardList, CheckCircle2, Layers, Workflow } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  SDKI_MOCK, emptySdkiItem,
  type SdkiItem, countSdkiIntervensi,
} from "@/lib/master/sdkiMock";
import SdkiList from "./SdkiList";
import SdkiDetail from "./SdkiDetail";
import SdkiEmptyState from "./SdkiEmptyState";
import type { SdkiTabKey } from "./sdkiShared";

export default function SdkiPage() {
  const loaded = useSkeletonDelay();
  const [tab, setTab] = useState<SdkiTabKey>("identitas");

  const crud = useMasterCrud<SdkiItem>({
    initial: SDKI_MOCK,
    emptyFactory: emptySdkiItem,
  });

  const stats = useMemo(() => {
    const total = crud.items.length;
    const aktif = crud.items.filter((i) => i.status === "Aktif").length;
    const totalIntervensi = crud.items.reduce((acc, i) => acc + countSdkiIntervensi(i), 0);
    const totalKriteria = crud.items.reduce((acc, i) => acc + i.kriteriaHasil.length, 0);
    return { total, aktif, totalIntervensi, totalKriteria };
  }, [crud.items]);

  const handleSelect = (id: string) => { crud.handleSelect(id); setTab("identitas"); };
  const handleAddNew = () => { crud.handleAddNew(); setTab("identitas"); };
  const handleDelete = () => {
    if (!crud.selected) return;
    crud.handleDelete(`Hapus diagnosa "${crud.selected.kode} ${crud.selected.nama}"? Aksi ini tidak dapat di-undo.`);
  };

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="rose"
      eyebrow="EHIS Master · Reference"
      title="SDKI / SIKI / SLKI"
      description="Katalog diagnosa keperawatan (SDKI) + luaran (SLKI) + intervensi (SIKI) standar PPNI. Dikonsumsi KeperawatanTab RI + CarePlanTab template. Mock representative ~30 diagnosa — full dataset PPNI saat backend siap."
      stats={
        <>
          <StatCard icon={ClipboardList} label="Total Diagnosa" value={stats.total}           tone="rose"    />
          <StatCard icon={CheckCircle2}  label="Aktif"          value={stats.aktif}           tone="emerald" />
          <StatCard icon={Layers}        label="Kriteria SLKI"  value={stats.totalKriteria}   tone="sky"     />
          <StatCard icon={Workflow}      label="Intervensi SIKI" value={stats.totalIntervensi} tone="violet"  />
        </>
      }
      list={
        <SdkiList
          items={crud.items}
          selectedId={crud.selectedId}
          onSelect={handleSelect}
          onAddNew={handleAddNew}
        />
      }
      detail={
        crud.draft ? (
          <SdkiDetail
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
          <SdkiEmptyState totalItem={crud.items.length} onAddNew={handleAddNew} />
        )
      }
    />
  );
}
