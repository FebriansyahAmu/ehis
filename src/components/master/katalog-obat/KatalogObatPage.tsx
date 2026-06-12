"use client";

import { useState, useMemo } from "react";
import { Pill, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay, DiscardDialog,
} from "@/components/master/shared";
import {
  type ObatRecord,
  OBAT_MOCK, emptyObatRecord,
} from "@/lib/master/obatMock";
import { fmtIDR, type TabKey } from "./katalogObatShared";
import ObatList from "./ObatList";
import ObatDetail from "./ObatDetail";
import ObatEmptyState from "./ObatEmptyState";

export default function KatalogObatPage() {
  const loaded = useSkeletonDelay();
  const [tab, setTab] = useState<TabKey>("identitas");
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  const crud = useMasterCrud<ObatRecord>({
    initial: OBAT_MOCK,
    emptyFactory: emptyObatRecord,
    confirmDirty: () => true, // konfirmasi via DiscardDialog (bukan window.confirm)
  });

  function guardDirty(action: () => void) {
    if (crud.isDirty) setPendingNav(() => action);
    else action();
  }

  const stats = useMemo(() => {
    const total = crud.items.length;
    const form = crud.items.filter((o) => o.isFormularium).length;
    const ham = crud.items.filter((o) => o.isHAM).length;
    const narpsi = crud.items.filter(
      (o) => o.golongan?.startsWith("Narkotika") || o.golongan?.startsWith("Psikotropika"),
    ).length;
    const avgHarga = total
      ? Math.round(crud.items.reduce((sum, o) => sum + (o.hargaSatuan ?? 0), 0) / total)
      : 0;
    return { total, form, hamNarpsi: ham + narpsi, avgHarga };
  }, [crud.items]);

  const handleSelect = (id: string) =>
    guardDirty(() => { crud.handleSelect(id); setTab("identitas"); });
  const handleAddNew = () =>
    guardDirty(() => { crud.handleAddNew(); setTab("identitas"); });
  const handleCancel = () => guardDirty(() => crud.handleCancel());
  const handleDelete = () => {
    if (!crud.selected) return;
    crud.handleDelete(`Hapus obat "${crud.selected.namaGenerik}"? Aksi ini tidak dapat di-undo.`);
  };

  return (
    <>
    <MasterPageLayout
      loaded={loaded}
      accent="violet"
      eyebrow="EHIS Master · Katalog Klinis"
      title="Katalog Obat"
      description="Pusat data obat — identitas, klasifikasi (Formularium / HAM / LASA / Narkotika-Psikotropika), informasi klinis, harga & coverage. Source-of-truth untuk farmasi, resep, dan billing."
      stats={
        <>
          <StatCard icon={Pill}        label="Total"        value={stats.total}                tone="violet" />
          <StatCard icon={Sparkles}    label="Formularium"  value={stats.form}                 tone="emerald" />
          <StatCard icon={ShieldAlert} label="HAM + Nar/Psi" value={stats.hamNarpsi}           tone="rose" />
          <StatCard icon={Wallet}      label="Avg Harga"    value={fmtIDR(stats.avgHarga)}     tone="amber" />
        </>
      }
      list={
        <ObatList
          items={crud.items}
          selectedId={crud.selectedId}
          onSelect={handleSelect}
          onAddNew={handleAddNew}
        />
      }
      detail={
        crud.draft ? (
          <ObatDetail
            draft={crud.draft}
            isNew={crud.isNew}
            isDirty={crud.isDirty}
            tab={tab}
            onTabChange={setTab}
            onPatch={crud.handlePatch}
            onSave={crud.handleSave}
            onCancel={handleCancel}
            onDelete={!crud.isNew ? handleDelete : undefined}
          />
        ) : (
          <ObatEmptyState totalObat={crud.items.length} onAddNew={handleAddNew} />
        )
      }
    />
    <DiscardDialog
      open={!!pendingNav}
      message="Perubahan obat yang belum disimpan akan hilang."
      onConfirm={() => { const a = pendingNav; setPendingNav(null); a?.(); }}
      onCancel={() => setPendingNav(null)}
    />
    </>
  );
}
