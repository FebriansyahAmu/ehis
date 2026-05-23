"use client";

import { useState, useMemo, useCallback } from "react";
import { BookText, CheckCircle2, Stethoscope, Library } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  ICD_MOCK, emptyIcdItem,
  type IcdItem, type IcdJenis,
} from "@/lib/master/icdMock";
import IcdList from "./IcdList";
import IcdDetail from "./IcdDetail";
import IcdEmptyState from "./IcdEmptyState";
import ImportExcelModal from "./import/ImportExcelModal";

export default function IcdPage() {
  const loaded = useSkeletonDelay();
  // Switcher utama: ICD-10 vs ICD-9. List & add-new mengikuti jenis aktif.
  const [activeJenis, setActiveJenis] = useState<IcdJenis>("ICD-10");
  const [importOpen, setImportOpen] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const crud = useMasterCrud<IcdItem>({
    initial: ICD_MOCK,
    emptyFactory: () => emptyIcdItem(activeJenis),
  });

  const handleImportCommit = useCallback((items: IcdItem[]) => {
    crud.setItems((prev) => [...items, ...prev]);
    setImportNotice(`${items.length} kode berhasil ditambahkan ke katalog (sesi ini).`);
    // Auto-dismiss notice setelah 6 detik
    window.setTimeout(() => setImportNotice(null), 6000);
  }, [crud]);

  const stats = useMemo(() => {
    const icd10 = crud.items.filter((i) => i.jenis === "ICD-10").length;
    const icd9 = crud.items.filter((i) => i.jenis === "ICD-9").length;
    const aktif = crud.items.filter((i) => i.status === "Aktif").length;
    const chapters = new Set(crud.items.map((i) => `${i.jenis}::${i.chapter}`)).size;
    return { icd10, icd9, aktif, chapters };
  }, [crud.items]);

  return (
    <>
    <MasterPageLayout
      loaded={loaded}
      accent="sky"
      eyebrow="EHIS Master · Reference"
      title="ICD-10 & ICD-9-CM"
      description="Katalog diagnosis (ICD-10 WHO) dan prosedur klinis (ICD-9-CM CDC). Dikonsumsi DiagnosaTab semua modul + INA-CBG mapping. Mock representative ~80 ICD-10 / ~30 ICD-9 — import CSV full dataset saat backend siap."
      stats={
        <>
          <StatCard icon={BookText}     label="ICD-10"    value={stats.icd10}    tone="sky"     />
          <StatCard icon={Stethoscope}  label="ICD-9-CM"  value={stats.icd9}     tone="amber"   />
          <StatCard icon={CheckCircle2} label="Aktif"     value={stats.aktif}    tone="emerald" />
          <StatCard icon={Library}      label="Chapters"  value={stats.chapters} tone="violet"  />
        </>
      }
      list={
        <IcdList
          items={crud.items}
          selectedId={crud.selectedId}
          onSelect={crud.handleSelect}
          onAddNew={crud.handleAddNew}
          activeJenis={activeJenis}
          onJenisChange={setActiveJenis}
          onImport={() => setImportOpen(true)}
          importNotice={importNotice}
          onDismissNotice={() => setImportNotice(null)}
        />
      }
      detail={
        crud.draft ? (
          <IcdDetail
            draft={crud.draft}
            isNew={crud.isNew}
            isDirty={crud.isDirty}
            onPatch={crud.handlePatch}
            onSave={crud.handleSave}
            onCancel={crud.handleCancel}
            onDelete={
              !crud.isNew
                ? () => crud.handleDelete(`Hapus kode "${crud.selected?.kode}"? Aksi ini tidak dapat di-undo.`)
                : undefined
            }
          />
        ) : (
          <IcdEmptyState totalItem={crud.items.length} onAddNew={crud.handleAddNew} jenis={activeJenis} />
        )
      }
    />
    <ImportExcelModal
      open={importOpen}
      onClose={() => setImportOpen(false)}
      onCommit={handleImportCommit}
      existingItems={crud.items}
      defaultJenis={activeJenis}
    />
    </>
  );
}
