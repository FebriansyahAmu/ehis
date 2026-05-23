"use client";

import { useState, useMemo } from "react";
import { HeartPulse, CheckCircle2, ListChecks, Layers } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  SKALA_PENYAKIT_MOCK, emptySkalaPenyakitRecord,
  type SkalaPenyakitRecord,
} from "@/lib/master/skalaPenyakitMock";
import {
  SkalaList, SkalaDetail, SkalaEmptyState, type SkalaTabKey,
} from "@/components/master/skala-shared";

// Branding violet untuk Skala Penyakit (klasifikasi spesialistik).
const ACCENT = "violet" as const;
const ACTIVE_BG       = "bg-violet-50";
const ACTIVE_BORDER_L = "border-l-violet-500";
const ACTIVE_TEXT     = "text-violet-800";
const ACTIVE_AVATAR_BG   = "bg-violet-100";
const ACTIVE_AVATAR_TEXT = "text-violet-700";
const SINGKAT_BADGE   = "bg-violet-50 text-violet-700";

export default function SkalaPenyakitPage() {
  const loaded = useSkeletonDelay();
  const [tab, setTab] = useState<SkalaTabKey>("identitas");

  const crud = useMasterCrud<SkalaPenyakitRecord>({
    initial: SKALA_PENYAKIT_MOCK,
    emptyFactory: emptySkalaPenyakitRecord,
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
      title="Skala Penyakit"
      description="Master skala/klasifikasi spesialistik per kondisi: kardiologi (Killip, NYHA, TIMI), onkologi (ECOG, Stadium AJCC), dan lainnya. Dikonsumsi oleh IGD PenilaianTab Kardio + Onko."
      stats={
        <>
          <StatCard icon={HeartPulse}   label="Total Skala"  value={stats.total}      tone="violet"  />
          <StatCard icon={CheckCircle2} label="Aktif"        value={stats.aktif}      tone="emerald" />
          <StatCard icon={ListChecks}   label="Total Item"   value={stats.totalItem}  tone="teal"    />
          <StatCard icon={Layers}       label="Modul Pakai"  value={stats.modulCount} tone="sky"     />
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
          addLabel="Tambah Skala Penyakit"
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
            icon={HeartPulse}
            title="Pilih skala di kiri"
            description="Atau tambah skala penyakit baru — cocok untuk klasifikasi spesialistik per kondisi (kardio, onko, neuro, dll). Definisikan items + interpretasi action plan per stage."
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
