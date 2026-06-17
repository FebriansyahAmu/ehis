"use client";

import { useState, useEffect, useMemo } from "react";
import { Radiation, CheckCircle2, ShieldAlert, Droplets } from "lucide-react";
import {
  MasterPageLayout, StatCard, useMasterCrud, DiscardDialog,
} from "@/components/master/shared";
import {
  emptyRadCatalogRecord,
  type RadCatalogRecord, type RadModalitas, type RadRegion, type RadKategori, type RadStatus,
} from "@/lib/master/radCatalogMock";
import {
  listRadCatalog, createRadCatalog, updateRadCatalog, deleteRadCatalog, type RadCatalogDTO,
} from "@/lib/api/master/radCatalog";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import { hasDRLConfig, usesKontras, type RadTabKey } from "./katalogRadiologiShared";
import RadiologiList from "./RadiologiList";
import RadiologiDetail from "./RadiologiDetail";
import RadiologiEmptyState from "./RadiologiEmptyState";

const PAGE_LIMIT = 500; // katalog kecil (input manual) → muat sekali, filter di klien

// DTO server → record FE (bentuk identik; cast enum union).
function dtoToItem(d: RadCatalogDTO): RadCatalogRecord {
  return {
    id: d.id,
    kode: d.kode,
    kodeIcd: d.kodeIcd,
    nama: d.nama,
    modalitas: d.modalitas as RadModalitas,
    modalitasSubtype: d.modalitasSubtype,
    region: d.region as RadRegion,
    kategori: d.kategori as RadKategori,
    estimasiWaktuMenit: d.estimasiWaktuMenit,
    tatTargetMenit: d.tatTargetMenit,
    persiapan: d.persiapan,
    kontras: d.kontras,
    drlReferensi: d.drlReferensi,
    reportingTemplate: d.reportingTemplate,
    deskripsi: d.deskripsi,
    status: d.status as RadStatus,
  };
}

// Record draft → payload create/update (kode TIDAK dikirim — auto-gen server).
function draftToInput(d: RadCatalogRecord) {
  return {
    nama: d.nama,
    kodeIcd: d.kodeIcd || undefined,
    modalitas: d.modalitas,
    modalitasSubtype: d.modalitasSubtype || undefined,
    region: d.region,
    kategori: d.kategori,
    estimasiWaktuMenit: d.estimasiWaktuMenit,
    tatTarget: d.tatTargetMenit,
    persiapan: d.persiapan,
    kontras: d.kontras,
    drlReferensi: d.drlReferensi ?? null,
    reportingTemplate: d.reportingTemplate,
    deskripsi: d.deskripsi || undefined,
    status: d.status,
  };
}

interface Props {
  initial: RadCatalogDTO[];
  prefetched: boolean;
}

export default function KatalogRadiologiPage({ initial, prefetched }: Props) {
  const [tab, setTab] = useState<RadTabKey>("identitas");
  const [listLoaded, setListLoaded] = useState(prefetched);
  // Aksi tertunda menunggu konfirmasi "buang perubahan" (gate DiscardDialog).
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  // Seed sekali dari SSR (DTO→record). CUD berikutnya lewat /api (commit/removeLocal).
  const [seed] = useState(() => initial.map(dtoToItem));
  const crud = useMasterCrud<RadCatalogRecord>({
    initial: seed,
    emptyFactory: emptyRadCatalogRecord,
    confirmDirty: () => true, // matikan window.confirm bawaan → konfirmasi via DiscardDialog
  });

  // Fallback fetch bila SSR gagal prefetch (degradasi anggun).
  useEffect(() => {
    if (prefetched) return;
    const ac = new AbortController();
    listRadCatalog({ limit: PAGE_LIMIT }, ac.signal)
      .then(({ items }) => crud.setItems(items.map(dtoToItem)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat katalog radiologi", e instanceof ApiError ? e.message : undefined);
      })
      .finally(() => setListLoaded(true));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetched]);

  function guardDirty(action: () => void) {
    if (crud.isDirty) setPendingNav(() => action);
    else action();
  }

  const stats = useMemo(() => {
    const total   = crud.items.length;
    const aktif   = crud.items.filter((i) => i.status === "Aktif").length;
    const drl     = crud.items.filter(hasDRLConfig).length;
    const kontras = crud.items.filter(usesKontras).length;
    return { total, aktif, drl, kontras };
  }, [crud.items]);

  const handleSelect = (id: string) =>
    guardDirty(() => { crud.handleSelect(id); setTab("identitas"); });
  const handleAddNew = () =>
    guardDirty(() => { crud.handleAddNew(); setTab("identitas"); });
  const handleCancel = () => guardDirty(() => crud.handleCancel());

  async function handleSave() {
    const d = crud.draft;
    if (!d) return;
    const isNew = crud.isNew;
    try {
      const dto = isNew
        ? await createRadCatalog(draftToInput(d))
        : await updateRadCatalog(d.id, draftToInput(d));
      crud.commit(dtoToItem(dto));
      toast.success(isNew ? "Pemeriksaan ditambahkan" : "Pemeriksaan diperbarui", `${dto.kode} · ${dto.nama}`);
    } catch (e) {
      toast.error("Gagal menyimpan pemeriksaan", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDelete() {
    const sel = crud.selected;
    if (!sel) return;
    if (!window.confirm(`Hapus pemeriksaan "${sel.nama}"? Aksi ini tidak dapat di-undo.`)) return;
    try {
      await deleteRadCatalog(sel.id);
      crud.removeLocal(sel.id);
      toast.success("Pemeriksaan dihapus", `${sel.kode} · ${sel.nama}`);
    } catch (e) {
      toast.error("Gagal menghapus pemeriksaan", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <>
      <MasterPageLayout
        loaded={listLoaded}
        accent="rose"
        eyebrow="EHIS Master · Katalog Klinis"
        title="Katalog Radiologi"
        description="Pemeriksaan per modalitas (FHIR SatuSehat) + protap persiapan, kontras, Diagnostic Reference Level (DRL), dan reporting template terstandar. Kode RAD-NNNN dibuat otomatis. Standar PMK 1014/2008 · BAPETEN No. 2/2018 · ACR."
        stats={
          <>
            <StatCard icon={Radiation}    label="Total"         value={stats.total}   tone="rose" />
            <StatCard icon={CheckCircle2} label="Aktif"         value={stats.aktif}   tone="emerald" />
            <StatCard icon={ShieldAlert}  label="Dengan DRL"    value={stats.drl}     tone="amber" />
            <StatCard icon={Droplets}     label="Pakai Kontras" value={stats.kontras} tone="sky" />
          </>
        }
        list={
          <RadiologiList
            items={crud.items}
            selectedId={crud.selectedId}
            onSelect={handleSelect}
            onAddNew={handleAddNew}
          />
        }
        detail={
          crud.draft ? (
            <RadiologiDetail
              draft={crud.draft}
              isNew={crud.isNew}
              isDirty={crud.isDirty}
              tab={tab}
              onTabChange={setTab}
              onPatch={crud.handlePatch}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={!crud.isNew ? handleDelete : undefined}
            />
          ) : (
            <RadiologiEmptyState totalItem={crud.items.length} onAddNew={handleAddNew} />
          )
        }
      />
      <DiscardDialog
        open={!!pendingNav}
        message="Perubahan pemeriksaan radiologi yang belum disimpan akan hilang."
        onConfirm={() => { const a = pendingNav; setPendingNav(null); a?.(); }}
        onCancel={() => setPendingNav(null)}
      />
    </>
  );
}
