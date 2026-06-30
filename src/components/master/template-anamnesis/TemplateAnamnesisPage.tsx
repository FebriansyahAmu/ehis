"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Layers, Stethoscope, Power } from "lucide-react";
import { MasterPageLayout, StatCard, useMasterCrud } from "@/components/master/shared";
import {
  emptyTemplateAnamnesis, countByContext,
  type TemplateAnamnesisItem,
} from "@/lib/master/templateAnamnesisMock";
import {
  listTemplateAnamnesis, createTemplateAnamnesis, updateTemplateAnamnesis,
  deleteTemplateAnamnesis, type TemplateAnamnesisDTO,
} from "@/lib/api/master/templateAnamnesis";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import TemplateAnamnesisList from "./TemplateAnamnesisList";
import TemplateAnamnesisDetail from "./TemplateAnamnesisDetail";
import TemplateAnamnesisEmptyState from "./TemplateAnamnesisEmptyState";
import type { TemplateTabKey } from "./templateAnamnesisShared";

const PAGE_LIMIT = 300; // katalog kecil (input manual) → muat sekali, filter di klien

// DTO server → item FE (bentuk identik; union enum sama).
function dtoToItem(d: TemplateAnamnesisDTO): TemplateAnamnesisItem {
  return {
    id: d.id,
    label: d.label,
    kategori: d.kategori,
    contextTags: d.contextTags,
    keluhanUtama: d.keluhanUtama,
    rps: d.rps,
    onsetDurasi: d.onsetDurasi,
    mekanismeCedera: d.mekanismeCedera,
    faktorPemberat: d.faktorPemberat,
    faktorPemerut: d.faktorPemerut,
    statusGeneralis: d.statusGeneralis,
    catatanPerawat: d.catatanPerawat,
    status: d.status,
  };
}

// Item draft → payload create/update.
function draftToInput(d: TemplateAnamnesisItem) {
  return {
    label: d.label,
    kategori: d.kategori,
    contextTags: d.contextTags,
    keluhanUtama: d.keluhanUtama,
    rps: d.rps || undefined,
    onsetDurasi: d.onsetDurasi || undefined,
    mekanismeCedera: d.mekanismeCedera || undefined,
    faktorPemberat: d.faktorPemberat || undefined,
    faktorPemerut: d.faktorPemerut || undefined,
    statusGeneralis: d.statusGeneralis || undefined,
    catatanPerawat: d.catatanPerawat || undefined,
    status: d.status,
  };
}

interface Props {
  initial: TemplateAnamnesisDTO[];
  prefetched: boolean;
}

export default function TemplateAnamnesisPage({ initial, prefetched }: Props) {
  const [activeTab, setActiveTab] = useState<TemplateTabKey>("identitas");
  const [listLoaded, setListLoaded] = useState(prefetched);

  // Seed sekali dari SSR (DTO→item). CUD berikutnya lewat /api (commit/removeLocal).
  const [seed] = useState(() => initial.map(dtoToItem));
  const crud = useMasterCrud<TemplateAnamnesisItem>({
    initial: seed,
    emptyFactory: emptyTemplateAnamnesis,
  });

  // Fallback fetch bila SSR gagal prefetch (degradasi anggun).
  useEffect(() => {
    if (prefetched) return;
    const ac = new AbortController();
    listTemplateAnamnesis({ limit: PAGE_LIMIT }, ac.signal)
      .then(({ items }) => crud.setItems(items.map(dtoToItem)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat template anamnesis", e instanceof ApiError ? e.message : undefined);
      })
      .finally(() => setListLoaded(true));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetched]);

  const stats = useMemo(() => {
    const igd = countByContext(crud.items, "IGD");
    const ri = countByContext(crud.items, "RI");
    const rj = countByContext(crud.items, "RJ");
    const aktif = crud.items.filter((t) => t.status === "Aktif").length;
    return { igd, ri, rj, aktif };
  }, [crud.items]);

  async function handleSave() {
    const d = crud.draft;
    if (!d) return;
    const isNew = crud.isNew;
    try {
      const dto = isNew
        ? await createTemplateAnamnesis(draftToInput(d))
        : await updateTemplateAnamnesis(d.id, draftToInput(d));
      crud.commit(dtoToItem(dto));
      toast.success(isNew ? "Template ditambahkan" : "Template diperbarui", dto.label);
    } catch (e) {
      toast.error("Gagal menyimpan template", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDelete() {
    const sel = crud.selected;
    if (!sel) return;
    if (!window.confirm(`Hapus template "${sel.label}"? Aksi ini tidak dapat di-undo.`)) return;
    try {
      await deleteTemplateAnamnesis(sel.id);
      crud.removeLocal(sel.id);
      toast.success("Template dihapus", sel.label);
    } catch (e) {
      toast.error("Gagal menghapus template", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <MasterPageLayout
      loaded={listLoaded}
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
            onSave={handleSave}
            onCancel={crud.handleCancel}
            onDelete={!crud.isNew ? handleDelete : undefined}
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
