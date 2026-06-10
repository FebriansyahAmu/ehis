"use client";

import { useState, useEffect } from "react";
import { BookText } from "lucide-react";
import {
  MasterPageLayout, StatCard,
  useMasterCrud, useSkeletonDelay,
} from "@/components/master/shared";
import {
  emptyIcdItem, defaultIcdVersion,
  type IcdItem, type IcdJenis,
} from "@/lib/master/icdMock";
import IcdList, { type FilterStatus } from "./IcdList";
import IcdDetail from "./IcdDetail";
import IcdEmptyState from "./IcdEmptyState";
import ImportExcelModal from "./import/ImportExcelModal";
import DiscardDialog from "./DiscardDialog";
import { listIcd, createIcd, updateIcd, deleteIcd, importIcd } from "@/lib/api/master/icd";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";

const PAGE_SIZE = 50;
const IMPORT_BATCH = 2000; // baris per request import (file besar dikirim per-batch)

export default function IcdPage() {
  const loaded = useSkeletonDelay();

  const [activeJenis, setActiveJenis]     = useState<IcdJenis>("ICD-10");
  const [query, setQuery]                 = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filterStatus, setFilterStatus]   = useState<FilterStatus>("Semua");
  const [cursor, setCursor]               = useState<string | null>(null);
  const [hasMore, setHasMore]             = useState(false);
  const [loadingList, setLoadingList]     = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [importOpen, setImportOpen]       = useState(false);
  const [importNotice, setImportNotice]   = useState<string | null>(null);
  const [refreshTick, setRefreshTick]     = useState(0);
  // Aksi tertunda yang menunggu konfirmasi "buang perubahan" (gate custom dialog).
  const [pendingNav, setPendingNav]       = useState<(() => void) | null>(null);

  const crud = useMasterCrud<IcdItem>({
    initial: [],
    emptyFactory: () => emptyIcdItem(activeJenis),
    confirmDirty: () => true, // matikan window.confirm bawaan → konfirmasi via DiscardDialog
  });

  // Jalankan aksi langsung bila form bersih; bila dirty → tahan & minta konfirmasi.
  function guardDirty(action: () => void) {
    if (crud.isDirty) setPendingNav(() => action);
    else action();
  }

  // Debounce pencarian → kurangi request saat mengetik.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Muat halaman pertama saat jenis/status/pencarian berubah (atau refresh manual).
  useEffect(() => {
    const ac = new AbortController();
    setLoadingList(true);
    (async () => {
      try {
        const page = await listIcd(
          { jenis: activeJenis, q: debouncedQuery || undefined, status: filterStatus, limit: PAGE_SIZE },
          ac.signal,
        );
        if (ac.signal.aborted) return;
        crud.setItems(page.items as IcdItem[]);
        setCursor(page.cursor);
        setHasMore(!!page.cursor);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat katalog ICD", e instanceof ApiError ? e.message : undefined);
      } finally {
        if (!ac.signal.aborted) setLoadingList(false);
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJenis, filterStatus, debouncedQuery, refreshTick]);

  async function handleLoadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listIcd(
        { jenis: activeJenis, q: debouncedQuery || undefined, status: filterStatus, cursor, limit: PAGE_SIZE },
      );
      crud.setItems((prev) => [...prev, ...(page.items as IcdItem[])]);
      setCursor(page.cursor);
      setHasMore(!!page.cursor);
    } catch (e) {
      toast.error("Gagal memuat lebih banyak", e instanceof ApiError ? e.message : undefined);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleJenisChange(j: IcdJenis) {
    setActiveJenis(j);
    crud.reset(); // selection lama tak relevan utk jenis baru
  }

  async function handleSave() {
    const d = crud.draft;
    if (!d) return;
    try {
      if (crud.isNew) {
        const created = await createIcd({
          jenis: d.jenis,
          kode: d.kode.trim(),
          nama: d.nama.trim(),
          version: d.version.trim() || defaultIcdVersion(d.jenis),
          namaInggris: d.namaInggris?.trim() || undefined,
          chapter: d.chapter?.trim() || undefined,
          blok: d.blok?.trim() || undefined,
          inaCbg: d.inaCbg?.trim() || undefined,
          status: d.status,
        });
        crud.commit(created as IcdItem);
        toast.success("Kode ICD ditambahkan", `${created.kode} — ${created.nama}`);
      } else {
        const updated = await updateIcd(d.id, {
          kode: d.kode.trim(),
          nama: d.nama.trim(),
          version: d.version.trim(),
          namaInggris: d.namaInggris?.trim() || undefined,
          chapter: d.chapter?.trim() || undefined,
          blok: d.blok?.trim() || undefined,
          inaCbg: d.inaCbg?.trim() || undefined,
          status: d.status,
        });
        crud.commit(updated as IcdItem);
        toast.success("Kode ICD diperbarui", updated.kode);
      }
    } catch (e) {
      toast.error("Gagal menyimpan kode ICD", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDelete() {
    const sel = crud.selected;
    if (!sel) return;
    if (!window.confirm(`Hapus kode "${sel.kode}"? Aksi ini tidak dapat di-undo.`)) return;
    try {
      await deleteIcd(sel.id);
      crud.removeLocal(sel.id);
      toast.success("Kode ICD dihapus", sel.kode);
    } catch (e) {
      toast.error("Gagal menghapus kode ICD", e instanceof ApiError ? e.message : undefined);
    }
  }

  // Import file besar: kirim acceptedItems per batch → server dedup → agregasi hasil.
  async function handleImportCommit(rows: IcdItem[]) {
    if (rows.length === 0) return;
    const jenis = rows[0].jenis;
    setImportNotice(`Mengimpor ${rows.length} kode…`);
    let inserted = 0;
    let skipped = 0;
    try {
      for (let i = 0; i < rows.length; i += IMPORT_BATCH) {
        const chunk = rows.slice(i, i + IMPORT_BATCH);
        const r = await importIcd({
          jenis,
          items: chunk.map((it) => ({
            kode: it.kode,
            display: it.nama,
            version: it.version || undefined,
            namaInggris: it.namaInggris || undefined,
            chapter: it.chapter || undefined,
            blok: it.blok || undefined,
            inaCbg: it.inaCbg || undefined,
          })),
        });
        inserted += r.inserted;
        skipped += r.skipped;
      }
      setImportNotice(`${inserted} kode ditambahkan · ${skipped} dilewati (duplikat). Total ${rows.length} baris.`);
      toast.success(
        "Import ICD selesai",
        `${inserted} kode baru · ${skipped} duplikat dilewati · ${rows.length} baris diproses`,
      );
      if (jenis === activeJenis) setRefreshTick((t) => t + 1); // tampilkan data baru
      window.setTimeout(() => setImportNotice(null), 8000);
    } catch (e) {
      setImportNotice(null);
      toast.error("Import ICD gagal", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <>
      <MasterPageLayout
        loaded={loaded}
        accent="sky"
        eyebrow="EHIS Master · Reference"
        title="ICD-10 & ICD-9-CM"
        description="Katalog diagnosis (ICD-10) & prosedur klinis (ICD-9-CM). Inti = CODE · DISPLAY · VERSION (unduhan SatuSehat Kemenkes). Data backend-backed — cari & paginasi di server; import dataset penuh via Excel/CSV."
        skeletonStatCount={1}
        stats={
          <StatCard
            icon={BookText}
            label="Kode dimuat"
            value={`${crud.items.length}${hasMore ? "+" : ""}`}
            tone="sky"
          />
        }
        list={
          <IcdList
            items={crud.items}
            selectedId={crud.selectedId}
            onSelect={(id) => guardDirty(() => crud.handleSelect(id))}
            onAddNew={() => guardDirty(() => crud.handleAddNew())}
            activeJenis={activeJenis}
            onJenisChange={handleJenisChange}
            query={query}
            onQueryChange={setQuery}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            loading={loadingList}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
            onImport={() => setImportOpen(true)}
            importNotice={importNotice}
            onDismissNotice={() => setImportNotice(null)}
          />
        }
        detail={
          crud.draft ? (
            <IcdDetail
              draft={crud.draft}
              isNew={crud.isNew}
              isDirty={crud.isDirty}
              onPatch={crud.handlePatch}
              onSave={handleSave}
              onCancel={() => guardDirty(() => crud.handleCancel())}
              onDelete={!crud.isNew ? handleDelete : undefined}
            />
          ) : (
            <IcdEmptyState totalItem={crud.items.length} onAddNew={() => guardDirty(() => crud.handleAddNew())} jenis={activeJenis} />
          )
        }
      />
      <ImportExcelModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onCommit={handleImportCommit}
        existingItems={[]}
        defaultJenis={activeJenis}
      />
      <DiscardDialog
        open={!!pendingNav}
        onConfirm={() => { const a = pendingNav; setPendingNav(null); a?.(); }}
        onCancel={() => setPendingNav(null)}
      />
    </>
  );
}
