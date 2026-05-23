"use client";

import { useState, useMemo } from "react";
import { Zap, CheckCircle2, Scissors, Star } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  TINDAKAN_MOCK, emptyTindakanRecord,
  type TindakanRecord,
} from "@/lib/master/tindakanMock";
import type { TindakanTabKey } from "./katalogTindakanShared";
import TindakanList from "./TindakanList";
import TindakanDetail from "./TindakanDetail";
import TindakanEmptyState from "./TindakanEmptyState";

export default function KatalogTindakanPage() {
  const loaded = useSkeletonDelay();
  const [tab, setTab] = useState<TindakanTabKey>("identitas");

  const crud = useMasterCrud<TindakanRecord>({
    initial: TINDAKAN_MOCK,
    emptyFactory: emptyTindakanRecord,
  });

  const stats = useMemo(() => {
    const total = crud.items.length;
    const aktif = crud.items.filter((t) => (t.status ?? "Aktif") === "Aktif").length;
    const bedah = crud.items.filter((t) =>
      t.kategori === "Bedah_Minor" ||
      t.kategori === "Bedah_Mayor" ||
      t.kategori === "Bedah_Khusus",
    ).length;
    const canggih = crud.items.filter(
      (t) => t.kompleksitas === "Canggih" || t.kompleksitas === "Khusus",
    ).length;
    return { total, aktif, bedah, canggih };
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
    crud.handleDelete(`Hapus tindakan "${crud.selected.nama}"? Aksi ini tidak dapat di-undo.`);
  };

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="teal"
      eyebrow="EHIS Master · Katalog Klinis"
      title="Katalog Tindakan"
      description="Pusat data tindakan medis — identitas ICD-9, kategori, kompleksitas, spesialis & unit default. Source-of-truth untuk Kewenangan Klinis, Layanan Unit, dan Tarif Matrix."
      stats={
        <>
          <StatCard icon={Zap}          label="Total"          value={stats.total}   tone="teal" />
          <StatCard icon={CheckCircle2} label="Aktif"          value={stats.aktif}   tone="emerald" />
          <StatCard icon={Scissors}     label="Bedah"          value={stats.bedah}   tone="amber" />
          <StatCard icon={Star}         label="Khusus/Canggih" value={stats.canggih} tone="amber" />
        </>
      }
      list={
        <TindakanList
          items={crud.items}
          selectedId={crud.selectedId}
          onSelect={handleSelect}
          onAddNew={handleAddNew}
        />
      }
      detail={
        crud.draft ? (
          <TindakanDetail
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
          <TindakanEmptyState totalTindakan={crud.items.length} onAddNew={handleAddNew} />
        )
      }
    />
  );
}
