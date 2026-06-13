"use client";

import { cn } from "@/lib/utils";
import { MasterDetailPanel, type MasterTab } from "@/components/master/shared";
import {
  type ObatRecord,
  OBAT_KATEGORI_CFG, BENTUK_CFG, RUTE_CFG,
} from "@/lib/master/obatMock";
import {
  TAB_REGISTRY, tabCompleteness, isObatValid, obatInitials,
  type TabKey,
} from "./katalogObatShared";
import IdentitasTab from "./tabs/IdentitasTab";
import KlasifikasiTab from "./tabs/KlasifikasiTab";
import KlinisTab from "./tabs/KlinisTab";
import HargaTab from "./tabs/HargaTab";
import MappingKfaTab from "./tabs/MappingKfaTab";

interface Props {
  draft: ObatRecord;
  /** Seluruh obat (untuk LASA pair picker). */
  allObat: ObatRecord[];
  isNew: boolean;
  isDirty: boolean;
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  onPatch: (patch: Partial<ObatRecord>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const OBAT_TAB_NAV: MasterTab<TabKey>[] = TAB_REGISTRY.map((t) => ({
  key: t.key,
  label: t.short,
  icon: t.icon,
  accentText: t.accent.text,
}));

// ── Tab completeness badge ────────────────────────────────

function TabBadge({ tabKey, draft }: { tabKey: TabKey; draft: ObatRecord }) {
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

function HeaderContent({ draft, isNew, isDirty }: { draft: ObatRecord; isNew: boolean; isDirty: boolean }) {
  const catCfg = OBAT_KATEGORI_CFG[draft.kategori];
  const bentukCfg = BENTUK_CFG[draft.bentuk];
  const ruteShort = draft.rute ? RUTE_CFG[draft.rute].short : null;

  return (
    <>
      <div className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
        isNew ? "bg-violet-100 text-violet-700" : cn(catCfg.bg, catCfg.text),
      )}>
        {obatInitials(draft)}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn(
            "text-[10px] font-semibold uppercase tracking-widest",
            isNew ? "text-violet-600" : "text-slate-400",
          )}>
            {isNew ? "Obat Baru" : "Edit Obat"}
          </p>
          {isDirty && !isNew && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0 text-[10px] font-bold text-amber-700">
              Belum tersimpan
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
          {draft.namaGenerik || <span className="italic text-slate-400">Nama generik belum diisi</span>}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded px-1.5 py-0 text-[10px] font-semibold", catCfg.bg, catCfg.text)}>
            {catCfg.short}
          </span>
          <span className="rounded bg-slate-100 px-1.5 py-0 text-[10px] font-semibold text-slate-600">
            {bentukCfg.short}
          </span>
          {draft.kekuatan && (
            <span className="text-[10px] font-semibold text-slate-600">{draft.kekuatan}</span>
          )}
          {ruteShort && (
            <span className="rounded bg-sky-50 px-1.5 py-0 text-[10px] font-semibold text-sky-700">
              {ruteShort}
            </span>
          )}
          {draft.isHAM && (
            <span className="rounded bg-rose-100 px-1.5 py-0 text-[10px] font-bold text-rose-700">HAM</span>
          )}
          {draft.isLASA && (
            <span className="rounded bg-amber-100 px-1.5 py-0 text-[10px] font-bold text-amber-700">LASA</span>
          )}
        </div>
      </div>
    </>
  );
}

// ── Component ─────────────────────────────────────────────

export default function ObatDetail({
  draft, allObat, isNew, isDirty, tab, onTabChange,
  onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid = isObatValid(draft);

  return (
    <MasterDetailPanel<TabKey>
      accent="violet"
      headerContent={<HeaderContent draft={draft} isNew={isNew} isDirty={isDirty} />}
      isNew={isNew}
      isDirty={isDirty}
      valid={valid}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      saveLabel="Simpan"
      newSaveLabel="Buat Obat"
      tabs={OBAT_TAB_NAV}
      activeTab={tab}
      onTabChange={onTabChange}
      renderTabBadge={(k) => <TabBadge tabKey={k} draft={draft} />}
      tabsAriaLabel="Detail obat"
    >
      {tab === "identitas"   && <IdentitasTab   draft={draft} onPatch={onPatch} />}
      {tab === "klasifikasi" && <KlasifikasiTab draft={draft} allObat={allObat} onPatch={onPatch} />}
      {tab === "klinis"      && <KlinisTab      draft={draft} onPatch={onPatch} />}
      {tab === "harga"       && <HargaTab       draft={draft} onPatch={onPatch} />}
      {tab === "kfa"         && <MappingKfaTab  draft={draft} onPatch={onPatch} />}
    </MasterDetailPanel>
  );
}
