"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ClipboardCheck, FileText, Zap } from "lucide-react";
import {
  MasterPageLayout, StatCard, useSkeletonDelay,
} from "@/components/master/shared";
import {
  TEMPLATE_FORM_MOCK,
  type TemplateFormItem, type TemplateFormJenis,
  JENIS_CFG, countByJenis, emptyTemplateForJenis,
} from "@/lib/master/templateFormMock";
import TemplateFormSidebar from "./TemplateFormSidebar";
import TemplateFormList from "./TemplateFormList";
import TemplateFormDetail from "./TemplateFormDetail";
import TemplateFormEmptyState from "./TemplateFormEmptyState";

export default function TemplateFormPage() {
  const loaded = useSkeletonDelay();
  const [items, setItems] = useState<TemplateFormItem[]>(TEMPLATE_FORM_MOCK);
  const [activeJenis, setActiveJenis] = useState<TemplateFormJenis>("sbar");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TemplateFormItem | null>(null);
  const [isNew, setIsNew] = useState(false);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  const isDirty = useMemo(() => {
    if (!draft) return false;
    if (isNew) return true;
    if (!selected) return false;
    return JSON.stringify(selected) !== JSON.stringify(draft);
  }, [draft, selected, isNew]);

  const existingShortcuts = useMemo(
    () => items.filter((i) => i.jenis === "quick-text").map((i) => (i as { shortcut: string }).shortcut),
    [items],
  );

  const stats = useMemo(() => {
    const total = items.length;
    const aktif = items.filter((t) => t.status === "Aktif").length;
    const sbar = countByJenis(items, "sbar");
    const ic = countByJenis(items, "ic-risiko");
    return { total, aktif, sbar, ic };
  }, [items]);

  // ── Handlers ────────────────────────────────────────────

  const handleJenisChange = useCallback((j: TemplateFormJenis) => {
    if (isDirty && !window.confirm("Ada perubahan belum tersimpan. Pindah jenis?")) return;
    setActiveJenis(j);
    setSelectedId(null);
    setDraft(null);
    setIsNew(false);
  }, [isDirty]);

  const handleSelect = useCallback((id: string) => {
    if (isDirty && !window.confirm("Ada perubahan belum tersimpan. Buang & pindah?")) return;
    const found = items.find((i) => i.id === id);
    if (!found) return;
    setSelectedId(id);
    setDraft(structuredClone(found));
    setIsNew(false);
  }, [items, isDirty]);

  const handleAddNew = useCallback(() => {
    if (isDirty && !window.confirm("Ada perubahan belum tersimpan. Buang & buat baru?")) return;
    setSelectedId(null);
    setDraft(emptyTemplateForJenis(activeJenis));
    setIsNew(true);
  }, [activeJenis, isDirty]);

  const handlePatch = useCallback((patch: Partial<TemplateFormItem>) => {
    setDraft((prev) => (prev ? ({ ...prev, ...patch } as TemplateFormItem) : prev));
  }, []);

  const handleSave = useCallback(() => {
    if (!draft) return;
    if (isNew) {
      setItems((prev) => [draft, ...prev]);
      setSelectedId(draft.id);
      setIsNew(false);
    } else {
      setItems((prev) => prev.map((i) => (i.id === draft.id ? draft : i)));
    }
  }, [draft, isNew]);

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm("Buang perubahan?")) return;
    if (isNew) {
      setDraft(null);
      setSelectedId(null);
      setIsNew(false);
    } else if (selected) {
      setDraft(structuredClone(selected));
    }
  }, [isDirty, isNew, selected]);

  const handleDelete = useCallback(() => {
    if (!selected) return;
    if (!window.confirm(`Hapus template "${selected.label}"? Aksi tidak dapat di-undo.`)) return;
    setItems((prev) => prev.filter((i) => i.id !== selected.id));
    setSelectedId(null);
    setDraft(null);
    setIsNew(false);
  }, [selected]);

  // ── Layout ──────────────────────────────────────────────

  const filteredForJenis = items.filter((t) => t.jenis === activeJenis);

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="sky"
      eyebrow="EHIS Master · Template & Enum"
      title="Template Form"
      description="Library template form lintas modul — SBAR (handover/konsultasi/transfer), IC Risiko (per tindakan), Surat Pulang (5 jenis), dan CPPT Quick-text (smart phrases). Dikelola per jenis di sidebar kiri."
      stats={
        <>
          <StatCard icon={MessageSquare}   label="SBAR"      value={stats.sbar}                        tone="violet"  />
          <StatCard icon={ClipboardCheck}  label="IC Risiko" value={stats.ic}                          tone="rose"    />
          <StatCard icon={FileText}        label="Surat"     value={countByJenis(items, "surat")}      tone="sky"     />
          <StatCard icon={Zap}             label="Quick-text" value={countByJenis(items, "quick-text")} tone="amber"  />
        </>
      }
      list={<TemplateFormSidebar items={items} activeJenis={activeJenis} onSelect={handleJenisChange} />}
      detail={
        <div className="flex h-full flex-1 gap-4">
          <TemplateFormList
            items={items}
            jenis={activeJenis}
            selectedId={selectedId}
            onSelect={handleSelect}
            onAddNew={handleAddNew}
          />
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={draft?.id ?? "empty"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {draft ? (
                  <TemplateFormDetail
                    draft={draft}
                    isNew={isNew}
                    isDirty={isDirty}
                    onPatch={handlePatch}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onDelete={!isNew ? handleDelete : undefined}
                    existingShortcuts={existingShortcuts}
                  />
                ) : (
                  <TemplateFormEmptyState
                    jenis={activeJenis}
                    totalItem={filteredForJenis.length}
                    onAddNew={handleAddNew}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      }
    />
  );
}
