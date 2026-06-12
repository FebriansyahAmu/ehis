"use client";

import { useEffect, useMemo, useState } from "react";
import { FlaskConical, CheckCircle2, Beaker, AlertOctagon } from "lucide-react";
import { MasterPageLayout, StatCard, useMasterCrud, DiscardDialog } from "@/components/master/shared";
import {
  emptyLabTest, type LabTestRecord, type LabParameterRow, type LabRujukanRow,
} from "@/lib/master/labTestCatalog";
import {
  listLabTest, createLabTest, updateLabTest, deleteLabTest, type LabTestDTO,
} from "@/lib/api/master/labTest";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import { countCriticalParams, type LabTabKey } from "./katalogLabShared";
import LabItemList from "./LabItemList";
import LabItemDetail from "./LabItemDetail";
import LabItemEmptyState from "./LabItemEmptyState";

const PAGE_LIMIT = 200; // katalog kecil (input manual) → muat sekali, filter di klien

let _ruj = 0;
const rujId = () => `ruj-${Date.now().toString(36)}-${++_ruj}`;

// DTO server → record FE (generate id baris rujukan; null → undefined).
function dtoToRecord(d: LabTestDTO): LabTestRecord {
  return {
    id: d.id,
    kode: d.kode,
    nama: d.nama,
    kategori: d.kategori,
    spesimen: d.spesimen ?? "",
    metode: d.metode ?? "",
    waktuTunggu: d.waktuTunggu ?? "",
    keterangan: d.keterangan ?? "",
    status: d.status,
    parameters: d.parameters.map((p): LabParameterRow => ({
      id: p.id,
      nama: p.nama,
      satuan: p.satuan,
      tipeHasil: p.tipeHasil,
      nilaiNormalText: p.nilaiNormalText,
      rujukan: p.rujukan.map((r): LabRujukanRow => ({
        id: rujId(),
        gender: r.gender,
        usiaMin: r.usiaMin,
        usiaMax: r.usiaMax,
        low: r.low,
        high: r.high,
        keterangan: r.keterangan,
      })),
      criticalLow: p.criticalLow ?? undefined,
      criticalHigh: p.criticalHigh ?? undefined,
      deltaAbsolute: p.deltaAbsolute ?? undefined,
      deltaPercent: p.deltaPercent ?? undefined,
      metode: p.metode,
      urutan: p.urutan,
    })),
  };
}

// Record draft → payload create/update (strip id klien; parameters lengkap).
function draftToInput(d: LabTestRecord) {
  return {
    nama: d.nama,
    kode: d.kode || undefined,
    kategori: d.kategori,
    spesimen: d.spesimen || undefined,
    metode: d.metode || undefined,
    waktuTunggu: d.waktuTunggu || undefined,
    keterangan: d.keterangan || undefined,
    status: d.status,
    parameters: d.parameters.map((p, i) => ({
      nama: p.nama,
      satuan: p.satuan,
      tipeHasil: p.tipeHasil,
      nilaiNormalText: p.nilaiNormalText,
      rujukan: p.rujukan.map((r) => ({
        gender: r.gender,
        usiaMin: r.usiaMin,
        usiaMax: r.usiaMax,
        low: r.low,
        high: r.high,
        keterangan: r.keterangan,
      })),
      criticalLow: p.criticalLow ?? null,
      criticalHigh: p.criticalHigh ?? null,
      deltaAbsolute: p.deltaAbsolute ?? null,
      deltaPercent: p.deltaPercent ?? null,
      metode: p.metode,
      urutan: p.urutan ?? i,
    })),
  };
}

interface Props {
  initial: LabTestDTO[];
  prefetched: boolean;
}

export default function KatalogLabPage({ initial, prefetched }: Props) {
  const [tab, setTab] = useState<LabTabKey>("identitas");
  const [listLoaded, setListLoaded] = useState(prefetched);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  const [seed] = useState(() => initial.map(dtoToRecord));
  const crud = useMasterCrud<LabTestRecord>({
    initial: seed,
    emptyFactory: emptyLabTest,
    confirmDirty: () => true, // konfirmasi via DiscardDialog (bukan window.confirm)
  });

  // Fallback fetch bila SSR gagal prefetch.
  useEffect(() => {
    if (prefetched) return;
    const ac = new AbortController();
    listLabTest({ limit: PAGE_LIMIT }, ac.signal)
      .then(({ items }) => crud.setItems(items.map(dtoToRecord)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat katalog laboratorium", e instanceof ApiError ? e.message : undefined);
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
    const total = crud.items.length;
    const aktif = crud.items.filter((t) => (t.status ?? "Aktif") === "Aktif").length;
    const parameter = crud.items.reduce((sum, t) => sum + t.parameters.length, 0);
    const kritis = crud.items.filter((t) => countCriticalParams(t) > 0).length;
    return { total, aktif, parameter, kritis };
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
        ? await createLabTest(draftToInput(d))
        : await updateLabTest(d.id, draftToInput(d));
      crud.commit(dtoToRecord(dto));
      toast.success(isNew ? "Tes ditambahkan" : "Tes diperbarui", dto.nama);
    } catch (e) {
      toast.error("Gagal menyimpan tes", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDelete() {
    const sel = crud.selected;
    if (!sel) return;
    if (!window.confirm(`Hapus tes "${sel.nama}"? Aksi ini tidak dapat di-undo.`)) return;
    try {
      await deleteLabTest(sel.id);
      crud.removeLocal(sel.id);
      toast.success("Tes dihapus", sel.nama);
    } catch (e) {
      toast.error("Gagal menghapus tes", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <>
      <MasterPageLayout
        loaded={listLoaded}
        accent="sky"
        eyebrow="EHIS Master · Katalog Klinis"
        title="Katalog Laboratorium"
        description="Tes pemeriksaan → parameter (analit): satuan, nilai rujukan per gender & usia, nilai kritis & delta. Source-of-truth untuk worklist Lab & auto-flag hasil. Standar ISO 15189:2022 · PMK 43/2013."
        stats={
          <>
            <StatCard icon={FlaskConical} label="Total Tes"   value={stats.total}     tone="sky" />
            <StatCard icon={CheckCircle2} label="Aktif"       value={stats.aktif}     tone="emerald" />
            <StatCard icon={Beaker}       label="Parameter"   value={stats.parameter} tone="violet" />
            <StatCard icon={AlertOctagon} label="Nilai Kritis" value={stats.kritis}   tone="rose" />
          </>
        }
        list={
          <LabItemList
            items={crud.items}
            selectedId={crud.selectedId}
            onSelect={handleSelect}
            onAddNew={handleAddNew}
          />
        }
        detail={
          crud.draft ? (
            <LabItemDetail
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
            <LabItemEmptyState totalItem={crud.items.length} onAddNew={handleAddNew} />
          )
        }
      />
      <DiscardDialog
        open={!!pendingNav}
        message="Perubahan tes laboratorium yang belum disimpan akan hilang."
        onConfirm={() => { const a = pendingNav; setPendingNav(null); a?.(); }}
        onCancel={() => setPendingNav(null)}
      />
    </>
  );
}
