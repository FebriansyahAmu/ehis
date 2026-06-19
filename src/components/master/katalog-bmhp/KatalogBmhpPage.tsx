"use client";

import { useEffect, useMemo, useState } from "react";
import { Syringe, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, DiscardDialog,
} from "@/components/master/shared";
import { type BmhpRecord, emptyBmhpRecord } from "@/lib/master/bmhpMock";
import {
  listBmhp, createBmhp, updateBmhp, deleteBmhp,
  type BmhpDTO, type CreateBmhpInput,
} from "@/lib/api/master/bmhp";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import { fmtIDR, type TabKey } from "./katalogBmhpShared";
import BmhpList from "./BmhpList";
import BmhpDetail from "./BmhpDetail";
import BmhpEmptyState from "./BmhpEmptyState";

const PAGE_LIMIT = 300; // katalog kecil → muat sekali, filter di klien

// BmhpDTO = BmhpRecord (mirror penuh) → konsumsi langsung tanpa konversi.
// Record draft → payload create/update (strip id + kode; `kode` auto-gen di server).
function draftToInput(d: BmhpRecord): CreateBmhpInput {
  return {
    nama: d.nama,
    merek: d.merek,
    pabrik: d.pabrik,
    kategori: d.kategori,
    ukuran: d.ukuran,
    satuan: d.satuan,
    isiPerKemasan: d.isiPerKemasan,
    isSteril: d.isSteril,
    isSingleUse: d.isSingleUse,
    isImplan: d.isImplan,
    kelasRisiko: d.kelasRisiko,
    isFormularium: d.isFormularium,
    nomorIzinEdar: d.nomorIzinEdar,
    kodeEKatalog: d.kodeEKatalog,
    hargaSatuan: d.hargaSatuan,
    hpp: d.hpp,
    het: d.het,
    bpjsCoverage: d.bpjsCoverage,
    catatan: d.catatan,
    status: d.status,
  };
}

interface Props {
  initial: BmhpDTO[];
  prefetched: boolean;
}

export default function KatalogBmhpPage({ initial, prefetched }: Props) {
  const [tab, setTab] = useState<TabKey>("identitas");
  const [listLoaded, setListLoaded] = useState(prefetched);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  const crud = useMasterCrud<BmhpRecord>({
    initial,
    emptyFactory: emptyBmhpRecord,
    confirmDirty: () => true, // konfirmasi via DiscardDialog
  });

  // Fallback fetch bila SSR gagal prefetch.
  useEffect(() => {
    if (prefetched) return;
    const ac = new AbortController();
    listBmhp({ limit: PAGE_LIMIT }, ac.signal)
      .then(({ items }) => crud.setItems(items))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat katalog BMHP", e instanceof ApiError ? e.message : undefined);
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
    const form = crud.items.filter((b) => b.isFormularium).length;
    const steril = crud.items.filter((b) => b.isSteril).length;
    const avgHarga = total
      ? Math.round(crud.items.reduce((sum, b) => sum + (b.hargaSatuan ?? 0), 0) / total)
      : 0;
    return { total, form, steril, avgHarga };
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
        ? await createBmhp(draftToInput(d))
        : await updateBmhp(d.id, draftToInput(d));
      crud.commit(dto);
      toast.success(isNew ? "BMHP ditambahkan" : "BMHP diperbarui", dto.nama);
    } catch (e) {
      toast.error("Gagal menyimpan BMHP", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDelete() {
    const sel = crud.selected;
    if (!sel) return;
    if (!window.confirm(`Hapus BMHP "${sel.nama}"? Aksi ini tidak dapat di-undo.`)) return;
    try {
      await deleteBmhp(sel.id);
      crud.removeLocal(sel.id);
      toast.success("BMHP dihapus", sel.nama);
    } catch (e) {
      toast.error("Gagal menghapus BMHP", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <>
      <MasterPageLayout
        loaded={listLoaded}
        accent="teal"
        eyebrow="EHIS Master · Katalog Klinis"
        title="Katalog BMHP / BHP"
        description="Pusat data Bahan Medis Habis Pakai — identitas, klasifikasi (steril / single-use / kelas risiko alkes), regulasi izin edar (AKL/AKD) & e-Katalog, serta harga. Terpisah dari Katalog Obat. Source-of-truth untuk logistik, tindakan, dan billing."
        stats={
          <>
            <StatCard icon={Syringe}     label="Total"       value={stats.total}            tone="teal" />
            <StatCard icon={Sparkles}    label="Formularium" value={stats.form}             tone="emerald" />
            <StatCard icon={ShieldCheck} label="Steril"      value={stats.steril}           tone="sky" />
            <StatCard icon={Wallet}      label="Avg Harga"   value={fmtIDR(stats.avgHarga)} tone="amber" />
          </>
        }
        list={
          <BmhpList
            items={crud.items}
            selectedId={crud.selectedId}
            onSelect={handleSelect}
            onAddNew={handleAddNew}
          />
        }
        detail={
          crud.draft ? (
            <BmhpDetail
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
            <BmhpEmptyState totalBmhp={crud.items.length} onAddNew={handleAddNew} />
          )
        }
      />
      <DiscardDialog
        open={!!pendingNav}
        message="Perubahan BMHP yang belum disimpan akan hilang."
        onConfirm={() => { const a = pendingNav; setPendingNav(null); a?.(); }}
        onCancel={() => setPendingNav(null)}
      />
    </>
  );
}
