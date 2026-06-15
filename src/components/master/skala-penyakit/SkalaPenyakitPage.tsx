"use client";

import { useEffect, useMemo, useState } from "react";
import { HeartPulse, CheckCircle2, ListChecks, Layers } from "lucide-react";
import {
  MasterPageLayout, StatCard, useMasterCrud, DiscardDialog,
} from "@/components/master/shared";
import {
  emptySkalaPenyakitRecord, type SkalaPenyakitRecord,
} from "@/lib/master/skalaPenyakitMock";
import {
  listSkalaPenyakit, createSkalaPenyakit, updateSkalaPenyakit, deleteSkalaPenyakit,
} from "@/lib/api/master/skalaPenyakit";
import type { SkalaRisikoDTO } from "@/lib/schemas/master/skalaRisiko";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
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

// DTO server → record FE (bentuk identik; cast union enum).
function dtoToItem(d: SkalaRisikoDTO): SkalaPenyakitRecord {
  return {
    id: d.id,
    kode: d.kode,
    nama: d.nama,
    singkat: d.singkat,
    deskripsi: d.deskripsi,
    scoringMode: d.scoringMode,
    arah: d.arah,
    items: d.items,
    totalMax: d.totalMax,
    interpretasi: d.interpretasi,
    referensi: d.referensi,
    konsumenModul: d.konsumenModul,
    status: d.status,
  };
}

// Record draft → payload create/update (kode TIDAK dikirim — auto-gen SP-NNNN server).
function draftToInput(d: SkalaPenyakitRecord) {
  return {
    nama: d.nama,
    singkat: d.singkat || undefined,
    deskripsi: d.deskripsi || undefined,
    referensi: d.referensi || undefined,
    scoringMode: d.scoringMode,
    arah: d.arah,
    totalMax: d.totalMax,
    items: d.items,
    interpretasi: d.interpretasi,
    konsumenModul: d.konsumenModul,
    status: d.status,
  };
}

interface Props {
  initial: SkalaRisikoDTO[];
  prefetched: boolean;
}

export default function SkalaPenyakitPage({ initial, prefetched }: Props) {
  const [tab, setTab] = useState<SkalaTabKey>("identitas");
  const [listLoaded, setListLoaded] = useState(prefetched);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  const [seed] = useState(() => initial.map(dtoToItem));
  const crud = useMasterCrud<SkalaPenyakitRecord>({
    initial: seed,
    emptyFactory: emptySkalaPenyakitRecord,
    confirmDirty: () => true, // konfirmasi via DiscardDialog
  });

  useEffect(() => {
    if (prefetched) return;
    const ac = new AbortController();
    listSkalaPenyakit({ limit: 300 }, ac.signal)
      .then((items) => crud.setItems(items.map(dtoToItem)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat skala penyakit", e instanceof ApiError ? e.message : undefined);
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
    const aktif = crud.items.filter((i) => i.status === "Aktif").length;
    const totalItem = crud.items.reduce((acc, i) => acc + i.items.length, 0);
    const modulSet = new Set<string>();
    crud.items.forEach((i) => i.konsumenModul.forEach((m) => modulSet.add(m)));
    return { total, aktif, totalItem, modulCount: modulSet.size };
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
        ? await createSkalaPenyakit(draftToInput(d))
        : await updateSkalaPenyakit(d.id, draftToInput(d));
      crud.commit(dtoToItem(dto));
      toast.success(isNew ? "Skala ditambahkan" : "Skala diperbarui", `${dto.kode} · ${dto.nama}`);
    } catch (e) {
      toast.error("Gagal menyimpan skala", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDelete() {
    const sel = crud.selected;
    if (!sel) return;
    if (!window.confirm(`Hapus skala "${sel.nama}"? Aksi ini tidak dapat di-undo.`)) return;
    try {
      await deleteSkalaPenyakit(sel.id);
      crud.removeLocal(sel.id);
      toast.success("Skala dihapus", `${sel.kode} · ${sel.nama}`);
    } catch (e) {
      toast.error("Gagal menghapus skala", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <>
      <MasterPageLayout
        loaded={listLoaded}
        accent={ACCENT}
        eyebrow="EHIS Master · Skala Klinis"
        title="Skala Penyakit"
        description="Master klasifikasi & skoring spesifik-penyakit tervalidasi — kardiologi (Killip · NYHA · TIMI), onkologi (ECOG · Grade · Stadium AJCC). Dikonsumsi tab Penilaian (Jantung/Kanker) per konsumen modul. Kode SP-NNNN dibuat otomatis."
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
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={!crud.isNew ? handleDelete : undefined}
            />
          ) : (
            <SkalaEmptyState
              accent={ACCENT}
              icon={HeartPulse}
              title="Pilih skala di kiri"
              description="Atau tambah skala penyakit baru — klasifikasi spesialistik per kondisi (kardio, onko, neuro, dll). Definisikan items + interpretasi action plan per stage."
              totalItem={crud.items.length}
              totalLabel="skala tersedia"
              addLabel="Tambah Skala Baru"
              onAddNew={handleAddNew}
            />
          )
        }
      />
      <DiscardDialog
        open={!!pendingNav}
        message="Perubahan skala penyakit yang belum disimpan akan hilang."
        onConfirm={() => { const a = pendingNav; setPendingNav(null); a?.(); }}
        onCancel={() => setPendingNav(null)}
      />
    </>
  );
}
