"use client";

import { useState, useMemo } from "react";
import { Activity, CheckCircle2, ListChecks, Layers } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  SKALA_UMUM_MOCK, emptySkalaUmumRecord,
  type SkalaUmumRecord,
} from "@/lib/master/skalaUmumMock";
import {
  SkalaList, SkalaDetail, SkalaEmptyState, type SkalaTabKey,
} from "@/components/master/skala-shared";

// Branding sky untuk Skala Umum (parameter fisiologis dasar).
const ACCENT = "sky" as const;
const ACTIVE_BG       = "bg-sky-50";
const ACTIVE_BORDER_L = "border-l-sky-500";
const ACTIVE_TEXT     = "text-sky-800";
const ACTIVE_AVATAR_BG   = "bg-sky-100";
const ACTIVE_AVATAR_TEXT = "text-sky-700";
const SINGKAT_BADGE   = "bg-sky-50 text-sky-700";

export default function SkalaUmumPage() {
  const loaded = useSkeletonDelay();
  const [tab, setTab] = useState<SkalaTabKey>("identitas");

  const crud = useMasterCrud<SkalaUmumRecord>({
    initial: SKALA_UMUM_MOCK,
    emptyFactory: emptySkalaUmumRecord,
  });

  const stats = useMemo(() => {
    const total = crud.items.length;
    const aktif = crud.items.filter((i) => i.status === "Aktif").length;
    const totalItem = crud.items.reduce((acc, i) => acc + i.items.length, 0);
    const modulSet = new Set<string>();
    crud.items.forEach((i) => i.konsumenModul.forEach((m) => modulSet.add(m)));
    return { total, aktif, totalItem, modulCount: modulSet.size };
  }, [crud.items]);

  const handleSelect = (id: string) => { crud.handleSelect(id); setTab("identitas"); };
  const handleAddNew = () => { crud.handleAddNew(); setTab("identitas"); };
  const handleDelete = () => {
    if (!crud.selected) return;
    crud.handleDelete(`Hapus skala "${crud.selected.nama}"? Aksi ini tidak dapat di-undo.`);
  };

  return (
    <MasterPageLayout
      loaded={loaded}
      accent={ACCENT}
      eyebrow="EHIS Master · Skala Klinis"
      title="Skala Umum"
      description="Master skala penilaian umum: tingkat kesadaran (GCS, Kualitatif, KU), Early Warning Score (NEWS2, MEWS). Dikonsumsi oleh TTVTab semua modul, StatusFisikPane, dan triase IGD."
      stats={
        <>
          <StatCard icon={Activity}     label="Total Skala"  value={stats.total}      tone="sky"     />
          <StatCard icon={CheckCircle2} label="Aktif"        value={stats.aktif}      tone="emerald" />
          <StatCard icon={ListChecks}   label="Total Item"   value={stats.totalItem}  tone="teal"    />
          <StatCard icon={Layers}       label="Modul Pakai"  value={stats.modulCount} tone="violet"  />
        </>
      }
      list={
        <SkalaList
          accent={ACCENT}
          activeBg={ACTIVE_BG}
          activeBorderL={ACTIVE_BORDER_L}
          activeText={ACTIVE_TEXT}
          activeAvatarBg={ACTIVE_AVATAR_BG}
          activeAvatarText={ACTIVE_AVATAR_TEXT}
          addLabel="Tambah Skala Umum"
          items={crud.items}
          selectedId={crud.selectedId}
          onSelect={handleSelect}
          onAddNew={handleAddNew}
        />
      }
      detail={
        crud.draft ? (
          <SkalaDetail
            accent={ACCENT}
            singkatBadge={SINGKAT_BADGE}
            avatarBg={ACTIVE_AVATAR_BG}
            avatarText={ACTIVE_AVATAR_TEXT}
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
          <SkalaEmptyState
            accent={ACCENT}
            icon={Activity}
            title="Pilih skala di kiri"
            description="Atau tambah skala umum baru — cocok untuk parameter fisiologis dasar, tingkat kesadaran, atau early warning score sistem."
            totalItem={crud.items.length}
            totalLabel="skala tersedia"
            addLabel="Tambah Skala Baru"
            onAddNew={handleAddNew}
          />
        )
      }
    />
  );
}
