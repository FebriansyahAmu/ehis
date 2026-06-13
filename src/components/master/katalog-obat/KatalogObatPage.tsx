"use client";

import { useEffect, useMemo, useState } from "react";
import { Pill, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, DiscardDialog,
} from "@/components/master/shared";
import { type ObatRecord, emptyObatRecord } from "@/lib/master/obatMock";
import {
  listObat, createObat, updateObat, deleteObat,
  type ObatDTO, type CreateObatInput,
} from "@/lib/api/master/obat";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import { fmtIDR, type TabKey } from "./katalogObatShared";
import ObatList from "./ObatList";
import ObatDetail from "./ObatDetail";
import ObatEmptyState from "./ObatEmptyState";

const PAGE_LIMIT = 300; // katalog kecil → muat sekali, filter di klien

// ObatDTO = ObatRecord (mirror penuh) → konsumsi langsung tanpa konversi.
// Record draft → payload create/update (strip id + kode; `kode` auto-gen di server).
function draftToInput(d: ObatRecord): CreateObatInput {
  return {
    namaGenerik: d.namaGenerik,
    namaDagang: d.namaDagang,
    pabrik: d.pabrik,
    kategori: d.kategori,
    bentuk: d.bentuk,
    kekuatan: d.kekuatan,
    satuanTerkecil: d.satuanTerkecil,
    rute: d.rute,
    isFormularium: d.isFormularium,
    isHAM: d.isHAM,
    isLASA: d.isLASA,
    lasaPairIds: d.lasaPairIds,
    golongan: d.golongan,
    isColdChain: d.isColdChain,
    isRestricted: d.isRestricted,
    indikasi: d.indikasi,
    kontraindikasi: d.kontraindikasi,
    dosisDewasa: d.dosisDewasa,
    dosisAnak: d.dosisAnak,
    efekSamping: d.efekSamping,
    interaksiObat: d.interaksiObat,
    catatanKhusus: d.catatanKhusus,
    hargaSatuan: d.hargaSatuan,
    hpp: d.hpp,
    het: d.het,
    kodeFornas: d.kodeFornas,
    bpjsCoverage: d.bpjsCoverage,
    batasResepPerKunjungan: d.batasResepPerKunjungan,
    kfa: d.kfa,
    status: d.status,
  };
}

interface Props {
  initial: ObatDTO[];
  prefetched: boolean;
}

export default function KatalogObatPage({ initial, prefetched }: Props) {
  const [tab, setTab] = useState<TabKey>("identitas");
  const [listLoaded, setListLoaded] = useState(prefetched);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  const crud = useMasterCrud<ObatRecord>({
    initial,
    emptyFactory: emptyObatRecord,
    confirmDirty: () => true, // konfirmasi via DiscardDialog
  });

  // Fallback fetch bila SSR gagal prefetch.
  useEffect(() => {
    if (prefetched) return;
    const ac = new AbortController();
    listObat({ limit: PAGE_LIMIT }, ac.signal)
      .then(({ items }) => crud.setItems(items))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat katalog obat", e instanceof ApiError ? e.message : undefined);
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

  async function handleSave() {
    const d = crud.draft;
    if (!d) return;
    const isNew = crud.isNew;
    try {
      const dto = isNew
        ? await createObat(draftToInput(d))
        : await updateObat(d.id, draftToInput(d));
      crud.commit(dto);
      toast.success(isNew ? "Obat ditambahkan" : "Obat diperbarui", dto.namaGenerik);
    } catch (e) {
      toast.error("Gagal menyimpan obat", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDelete() {
    const sel = crud.selected;
    if (!sel) return;
    if (!window.confirm(`Hapus obat "${sel.namaGenerik}"? Aksi ini tidak dapat di-undo.`)) return;
    try {
      await deleteObat(sel.id);
      crud.removeLocal(sel.id);
      toast.success("Obat dihapus", sel.namaGenerik);
    } catch (e) {
      toast.error("Gagal menghapus obat", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <>
      <MasterPageLayout
        loaded={listLoaded}
        accent="violet"
        eyebrow="EHIS Master · Katalog Klinis"
        title="Katalog Obat"
        description="Pusat data obat — identitas, klasifikasi (Formularium / HAM / LASA / Narkotika-Psikotropika), informasi klinis, harga, dan pemetaan KFA (SatuSehat). Source-of-truth untuk farmasi, resep, dan billing."
        stats={
          <>
            <StatCard icon={Pill}        label="Total"        value={stats.total}            tone="violet" />
            <StatCard icon={Sparkles}    label="Formularium"  value={stats.form}             tone="emerald" />
            <StatCard icon={ShieldAlert} label="HAM + Nar/Psi" value={stats.hamNarpsi}       tone="rose" />
            <StatCard icon={Wallet}      label="Avg Harga"    value={fmtIDR(stats.avgHarga)} tone="amber" />
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
              allObat={crud.items}
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
