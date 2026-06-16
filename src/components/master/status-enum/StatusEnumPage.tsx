"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Layers, ListChecks, Power, Tag } from "lucide-react";
import {
  MasterPageLayout, StatCard, DiscardDialog,
} from "@/components/master/shared";
import {
  STATUS_ENUM_GROUPS, type StatusEnumKey, type EnumEntry, type EnumGroup,
} from "@/lib/master/statusEnumMock";
import { ENUM_GROUP_PREFIX, type EnumEntryDTO } from "@/lib/schemas/master/statusEnum";
import {
  listStatusEnum, createStatusEnum, updateStatusEnum, deleteStatusEnum,
} from "@/lib/api/master/statusEnum";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import { sortEntries, type EntryDraft } from "./statusEnumShared";
import EnumSidebar from "./EnumSidebar";
import EnumTable from "./EnumTable";

// Entri DB + groupKey (utk grouping; EnumEntry FE tak punya groupKey).
type ItemWithGroup = EnumEntry & { groupKey: StatusEnumKey };

function dtoToItem(d: EnumEntryDTO): ItemWithGroup {
  return {
    id: d.id,
    groupKey: d.groupKey,
    kode: d.kode,
    label: d.label,
    deskripsi: d.deskripsi,
    tone: d.tone,
    icon: d.icon,
    urutan: d.urutan,
    status: d.status,
  };
}

interface Props {
  initial: EnumEntryDTO[];
  prefetched: boolean;
}

export default function StatusEnumPage({ initial, prefetched }: Props) {
  const [listLoaded, setListLoaded] = useState(prefetched);
  const [items, setItems] = useState<ItemWithGroup[]>(() => initial.map(dtoToItem));
  const [activeKey, setActiveKey] = useState<StatusEnumKey>("status-pulang");
  const [busy, setBusy] = useState(false);
  // Form add/edit terbuka di table → gate pindah grup (DiscardDialog).
  const [formOpen, setFormOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<StatusEnumKey | null>(null);

  // Fallback fetch bila SSR gagal prefetch (degradasi anggun).
  useEffect(() => {
    if (prefetched) return;
    const ac = new AbortController();
    listStatusEnum({ limit: 500 }, ac.signal)
      .then((rows) => setItems(rows.map(dtoToItem)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat status enum", e instanceof ApiError ? e.message : undefined);
      })
      .finally(() => setListLoaded(true));
    return () => ac.abort();
  }, [prefetched]);

  // Compose groups: meta statis (statusEnumMock) + entri DB per groupKey.
  const groups: EnumGroup[] = useMemo(
    () => STATUS_ENUM_GROUPS.map((meta) => ({
      ...meta,
      entries: items.filter((it) => it.groupKey === meta.key),
    })),
    [items],
  );
  const activeGroup = groups.find((g) => g.key === activeKey) ?? groups[0];
  const activePrefix = ENUM_GROUP_PREFIX[activeKey];

  const stats = useMemo(() => {
    const total = items.length;
    const aktif = items.filter((i) => i.status === "Aktif").length;
    return { kategori: STATUS_ENUM_GROUPS.length, total, aktif, nonAktif: total - aktif };
  }, [items]);

  // ── Pindah grup (gate discard bila form terbuka) ────────
  const selectGroup = useCallback((key: StatusEnumKey) => {
    if (key === activeKey) return;
    if (formOpen) setPendingKey(key);
    else setActiveKey(key);
  }, [activeKey, formOpen]);

  // ── CRUD via API (optimistik + toast) ───────────────────
  const handleAdd = useCallback(async (draft: EntryDraft): Promise<boolean> => {
    setBusy(true);
    try {
      const dto = await createStatusEnum({ groupKey: activeKey, ...draft });
      setItems((prev) => [...prev, dtoToItem(dto)]);
      toast.success("Entri ditambahkan", `${dto.kode} · ${dto.label}`);
      return true;
    } catch (e) {
      toast.error("Gagal menambah entri", e instanceof ApiError ? e.message : undefined);
      return false;
    } finally {
      setBusy(false);
    }
  }, [activeKey]);

  const handleUpdate = useCallback(async (id: string, draft: EntryDraft): Promise<boolean> => {
    setBusy(true);
    try {
      const dto = await updateStatusEnum(id, draft);
      setItems((prev) => prev.map((it) => (it.id === id ? dtoToItem(dto) : it)));
      toast.success("Entri diperbarui", `${dto.kode} · ${dto.label}`);
      return true;
    } catch (e) {
      toast.error("Gagal memperbarui entri", e instanceof ApiError ? e.message : undefined);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    if (!window.confirm(`Hapus entri "${it.label}" (${it.kode})? Aksi ini tidak dapat di-undo.`)) return;
    setBusy(true);
    deleteStatusEnum(id)
      .then(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
        toast.success("Entri dihapus", `${it.kode} · ${it.label}`);
      })
      .catch((e) => toast.error("Gagal menghapus entri", e instanceof ApiError ? e.message : undefined))
      .finally(() => setBusy(false));
  }, [items]);

  const handleMove = useCallback((id: string, dir: "up" | "down") => {
    const groupItems = sortEntries(items.filter((it) => it.groupKey === activeKey));
    const idx = groupItems.findIndex((e) => e.id === id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= groupItems.length) return;
    const a = groupItems[idx], b = groupItems[swap];
    // Optimistik tukar urutan, lalu PATCH keduanya; revert bila gagal.
    setItems((prev) => prev.map((it) =>
      it.id === a.id ? { ...it, urutan: b.urutan } : it.id === b.id ? { ...it, urutan: a.urutan } : it,
    ));
    setBusy(true);
    Promise.all([
      updateStatusEnum(a.id, { urutan: b.urutan }),
      updateStatusEnum(b.id, { urutan: a.urutan }),
    ])
      .catch((e) => {
        setItems((prev) => prev.map((it) =>
          it.id === a.id ? { ...it, urutan: a.urutan } : it.id === b.id ? { ...it, urutan: b.urutan } : it,
        ));
        toast.error("Gagal mengubah urutan", e instanceof ApiError ? e.message : undefined);
      })
      .finally(() => setBusy(false));
  }, [items, activeKey]);

  return (
    <>
      <MasterPageLayout
        loaded={listLoaded}
        accent="violet"
        eyebrow="EHIS Master · Template & Enum"
        title="Status Enum"
        description="Katalog enum kecil lintas-modul (single source) — dropdown PasienPulang · StatusFisik · TTV · Transfer · Edukasi · Rekonsiliasi. Kode dibuat OTOMATIS per kategori (<PREFIX>-NNN). Tambah/ubah di sini akan dikonsumsi semua modul terkait."
        stats={
          <>
            <StatCard icon={Layers}     label="Kategori"    value={stats.kategori} tone="violet"  />
            <StatCard icon={ListChecks} label="Total Entri" value={stats.total}    tone="sky"     />
            <StatCard icon={Power}      label="Aktif"       value={stats.aktif}    tone="emerald" />
            <StatCard icon={Tag}        label="Non-Aktif"   value={stats.nonAktif} tone="slate"   />
          </>
        }
        list={<EnumSidebar groups={groups} activeKey={activeKey} onSelect={selectGroup} />}
        detail={
          <EnumTable
            key={activeKey}
            group={activeGroup}
            prefix={activePrefix}
            busy={busy}
            onAdd={handleAdd}
            onUpdateEntry={handleUpdate}
            onDeleteEntry={handleDelete}
            onMoveEntry={handleMove}
            onFormOpenChange={setFormOpen}
          />
        }
      />
      <DiscardDialog
        open={!!pendingKey}
        title="Pindah kategori?"
        message="Ada entri yang sedang ditambah/diedit. Pindah kategori akan membuang perubahan yang belum disimpan."
        confirmLabel="Pindah & Buang"
        onConfirm={() => { if (pendingKey) setActiveKey(pendingKey); setFormOpen(false); setPendingKey(null); }}
        onCancel={() => setPendingKey(null)}
      />
    </>
  );
}
