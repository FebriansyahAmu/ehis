"use client";

import { useState, useMemo } from "react";
import { ClipboardList, Layers, Stethoscope, Power } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  TEMPLATE_ANAMNESIS_MOCK, emptyTemplateAnamnesis,
  type TemplateAnamnesisItem,
  countByContext,
} from "@/lib/master/templateAnamnesisMock";
import TemplateAnamnesisList from "./TemplateAnamnesisList";
import TemplateAnamnesisDetail from "./TemplateAnamnesisDetail";
import TemplateAnamnesisEmptyState from "./TemplateAnamnesisEmptyState";
import type { TemplateTabKey } from "./templateAnamnesisShared";

export default function TemplateAnamnesisPage() {
  const loaded = useSkeletonDelay();
  const [activeTab, setActiveTab] = useState<TemplateTabKey>("identitas");

  const crud = useMasterCrud<TemplateAnamnesisItem>({
    initial: TEMPLATE_ANAMNESIS_MOCK,
    emptyFactory: emptyTemplateAnamnesis,
  });

  const stats = useMemo(() => {
    const igd = countByContext(crud.items, "IGD");
    const ri = countByContext(crud.items, "RI");
    const rj = countByContext(crud.items, "RJ");
    const aktif = crud.items.filter((t) => t.status === "Aktif").length;
    return { igd, ri, rj, aktif };
  }, [crud.items]);

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="teal"
      eyebrow="EHIS Master · Template & Enum"
      title="Template Anamnesis"
      description="Koleksi template anamnesis pre-fill untuk AnamnesisPane IGD/RI/RJ. Setiap template punya context tag — sehingga picker template di workflow hanya menampilkan template relevan dengan modul aktif."
      stats={
        <>
          <StatCard icon={Layers}      label="Total"  value={crud.items.length}  tone="teal"    />
          <StatCard icon={Stethoscope} label="IGD"    value={stats.igd}          tone="rose"    />
          <StatCard icon={ClipboardList} label="RI"   value={stats.ri}           tone="violet"  />
          <StatCard icon={Power}       label="Aktif"  value={stats.aktif}        tone="emerald" />
        </>
      }
      list={
        <TemplateAnamnesisList
          items={crud.items}
          selectedId={crud.selectedId}
          onSelect={crud.handleSelect}
          onAddNew={() => { crud.handleAddNew(); setActiveTab("identitas"); }}
        />
      }
      detail={
        crud.draft ? (
          <TemplateAnamnesisDetail
            draft={crud.draft}
            isNew={crud.isNew}
            isDirty={crud.isDirty}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onPatch={(k, v) => crud.handlePatch({ [k]: v } as Partial<TemplateAnamnesisItem>)}
            onSave={crud.handleSave}
            onCancel={crud.handleCancel}
            onDelete={
              !crud.isNew
                ? () =>
                    crud.handleDelete(
                      `Hapus template "${crud.selected?.label}"? Aksi ini tidak dapat di-undo.`,
                    )
                : undefined
            }
          />
        ) : (
          <TemplateAnamnesisEmptyState
            totalItem={crud.items.length}
            onAddNew={() => { crud.handleAddNew(); setActiveTab("identitas"); }}
          />
        )
      }
    />
  );
}
