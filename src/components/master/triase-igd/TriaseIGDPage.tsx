"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Siren, CheckCircle2, Layers, Activity } from "lucide-react";
import {
  MasterPageLayout, StatCard, useMasterCrud,
} from "@/components/master/shared";
import { emptyTriaseRecord } from "@/lib/master/triaseMock";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import {
  listTriaseProtocols, createTriaseProtocol, updateTriaseProtocol, deleteTriaseProtocol,
  type TriaseRecordDTO,
} from "@/lib/api/triaseProtocol";
import type {
  CreateTriaseInput, UpdateTriaseInput, LevelInput, ParameterInput,
} from "@/lib/schemas/triaseProtocol";
import TriaseList from "./TriaseList";
import TriaseDetail from "./TriaseDetail";
import TriaseEmptyState from "./TriaseEmptyState";
import type { TriaseTabKey } from "./triaseShared";

// Draft kosong = TriaseRecord (mock) + field DTO (isDefault/version) untuk concurrency.
function emptyDraft(): TriaseRecordDTO {
  return { ...emptyTriaseRecord(), isDefault: false, version: 0 };
}

// ── Draft (DTO) → payload server ─────────────────────────
const opt = (v?: string): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};
function levelsToInput(d: TriaseRecordDTO): LevelInput[] {
  return d.levels.map((l) => ({
    kode: l.kode, label: l.label, tone: l.tone,
    responsTime: opt(l.responsTime), prioritas: l.prioritas, deskripsi: opt(l.deskripsi),
  }));
}
function parametersToInput(d: TriaseRecordDTO): ParameterInput[] {
  return d.parameters.map((p) => ({
    kode: p.kode, label: p.label,
    tipeNilai: p.tipeNilai, satuan: p.satuan,
    values: p.values,
  }));
}
function toCreateInput(d: TriaseRecordDTO): CreateTriaseInput {
  return {
    kode: d.kode, nama: d.nama, deskripsi: opt(d.deskripsi), protokol: opt(d.protokol),
    status: d.status, isDefault: d.isDefault,
    levels: levelsToInput(d), parameters: parametersToInput(d),
  };
}
function toUpdateInput(d: TriaseRecordDTO): UpdateTriaseInput {
  return {
    expectedVersion: d.version,
    kode: d.kode, nama: d.nama, deskripsi: opt(d.deskripsi), protokol: opt(d.protokol),
    status: d.status, isDefault: d.isDefault,
    levels: levelsToInput(d), parameters: parametersToInput(d),
  };
}

export default function TriaseIGDPage() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<TriaseTabKey>("identitas");
  const savingRef = useRef(false);

  const crud = useMasterCrud<TriaseRecordDTO>({
    initial: [],
    emptyFactory: emptyDraft,
  });
  const { setItems, commit, removeLocal } = crud;

  // Fetch list (client; degradasi anggun bila gagal).
  useEffect(() => {
    const ctrl = new AbortController();
    listTriaseProtocols(ctrl.signal)
      .then((items) => setItems(items))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat", e instanceof ApiError ? e.message : "Tidak dapat memuat protokol triase");
      })
      .finally(() => setLoaded(true));
    return () => ctrl.abort();
  }, [setItems]);

  const stats = useMemo(() => {
    const total = crud.items.length;
    const aktif = crud.items.filter((i) => i.status === "Aktif").length;
    const totalLevel = crud.items.reduce((acc, i) => acc + i.levels.length, 0);
    const totalParam = crud.items.reduce((acc, i) => acc + i.parameters.length, 0);
    return { total, aktif, totalLevel, totalParam };
  }, [crud.items]);

  const handleSelect = (id: string) => { crud.handleSelect(id); setTab("identitas"); };
  const handleAddNew = () => { crud.handleAddNew(); setTab("identitas"); };

  const handleSave = useCallback(async () => {
    const draft = crud.draft;
    if (!draft || savingRef.current) return;
    savingRef.current = true;
    try {
      const saved = crud.isNew
        ? await createTriaseProtocol(toCreateInput(draft))
        : await updateTriaseProtocol(draft.id, toUpdateInput(draft));
      commit(saved);
      toast.success(crud.isNew ? "Protokol dibuat" : "Perubahan tersimpan", `"${saved.nama}"`);
    } catch (e) {
      toast.error("Gagal menyimpan", e instanceof ApiError ? e.message : "Terjadi kesalahan");
    } finally {
      savingRef.current = false;
    }
  }, [crud.draft, crud.isNew, commit]);

  const handleDelete = useCallback(async () => {
    const sel = crud.selected;
    if (!sel) return;
    if (!window.confirm(`Hapus protokol "${sel.nama}"? Aksi ini tidak dapat di-undo.`)) return;
    try {
      await deleteTriaseProtocol(sel.id, sel.version);
      removeLocal(sel.id);
      toast.success("Protokol dihapus", `"${sel.nama}"`);
    } catch (e) {
      toast.error("Gagal menghapus", e instanceof ApiError ? e.message : "Terjadi kesalahan");
    }
  }, [crud.selected, removeLocal]);

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="amber"
      eyebrow="EHIS Master · Skala Klinis"
      title="Triase IGD"
      description="Master protokol triase IGD dengan matrix level × parameter klinis. Standar: ESI 5-level (ENA 2020) + DOA · PMK 47/2018 tentang Klasifikasi & Standar Pelayanan IGD."
      stats={
        <>
          <StatCard icon={Siren}        label="Protokol"    value={stats.total}       tone="amber"   />
          <StatCard icon={CheckCircle2} label="Aktif"       value={stats.aktif}       tone="emerald" />
          <StatCard icon={Layers}       label="Total Level" value={stats.totalLevel}  tone="rose"    />
          <StatCard icon={Activity}     label="Parameter"   value={stats.totalParam}  tone="sky"     />
        </>
      }
      list={
        <TriaseList
          items={crud.items}
          selectedId={crud.selectedId}
          onSelect={handleSelect}
          onAddNew={handleAddNew}
        />
      }
      detail={
        crud.draft ? (
          <TriaseDetail
            draft={crud.draft}
            isNew={crud.isNew}
            isDirty={crud.isDirty}
            tab={tab}
            onTabChange={setTab}
            onPatch={crud.handlePatch}
            onSave={handleSave}
            onCancel={crud.handleCancel}
            onDelete={!crud.isNew ? handleDelete : undefined}
          />
        ) : (
          <TriaseEmptyState totalItem={crud.items.length} onAddNew={handleAddNew} />
        )
      }
    />
  );
}
