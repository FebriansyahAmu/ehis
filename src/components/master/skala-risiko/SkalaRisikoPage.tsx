"use client";

import { useState, useMemo } from "react";
import { Gauge, CheckCircle2, ListChecks, Layers } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  SKALA_RISIKO_MOCK, emptySkalaRisikoRecord,
  type SkalaRisikoRecord,
} from "@/lib/master/skalaRisikoMock";
import {
  SkalaList, SkalaDetail, SkalaEmptyState, type SkalaTabKey,
} from "@/components/master/skala-shared";

// Branding teal untuk Skala Risiko (akreditasi medis).
const ACCENT = "teal" as const;
const ACTIVE_BG       = "bg-teal-50";
const ACTIVE_BORDER_L = "border-l-teal-500";
const ACTIVE_TEXT     = "text-teal-800";
const ACTIVE_AVATAR_BG   = "bg-teal-100";
const ACTIVE_AVATAR_TEXT = "text-teal-700";
const SINGKAT_BADGE   = "bg-teal-50 text-teal-700";

export default function SkalaRisikoPage() {
  const loaded = useSkeletonDelay();
  const [tab, setTab] = useState<SkalaTabKey>("identitas");

  const crud = useMasterCrud<SkalaRisikoRecord>({
    initial: SKALA_RISIKO_MOCK,
    emptyFactory: emptySkalaRisikoRecord,
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
      title="Skala Risiko"
      description="Master skala penilaian risiko klinis tervalidasi. Dikonsumsi oleh IGD PenilaianTab, RI PenilaianRisikoPane, dan RJ skrining. Standar: Mahoney 1965 · Morse 1989 · Braden 1987 · BAPEN MUST."
      stats={
        <>
          <StatCard icon={Gauge}        label="Total Skala"  value={stats.total}      tone="teal"    />
          <StatCard icon={CheckCircle2} label="Aktif"        value={stats.aktif}      tone="emerald" />
          <StatCard icon={ListChecks}   label="Total Item"   value={stats.totalItem}  tone="sky"     />
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
          addLabel="Tambah Skala Risiko"
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
            icon={Gauge}
            title="Pilih skala di kiri"
            description="Atau tambah skala risiko baru — lengkapi identitas, daftar item penilaian dengan opsi skor, dan threshold interpretasi (action plan per range)."
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
