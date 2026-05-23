"use client";

import { useState, useMemo } from "react";
import { ClipboardList, CheckCircle2, Tag, Activity } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  ASESMEN_KATALOG_MOCK, emptyAsesmenItem,
  type AsesmenItem, type AsesmenKategori,
} from "@/lib/master/asesmenKatalogMock";
import AsesmenList from "./AsesmenList";
import AsesmenDetail from "./AsesmenDetail";
import AsesmenEmptyState from "./AsesmenEmptyState";

export default function AsesmenKatalogPage() {
  const loaded = useSkeletonDelay();
  // Filter kategori juga dipakai untuk pre-set kategori saat add new dari filter aktif
  const [kategoriFilter, setKategoriFilter] = useState<AsesmenKategori | "Semua">("Semua");

  const crud = useMasterCrud<AsesmenItem>({
    initial: ASESMEN_KATALOG_MOCK,
    emptyFactory: () => {
      const base = emptyAsesmenItem();
      if (kategoriFilter !== "Semua") base.kategori = kategoriFilter;
      return base;
    },
  });

  const stats = useMemo(() => {
    const total = crud.items.length;
    const aktif = crud.items.filter((i) => i.status === "Aktif").length;
    const kategoriCount = new Set(crud.items.map((i) => i.kategori)).size;
    const withSnomed = crud.items.filter((i) => !!i.snomedCode).length;
    return { total, aktif, kategoriCount, withSnomed };
  }, [crud.items]);

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="violet"
      eyebrow="EHIS Master · Reference"
      title="Asesmen Katalog"
      description="Library referensi untuk dropdown asesmen klinis: allergen + reaksi, riwayat penyakit, perilaku berisiko, anggota keluarga, metode KB, jenis persalinan. Dikonsumsi AllergyPane · RiwayatPane · AsesmenMedisTab."
      stats={
        <>
          <StatCard icon={ClipboardList} label="Total Item"     value={stats.total}         tone="violet"  />
          <StatCard icon={CheckCircle2}  label="Aktif"          value={stats.aktif}         tone="emerald" />
          <StatCard icon={Tag}           label="Kategori"       value={stats.kategoriCount} tone="sky"     />
          <StatCard icon={Activity}      label="SNOMED Linked"  value={stats.withSnomed}    tone="teal"    />
        </>
      }
      list={
        <AsesmenList
          items={crud.items}
          selectedId={crud.selectedId}
          onSelect={crud.handleSelect}
          onAddNew={crud.handleAddNew}
          kategoriFilter={kategoriFilter}
          onKategoriFilterChange={setKategoriFilter}
        />
      }
      detail={
        crud.draft ? (
          <AsesmenDetail
            draft={crud.draft}
            isNew={crud.isNew}
            isDirty={crud.isDirty}
            onPatch={crud.handlePatch}
            onSave={crud.handleSave}
            onCancel={crud.handleCancel}
            onDelete={
              !crud.isNew
                ? () => crud.handleDelete(`Hapus item "${crud.selected?.nama}"? Aksi ini tidak dapat di-undo.`)
                : undefined
            }
          />
        ) : (
          <AsesmenEmptyState totalItem={crud.items.length} onAddNew={crud.handleAddNew} />
        )
      }
    />
  );
}
