"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap, CheckCircle2, Scissors, Star } from "lucide-react";
import { MasterPageLayout, StatCard, useMasterCrud } from "@/components/master/shared";
import { emptyTindakanRecord, type TindakanRecord } from "@/lib/master/tindakanMock";
import type { SpesialisCode } from "@/components/master/dokter/dokterShared";
import {
  listTindakan, createTindakan, updateTindakan, deleteTindakan,
  type TindakanDTO,
} from "@/lib/api/master/tindakan";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import type { TindakanTabKey } from "./katalogTindakanShared";
import TindakanList from "./TindakanList";
import TindakanDetail from "./TindakanDetail";
import TindakanEmptyState from "./TindakanEmptyState";
import DiscardDialog from "./DiscardDialog";

const PAGE_LIMIT = 200; // katalog kecil (input manual) → muat sekali, filter di klien

// DTO server → record FE. `spesialisDefault` di-narrow ke SpesialisCode[] (kode yang sama).
function dtoToRecord(d: TindakanDTO): TindakanRecord {
  return {
    id: d.id,
    kode: d.kode,
    nama: d.nama,
    kategori: d.kategori,
    kptlAktif: d.kptlAktif,
    nomorKptl: d.nomorKptl ?? null,
    kompleksitas: d.kompleksitas ?? null,
    spesialisDefault: d.spesialisDefault as SpesialisCode[],
    unitDefault: d.unitDefault,
    deskripsi: d.deskripsi,
    status: d.status,
  };
}

// Record draft → payload create/update (bentuk kompatibel kedua input).
function draftToInput(d: TindakanRecord) {
  return {
    nama: d.nama,
    kode: d.kode || undefined,
    kategori: d.kategori,
    kptlAktif: d.kptlAktif ?? false,
    nomorKptl: d.nomorKptl ?? null,
    kompleksitas: d.kompleksitas ?? null,
    spesialisDefault: d.spesialisDefault,
    unitDefault: d.unitDefault,
    deskripsi: d.deskripsi || undefined,
    status: d.status ?? "Aktif",
  };
}

interface Props {
  initial: TindakanDTO[];
  prefetched: boolean;
}

export default function KatalogTindakanPage({ initial, prefetched }: Props) {
  const [tab, setTab] = useState<TindakanTabKey>("identitas");
  const [listLoaded, setListLoaded] = useState(prefetched);
  // Aksi tertunda yang menunggu konfirmasi "buang perubahan" (gate DiscardDialog).
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  // Seed sekali dari SSR (di-map DTO→record). CUD berikutnya lewat /api (commit/removeLocal).
  const [seed] = useState(() => initial.map(dtoToRecord));
  const crud = useMasterCrud<TindakanRecord>({
    initial: seed,
    emptyFactory: emptyTindakanRecord,
    confirmDirty: () => true, // matikan window.confirm bawaan → konfirmasi via DiscardDialog
  });

  // Fallback fetch bila SSR gagal prefetch (degradasi anggun).
  useEffect(() => {
    if (prefetched) return;
    const ac = new AbortController();
    listTindakan({ limit: PAGE_LIMIT }, ac.signal)
      .then(({ items }) => crud.setItems(items.map(dtoToRecord)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat katalog tindakan", e instanceof ApiError ? e.message : undefined);
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

  const handleSelect = (id: string) =>
    guardDirty(() => {
      crud.handleSelect(id);
      setTab("identitas");
    });
  const handleAddNew = () =>
    guardDirty(() => {
      crud.handleAddNew();
      setTab("identitas");
    });
  const handleCancel = () => guardDirty(() => crud.handleCancel());

  async function handleSave() {
    const d = crud.draft;
    if (!d) return;
    const isNew = crud.isNew;
    try {
      const dto = isNew
        ? await createTindakan(draftToInput(d))
        : await updateTindakan(d.id, draftToInput(d));
      crud.commit(dtoToRecord(dto));
      toast.success(isNew ? "Tindakan ditambahkan" : "Tindakan diperbarui", dto.nama);
    } catch (e) {
      toast.error("Gagal menyimpan tindakan", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDelete() {
    const sel = crud.selected;
    if (!sel) return;
    if (!window.confirm(`Hapus tindakan "${sel.nama}"? Aksi ini tidak dapat di-undo.`)) return;
    try {
      await deleteTindakan(sel.id);
      crud.removeLocal(sel.id);
      toast.success("Tindakan dihapus", sel.nama);
    } catch (e) {
      toast.error("Gagal menghapus tindakan", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <>
      <MasterPageLayout
        loaded={listLoaded}
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
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={!crud.isNew ? handleDelete : undefined}
            />
          ) : (
            <TindakanEmptyState totalTindakan={crud.items.length} onAddNew={handleAddNew} />
          )
        }
      />
      <DiscardDialog
        open={!!pendingNav}
        message="Perubahan tindakan yang belum disimpan akan hilang."
        onConfirm={() => { const a = pendingNav; setPendingNav(null); a?.(); }}
        onCancel={() => setPendingNav(null)}
      />
    </>
  );
}
