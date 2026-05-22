"use client";

/**
 * Generic CRUD hook untuk halaman master.
 *
 * Mengelola state: items · selected · draft · isNew · isDirty + handler standar
 * (select/addNew/patch/save/cancel/delete). Draft di-clone dengan `structuredClone`
 * supaya editing tidak memutasi source list.
 *
 * Pemakaian:
 *   const crud = useMasterCrud<RadCatalogRecord>({
 *     initial: RAD_KATALOG_MOCK,
 *     emptyFactory: emptyRadCatalogRecord,
 *   });
 *   // → crud.items, crud.draft, crud.handleSelect(id), ...
 */

import { useCallback, useEffect, useMemo, useState } from "react";

export interface UseMasterCrudOptions<T extends { id: string }> {
  /** Daftar awal yang akan dimuat ke state. */
  initial: T[];
  /** Factory untuk membuat record kosong saat user klik "Tambah Baru". */
  emptyFactory: () => T;
  /**
   * Custom equality untuk menentukan `isDirty`.
   * Default: `JSON.stringify(selected) !== JSON.stringify(draft)`.
   * Override jika ada field yang harus diabaikan (mis. timestamp generated).
   */
  isDirtyEqual?: (a: T, b: T) => boolean;
  /**
   * Callback opsional sebelum mengeksekusi aksi destruktif (select/addNew/cancel)
   * saat `isDirty=true`. Default: `window.confirm(message)`.
   * Return `true` untuk lanjut, `false` untuk batal.
   */
  confirmDirty?: (message: string) => boolean;
}

export interface UseMasterCrudReturn<T extends { id: string }> {
  // ── State ────────────────────────────────────────────
  items: T[];
  /** Mutasi langsung untuk kasus eksepsional (impor bulk, dll). */
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  selectedId: string | null;
  selected: T | null;
  draft: T | null;
  isNew: boolean;
  isDirty: boolean;

  // ── Handlers ─────────────────────────────────────────
  /** Pilih record by id. Otomatis cek dirty. */
  handleSelect: (id: string) => void;
  /** Mulai entry baru. Otomatis cek dirty. */
  handleAddNew: () => void;
  /** Patch field draft. No-op kalau draft null. */
  handlePatch: (patch: Partial<T>) => void;
  /** Commit draft ke items list. */
  handleSave: () => void;
  /** Buang perubahan; kembali ke source atau clear bila isNew. */
  handleCancel: () => void;
  /** Hapus record terpilih dengan konfirmasi default. Returns true bila berhasil. */
  handleDelete: (confirmMessage?: string) => boolean;

  // ── Utility ──────────────────────────────────────────
  /** Manual reset (mis. setelah operasi async global). */
  reset: () => void;
}

/** Default confirm via window.confirm — safe untuk SSR (cek typeof). */
function defaultConfirm(message: string): boolean {
  if (typeof window === "undefined") return true;
  return window.confirm(message);
}

/** Default deep-equality via JSON.stringify — adequate untuk record polos. */
function defaultIsDirtyEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useMasterCrud<T extends { id: string }>(
  opts: UseMasterCrudOptions<T>,
): UseMasterCrudReturn<T> {
  const {
    initial,
    emptyFactory,
    isDirtyEqual = defaultIsDirtyEqual,
    confirmDirty = defaultConfirm,
  } = opts;

  const [items,      setItems]      = useState<T[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft,      setDraft]      = useState<T | null>(null);
  const [isNew,      setIsNew]      = useState(false);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  const isDirty = useMemo(() => {
    if (!draft) return false;
    if (isNew) return true;
    if (!selected) return false;
    return !isDirtyEqual(selected, draft);
  }, [draft, selected, isNew, isDirtyEqual]);

  const guardDirty = useCallback(
    (action: () => void, message: string) => {
      if (isDirty && !confirmDirty(message)) return;
      action();
    },
    [isDirty, confirmDirty],
  );

  const handleSelect = useCallback(
    (id: string) => {
      guardDirty(() => {
        const found = items.find((i) => i.id === id);
        if (!found) return;
        setSelectedId(id);
        setDraft(structuredClone(found));
        setIsNew(false);
      }, "Ada perubahan belum tersimpan. Buang & pindah item?");
    },
    [items, guardDirty],
  );

  const handleAddNew = useCallback(() => {
    guardDirty(() => {
      setSelectedId(null);
      setDraft(emptyFactory());
      setIsNew(true);
    }, "Ada perubahan belum tersimpan. Buang & tambah baru?");
  }, [emptyFactory, guardDirty]);

  const handlePatch = useCallback((patch: Partial<T>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const handleSave = useCallback(() => {
    setDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;
      setItems((prev) => {
        if (isNew) {
          return [currentDraft, ...prev];
        }
        return prev.map((i) => (i.id === currentDraft.id ? currentDraft : i));
      });
      if (isNew) {
        setSelectedId(currentDraft.id);
        setIsNew(false);
      }
      return currentDraft;
    });
  }, [isNew]);

  const handleCancel = useCallback(() => {
    if (isDirty && !confirmDirty("Buang perubahan?")) return;
    if (isNew) {
      setDraft(null);
      setSelectedId(null);
      setIsNew(false);
    } else if (selected) {
      setDraft(structuredClone(selected));
    }
  }, [isDirty, isNew, selected, confirmDirty]);

  const handleDelete = useCallback(
    (confirmMessage = "Hapus item ini? Aksi ini tidak dapat di-undo."): boolean => {
      if (!selected) return false;
      if (!confirmDirty(confirmMessage)) return false;
      setItems((prev) => prev.filter((i) => i.id !== selected.id));
      setSelectedId(null);
      setDraft(null);
      setIsNew(false);
      return true;
    },
    [selected, confirmDirty],
  );

  const reset = useCallback(() => {
    setSelectedId(null);
    setDraft(null);
    setIsNew(false);
  }, []);

  return {
    items, setItems,
    selectedId, selected, draft, isNew, isDirty,
    handleSelect, handleAddNew, handlePatch,
    handleSave, handleCancel, handleDelete,
    reset,
  };
}

// ── Skeleton timing helper (bonus) ───────────────────────

/**
 * Hook kecil untuk timing skeleton loading. Default 500ms.
 * Dipakai bareng `MasterPageLayout`:
 *   const loaded = useSkeletonDelay();
 *   <MasterPageLayout loaded={loaded} ... />
 */
export function useSkeletonDelay(ms: number = 500): boolean {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loaded;
}
