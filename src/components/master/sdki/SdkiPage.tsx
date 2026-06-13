"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, CheckCircle2, Layers, Workflow } from "lucide-react";
import { MasterPageLayout, StatCard, useMasterCrud } from "@/components/master/shared";
import {
  emptySdkiItem, countSdkiIntervensi,
  type SdkiItem, type SdkiKategori, type SdkiJenis, type SdkiStatus,
} from "@/lib/master/sdkiMock";
import {
  listSdki, createSdki, updateSdki, deleteSdki, type SdkiDTO,
} from "@/lib/api/master/sdki";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import SdkiList from "./SdkiList";
import SdkiDetail from "./SdkiDetail";
import SdkiEmptyState from "./SdkiEmptyState";
import DiscardDialog from "./DiscardDialog";
import type { SdkiTabKey } from "./sdkiShared";

const PAGE_LIMIT = 300; // katalog kecil (input manual) → muat sekali, filter di klien

// DTO server → item FE (bentuk identik; cast enum union).
function dtoToItem(d: SdkiDTO): SdkiItem {
  return {
    id: d.id,
    kode: d.kode,
    nama: d.nama,
    kategori: d.kategori as SdkiKategori,
    subKategori: d.subKategori,
    jenis: d.jenis as SdkiJenis,
    penyebabUmum: d.penyebabUmum,
    faktorResiko: d.faktorResiko,
    dataMayor: d.dataMayor,
    dataMinor: d.dataMinor,
    kriteriaHasil: d.kriteriaHasil,
    intervensi: d.intervensi,
    status: d.status as SdkiStatus,
  };
}

// Item draft → payload create/update (kode TIDAK dikirim — auto-gen server).
function draftToInput(d: SdkiItem) {
  return {
    nama: d.nama,
    kategori: d.kategori,
    subKategori: d.subKategori || undefined,
    jenis: d.jenis,
    penyebabUmum: d.penyebabUmum || undefined,
    faktorResiko: d.faktorResiko || undefined,
    dataMayor: d.dataMayor,
    dataMinor: d.dataMinor,
    kriteriaHasil: d.kriteriaHasil,
    intervensi: d.intervensi,
    status: d.status,
  };
}

interface Props {
  initial: SdkiDTO[];
  prefetched: boolean;
}

export default function SdkiPage({ initial, prefetched }: Props) {
  const [tab, setTab] = useState<SdkiTabKey>("identitas");
  const [listLoaded, setListLoaded] = useState(prefetched);
  // Aksi tertunda yang menunggu konfirmasi "buang perubahan" (gate DiscardDialog).
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  // Seed sekali dari SSR (DTO→item). CUD berikutnya lewat /api (commit/removeLocal).
  const [seed] = useState(() => initial.map(dtoToItem));
  const crud = useMasterCrud<SdkiItem>({
    initial: seed,
    emptyFactory: emptySdkiItem,
    confirmDirty: () => true, // matikan window.confirm bawaan → konfirmasi via DiscardDialog
  });

  // Fallback fetch bila SSR gagal prefetch (degradasi anggun).
  useEffect(() => {
    if (prefetched) return;
    const ac = new AbortController();
    listSdki({ limit: PAGE_LIMIT }, ac.signal)
      .then(({ items }) => crud.setItems(items.map(dtoToItem)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat katalog keperawatan", e instanceof ApiError ? e.message : undefined);
      })
      .finally(() => setListLoaded(true));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetched]);

  // Jalankan aksi langsung bila form bersih; bila dirty → tahan & minta konfirmasi.
  function guardDirty(action: () => void) {
    if (crud.isDirty) setPendingNav(() => action);
    else action();
  }

  const stats = useMemo(() => {
    const total = crud.items.length;
    const aktif = crud.items.filter((i) => i.status === "Aktif").length;
    const totalIntervensi = crud.items.reduce((acc, i) => acc + countSdkiIntervensi(i), 0);
    const totalKriteria = crud.items.reduce((acc, i) => acc + i.kriteriaHasil.length, 0);
    return { total, aktif, totalIntervensi, totalKriteria };
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
        ? await createSdki(draftToInput(d))
        : await updateSdki(d.id, draftToInput(d));
      crud.commit(dtoToItem(dto));
      toast.success(isNew ? "Diagnosa ditambahkan" : "Diagnosa diperbarui", `${dto.kode} · ${dto.nama}`);
    } catch (e) {
      toast.error("Gagal menyimpan diagnosa", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDelete() {
    const sel = crud.selected;
    if (!sel) return;
    if (!window.confirm(`Hapus diagnosa "${sel.kode} ${sel.nama}"? Aksi ini tidak dapat di-undo.`)) return;
    try {
      await deleteSdki(sel.id);
      crud.removeLocal(sel.id);
      toast.success("Diagnosa dihapus", `${sel.kode} · ${sel.nama}`);
    } catch (e) {
      toast.error("Gagal menghapus diagnosa", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <>
      <MasterPageLayout
        loaded={listLoaded}
        accent="rose"
        eyebrow="EHIS Master · Katalog Klinis"
        title="Katalog Keperawatan"
        description="Katalog diagnosa keperawatan (SDKI) + luaran (SLKI) + intervensi (SIKI) standar PPNI. Dikonsumsi KeperawatanTab RI sebagai template asuhan. Kode D.NNNN dibuat otomatis."
        stats={
          <>
            <StatCard icon={ClipboardList} label="Total Diagnosa"  value={stats.total}         tone="rose"    />
            <StatCard icon={CheckCircle2}  label="Aktif"           value={stats.aktif}         tone="emerald" />
            <StatCard icon={Layers}        label="Kriteria SLKI"   value={stats.totalKriteria} tone="sky"     />
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
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={!crud.isNew ? handleDelete : undefined}
            />
          ) : (
            <SdkiEmptyState totalItem={crud.items.length} onAddNew={handleAddNew} />
          )
        }
      />
      <DiscardDialog
        open={!!pendingNav}
        message="Perubahan diagnosa keperawatan yang belum disimpan akan hilang."
        onConfirm={() => { const a = pendingNav; setPendingNav(null); a?.(); }}
        onCancel={() => setPendingNav(null)}
      />
    </>
  );
}
