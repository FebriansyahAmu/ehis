"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, CheckCircle2, Tag, Activity } from "lucide-react";
import {
  MasterPageLayout, StatCard, useMasterCrud,
} from "@/components/master/shared";
import {
  emptyAsesmenItem,
  type AsesmenItem, type AsesmenKategori,
} from "@/lib/master/asesmenKatalogMock";
import {
  listAsesmenKatalog, createAsesmenKatalog, updateAsesmenKatalog, deleteAsesmenKatalog,
  type AsesmenItemDTO,
} from "@/lib/api/master/asesmenKatalog";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import AsesmenList from "./AsesmenList";
import AsesmenDetail from "./AsesmenDetail";
import AsesmenEmptyState from "./AsesmenEmptyState";

// DTO server → record FE (bentuk identik).
function dtoToItem(d: AsesmenItemDTO): AsesmenItem {
  return {
    id: d.id,
    kode: d.kode,
    nama: d.nama,
    kategori: d.kategori,
    deskripsi: d.deskripsi,
    snomedCode: d.snomedCode,
    severityDefault: d.severityDefault,
    status: d.status,
  };
}

// Draft → payload create (kode TIDAK dikirim — auto-gen <PREFIX>-NNN di server).
function draftToCreateInput(d: AsesmenItem) {
  return {
    nama: d.nama,
    kategori: d.kategori,
    deskripsi: d.deskripsi || undefined,
    snomedCode: d.snomedCode || undefined,
    severityDefault: d.kategori === "ReaksiAlergi" ? d.severityDefault : undefined,
    status: d.status,
  };
}

// Draft → payload update parsial (kode & kategori immutable).
function draftToUpdateInput(d: AsesmenItem) {
  return {
    nama: d.nama,
    deskripsi: d.deskripsi || undefined,
    // "" → kosongkan SNOMED; hanya relevan kategori allergen.
    snomedCode: d.kategori.startsWith("Allergen") ? (d.snomedCode ?? "") : undefined,
    severityDefault: d.kategori === "ReaksiAlergi" ? d.severityDefault : undefined,
    status: d.status,
  };
}

interface Props {
  initial: AsesmenItemDTO[];
  prefetched: boolean;
}

export default function AsesmenKatalogPage({ initial, prefetched }: Props) {
  const [listLoaded, setListLoaded] = useState(prefetched);
  // Filter kategori juga dipakai untuk pre-set kategori saat add new dari filter aktif.
  const [kategoriFilter, setKategoriFilter] = useState<AsesmenKategori | "Semua">("Semua");

  // Seed sekali dari SSR (DTO→record). CUD berikutnya lewat /api (commit/removeLocal).
  const [seed] = useState(() => initial.map(dtoToItem));
  const crud = useMasterCrud<AsesmenItem>({
    initial: seed,
    emptyFactory: () => {
      const base = emptyAsesmenItem();
      if (kategoriFilter !== "Semua") base.kategori = kategoriFilter;
      return base;
    },
  });

  // Fallback fetch bila SSR gagal prefetch (degradasi anggun).
  useEffect(() => {
    if (prefetched) return;
    const ac = new AbortController();
    listAsesmenKatalog({ limit: 500 }, ac.signal)
      .then((items) => crud.setItems(items.map(dtoToItem)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat asesmen katalog", e instanceof ApiError ? e.message : undefined);
      })
      .finally(() => setListLoaded(true));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetched]);

  const stats = useMemo(() => {
    const total = crud.items.length;
    const aktif = crud.items.filter((i) => i.status === "Aktif").length;
    const kategoriCount = new Set(crud.items.map((i) => i.kategori)).size;
    const withSnomed = crud.items.filter((i) => !!i.snomedCode).length;
    return { total, aktif, kategoriCount, withSnomed };
  }, [crud.items]);

  async function handleSave() {
    const d = crud.draft;
    if (!d) return;
    const isNew = crud.isNew;
    try {
      const dto = isNew
        ? await createAsesmenKatalog(draftToCreateInput(d))
        : await updateAsesmenKatalog(d.id, draftToUpdateInput(d));
      crud.commit(dtoToItem(dto));
      toast.success(isNew ? "Item ditambahkan" : "Item diperbarui", `${dto.kode} · ${dto.nama}`);
    } catch (e) {
      toast.error("Gagal menyimpan item", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDelete() {
    const sel = crud.selected;
    if (!sel) return;
    if (!window.confirm(`Hapus item "${sel.nama}"? Aksi ini tidak dapat di-undo.`)) return;
    try {
      await deleteAsesmenKatalog(sel.id);
      crud.removeLocal(sel.id);
      toast.success("Item dihapus", `${sel.kode} · ${sel.nama}`);
    } catch (e) {
      toast.error("Gagal menghapus item", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <MasterPageLayout
      loaded={listLoaded}
      accent="violet"
      eyebrow="EHIS Master · Reference"
      title="Asesmen Katalog"
      description="Library referensi untuk dropdown asesmen klinis, dikelompokkan per sub-tab yang mengonsumsinya: Alergi (allergen + reaksi) · Riwayat Medis (penyakit, perilaku, keluarga, KB, persalinan). Kode dibuat otomatis per kategori. Dikonsumsi AllergyPane · RiwayatPane di AsesmenMedisTab."
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
            onSave={handleSave}
            onCancel={crud.handleCancel}
            onDelete={!crud.isNew ? handleDelete : undefined}
          />
        ) : (
          <AsesmenEmptyState totalItem={crud.items.length} onAddNew={crud.handleAddNew} />
        )
      }
    />
  );
}
