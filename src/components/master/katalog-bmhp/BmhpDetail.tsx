"use client";

import { cn } from "@/lib/utils";
import { MasterDetailPanel, type MasterTab } from "@/components/master/shared";
import {
  type BmhpRecord,
  BMHP_KATEGORI_CFG, KELAS_RISIKO_CFG,
} from "@/lib/master/bmhpMock";
import {
  TAB_REGISTRY, tabCompleteness, isBmhpValid, bmhpInitials,
  type TabKey,
} from "./katalogBmhpShared";
import IdentitasTab from "./tabs/IdentitasTab";
import KlasifikasiTab from "./tabs/KlasifikasiTab";
import HargaTab from "./tabs/HargaTab";

interface Props {
  draft: BmhpRecord;
  isNew: boolean;
  isDirty: boolean;
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  onPatch: (patch: Partial<BmhpRecord>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const BMHP_TAB_NAV: MasterTab<TabKey>[] = TAB_REGISTRY.map((t) => ({
  key: t.key,
  label: t.short,
  icon: t.icon,
  accentText: t.accent.text,
}));

// ── Tab completeness badge ────────────────────────────────

function TabBadge({ tabKey, draft }: { tabKey: TabKey; draft: BmhpRecord }) {
  const c = tabCompleteness(draft, tabKey);
  const isComplete = c.pct === 100;
  if (isComplete) {
    return (
      <span className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
        ✓
      </span>
    );
  }
  if (c.total === 0) {
    return (
      <span className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-500">
        ·
      </span>
    );
  }
  return (
    <span className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700">
      {c.filled}
    </span>
  );
}

// ── Header content (avatar + meta) ────────────────────────

function HeaderContent({ draft, isNew, isDirty }: { draft: BmhpRecord; isNew: boolean; isDirty: boolean }) {
  const catCfg = BMHP_KATEGORI_CFG[draft.kategori];
  const kelasCfg = draft.kelasRisiko ? KELAS_RISIKO_CFG[draft.kelasRisiko] : null;

  return (
    <>
      <div className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
        isNew ? "bg-teal-100 text-teal-700" : cn(catCfg.bg, catCfg.text),
      )}>
        {bmhpInitials(draft)}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn(
            "text-[10px] font-semibold uppercase tracking-widest",
            isNew ? "text-teal-600" : "text-slate-400",
          )}>
            {isNew ? "BMHP Baru" : "Edit BMHP"}
          </p>
          {isDirty && !isNew && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0 text-[10px] font-bold text-amber-700">
              Belum tersimpan
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
          {draft.nama || <span className="italic text-slate-400">Nama barang belum diisi</span>}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded px-1.5 py-0 text-[10px] font-semibold", catCfg.bg, catCfg.text)}>
            {catCfg.short}
          </span>
          {draft.ukuran && (
            <span className="rounded bg-slate-100 px-1.5 py-0 text-[10px] font-semibold text-slate-600">
              {draft.ukuran}
            </span>
          )}
          <span className="text-[10px] font-semibold text-slate-500">/ {draft.satuan}</span>
          {draft.isSteril && (
            <span className="rounded bg-sky-100 px-1.5 py-0 text-[10px] font-bold text-sky-700">Steril</span>
          )}
          {kelasCfg && (
            <span className={cn("rounded px-1.5 py-0 text-[10px] font-bold", kelasCfg.bg, kelasCfg.text)}>
              {kelasCfg.label}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

// ── Component ─────────────────────────────────────────────

export default function BmhpDetail({
  draft, isNew, isDirty, tab, onTabChange,
  onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid = isBmhpValid(draft);

  return (
    <MasterDetailPanel<TabKey>
      accent="teal"
      headerContent={<HeaderContent draft={draft} isNew={isNew} isDirty={isDirty} />}
      isNew={isNew}
      isDirty={isDirty}
      valid={valid}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      saveLabel="Simpan"
      newSaveLabel="Buat BMHP"
      tabs={BMHP_TAB_NAV}
      activeTab={tab}
      onTabChange={onTabChange}
      renderTabBadge={(k) => <TabBadge tabKey={k} draft={draft} />}
      tabsAriaLabel="Detail BMHP"
    >
      {tab === "identitas"   && <IdentitasTab   draft={draft} onPatch={onPatch} />}
      {tab === "klasifikasi" && <KlasifikasiTab draft={draft} onPatch={onPatch} />}
      {tab === "harga"       && <HargaTab       draft={draft} onPatch={onPatch} />}
    </MasterDetailPanel>
  );
}
