"use client";

/**
 * CodingTab — orchestrator Tab Koding (EK3.3).
 *
 * Layout (2 col lg+):
 *   ┌──────────────────────────────────────────────┐
 *   │ SoftLockBanner (jika claim.softLock aktif)   │
 *   │ AutoSuggestBar (chip strip source kunjungan) │
 *   ├──────────────────┬───────────────────────────┤
 *   │ Diagnosa Primer  │ Tindakan / Prosedur       │
 *   │ Diagnosa Sekunder│ ReGroupWidget             │
 *   │                  │ CoderSignature            │
 *   └──────────────────┴───────────────────────────┘
 *
 * State lokal: codingState (primer/sekunder/tindakan + signed).
 * Soft-lock: check claim.softLock field → banner + disable edits.
 */

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Activity,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClaimRecord, KodeICD10IM, KodeICD9CMIM } from "@/lib/eklaim/eklaimShared";
import type { CodingState, DiagnosaSekunderEntry } from "./coding/codingShared";
import { validateICS } from "./coding/codingShared";
import SoftLockBanner from "./coding/SoftLockBanner";
import ICDPicker from "./coding/ICDPicker";
import ICDSelectedList from "./coding/ICDSelectedList";
import ReGroupWidget from "./coding/ReGroupWidget";
import CoderSignature from "./coding/CoderSignature";

const MOCK_CODER = "Lina (Coder RM)";
const MAX_SEKUNDER = 10;

interface Props {
  claim: ClaimRecord;
}

// ── Soft-lock helper ───────────────────────────────────

function isClaimLockedByOther(claim: ClaimRecord): boolean {
  if (!claim.softLock) return false;
  const exp = new Date(claim.softLock.expiresAt).getTime();
  return exp > Date.now() && claim.softLock.lockedBy !== MOCK_CODER;
}

// ── Main ───────────────────────────────────────────────

export default function CodingTab({ claim }: Props) {
  const locked = useMemo(() => isClaimLockedByOther(claim), [claim]);

  const [codingState, setCodingState] = useState<CodingState>(() => ({
    diagnosaPrimer: claim.diagnosaPrimer,
    diagnosaSekunder: claim.diagnosaSekunder.map((icd) => ({
      icd,
      hospitalAcquired: icd.hospitalAcquired ?? false,
    })),
    tindakanProsedur: [...claim.tindakanProsedur],
    isSigned: false,
  }));

  const [suggestOpen, setSuggestOpen] = useState(false);

  const validation = useMemo(() => validateICS(codingState), [codingState]);

  // ── Handlers: Diagnosa Primer ───────────────────────

  const handleSetPrimer = useCallback((entry: KodeICD10IM | KodeICD9CMIM) => {
    setCodingState((prev) => ({
      ...prev,
      diagnosaPrimer: entry as KodeICD10IM,
      isSigned: false,
    }));
  }, []);

  const handleClearPrimer = useCallback(() => {
    setCodingState((prev) => ({
      ...prev,
      diagnosaPrimer: null,
      isSigned: false,
    }));
  }, []);

  // ── Handlers: Diagnosa Sekunder ─────────────────────

  const handleAddSekunder = useCallback((entry: KodeICD10IM | KodeICD9CMIM) => {
    setCodingState((prev) => {
      if (prev.diagnosaSekunder.length >= MAX_SEKUNDER) return prev;
      if (prev.diagnosaSekunder.some((e) => e.icd.kode === entry.kode)) return prev;
      if (entry.kode === prev.diagnosaPrimer?.kode) return prev;
      return {
        ...prev,
        diagnosaSekunder: [
          ...prev.diagnosaSekunder,
          { icd: entry as KodeICD10IM, hospitalAcquired: false },
        ],
        isSigned: false,
      };
    });
  }, []);

  const handleRemoveSekunder = useCallback((kode: string) => {
    setCodingState((prev) => ({
      ...prev,
      diagnosaSekunder: prev.diagnosaSekunder.filter((e) => e.icd.kode !== kode),
      isSigned: false,
    }));
  }, []);

  const handleToggleHA = useCallback((kode: string) => {
    setCodingState((prev) => ({
      ...prev,
      diagnosaSekunder: prev.diagnosaSekunder.map((e) =>
        e.icd.kode === kode
          ? { ...e, hospitalAcquired: !e.hospitalAcquired }
          : e,
      ),
      isSigned: false,
    }));
  }, []);

  // ── Handlers: Tindakan ──────────────────────────────

  const handleAddTindakan = useCallback((entry: KodeICD10IM | KodeICD9CMIM) => {
    setCodingState((prev) => {
      if (prev.tindakanProsedur.some((p) => p.kode === entry.kode)) return prev;
      return {
        ...prev,
        tindakanProsedur: [...prev.tindakanProsedur, entry as KodeICD9CMIM],
        isSigned: false,
      };
    });
  }, []);

  const handleRemoveTindakan = useCallback((kode: string) => {
    setCodingState((prev) => ({
      ...prev,
      tindakanProsedur: prev.tindakanProsedur.filter((p) => p.kode !== kode),
      isSigned: false,
    }));
  }, []);

  // ── Handlers: Signature ─────────────────────────────

  const handleSign = useCallback(() => {
    setCodingState((prev) => ({
      ...prev,
      isSigned: true,
      signedAt: new Date().toISOString(),
      signedBy: MOCK_CODER,
    }));
  }, []);

  const handleUnsign = useCallback(() => {
    setCodingState((prev) => ({
      ...prev,
      isSigned: false,
      signedAt: undefined,
      signedBy: undefined,
    }));
  }, []);

  // Kodes untuk picker "already added" check
  const sekunderKodes = useMemo(
    () => codingState.diagnosaSekunder.map((e) => e.icd.kode),
    [codingState.diagnosaSekunder],
  );
  const tindakanKodes = useMemo(
    () => codingState.tindakanProsedur.map((p) => p.kode),
    [codingState.tindakanProsedur],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="mx-auto flex w-full max-w-7xl flex-col gap-3"
    >
      {/* Soft lock banner */}
      {locked && claim.softLock && (
        <SoftLockBanner softLock={claim.softLock} />
      )}

      {/* Auto-suggest bar (collapsible) */}
      <AutoSuggestBar
        claim={claim}
        open={suggestOpen}
        onToggle={() => setSuggestOpen((v) => !v)}
        onImportPrimer={handleSetPrimer}
        onImportSekunder={handleAddSekunder}
        onImportTindakan={handleAddTindakan}
        codingState={codingState}
      />

      {/* Validation summary */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <ValidationBanner errors={validation.errors} warnings={validation.warnings} />
      )}

      {/* 2-column grid on lg */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* LEFT: Diagnosa */}
        <div className="space-y-3">
          {/* Diagnosa Primer */}
          <SectionCard
            icon={Stethoscope}
            title="Diagnosa Primer"
            subtitle="ICD-10-IM · wajib (ICS v1)"
            accent="teal"
          >
            {codingState.diagnosaPrimer ? (
              <PrimerChip
                icd={codingState.diagnosaPrimer}
                onClear={locked ? undefined : handleClearPrimer}
              />
            ) : (
              <ICDPicker
                variant="icd10"
                placeholder="Cari & pilih diagnosa primer ICD-10-IM"
                selectedKodes={[]}
                onSelect={handleSetPrimer}
                disabled={locked}
              />
            )}
            {!codingState.diagnosaPrimer && (
              <p className="mt-1.5 text-[12px] text-slate-400">
                Diagnosa primer = kode yang paling menentukan DRG group
              </p>
            )}
          </SectionCard>

          {/* Diagnosa Sekunder */}
          <SectionCard
            icon={Activity}
            title="Diagnosa Sekunder"
            subtitle={`ICD-10-IM · ${codingState.diagnosaSekunder.length}/${MAX_SEKUNDER} · opsional`}
            accent="teal"
          >
            <ICDPicker
              variant="icd10"
              placeholder="Tambah diagnosa sekunder (CC/MCC/Komorbid)"
              selectedKodes={[
                ...(codingState.diagnosaPrimer
                  ? [codingState.diagnosaPrimer.kode]
                  : []),
                ...sekunderKodes,
              ]}
              onSelect={handleAddSekunder}
              disabled={locked || codingState.diagnosaSekunder.length >= MAX_SEKUNDER}
            />
            {codingState.diagnosaSekunder.length >= MAX_SEKUNDER && (
              <p className="mt-1 text-[12px] text-amber-600">
                Maksimal {MAX_SEKUNDER} diagnosa sekunder — hapus salah satu untuk
                menambah baru
              </p>
            )}
            <div className="mt-2">
              <ICDSelectedList
                variant="sekunder"
                entries={codingState.diagnosaSekunder as DiagnosaSekunderEntry[]}
                onRemove={handleRemoveSekunder}
                onToggleHA={handleToggleHA}
                disabled={locked}
              />
            </div>
          </SectionCard>
        </div>

        {/* RIGHT: Tindakan + ReGroup + Signature */}
        <div className="space-y-3">
          {/* Tindakan / Prosedur */}
          <SectionCard
            icon={Activity}
            title="Tindakan / Prosedur"
            subtitle={`ICD-9-CM-IM · ${codingState.tindakanProsedur.length} entri`}
            accent="sky"
          >
            <ICDPicker
              variant="icd9"
              placeholder="Tambah tindakan/prosedur ICD-9-CM-IM"
              selectedKodes={tindakanKodes}
              onSelect={handleAddTindakan}
              disabled={locked}
            />
            <div className="mt-2">
              <ICDSelectedList
                variant="tindakan"
                entries={codingState.tindakanProsedur}
                onRemove={handleRemoveTindakan}
                disabled={locked}
              />
            </div>
          </SectionCard>

          {/* Re-Group */}
          <SectionCard
            icon={Stethoscope}
            title="Re-Group Grouper"
            subtitle="iDRG primary · INA-CBG legacy secondary"
            accent="sky"
          >
            <ReGroupWidget
              codingState={codingState}
              claim={claim}
              disabled={locked}
            />
          </SectionCard>

          {/* Coder Signature */}
          <CoderSignature
            coderName={MOCK_CODER}
            isSigned={codingState.isSigned}
            signedAt={codingState.signedAt}
            onSign={handleSign}
            onUnsign={handleUnsign}
            disabled={locked || !validation.valid}
          />
        </div>
      </div>
    </motion.section>
  );
}

// ── Primer Chip ────────────────────────────────────────

function PrimerChip({
  icd,
  onClear,
}: {
  icd: KodeICD10IM;
  onClear?: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2.5">
      <span className="mt-px shrink-0 rounded-md bg-teal-600 px-2 py-0.5 font-mono text-sm font-bold text-white">
        {icd.kode}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{icd.deskripsi}</p>
        {icd.hint && (
          <p className="mt-0.5 text-[12px] italic text-slate-500">{icd.hint}</p>
        )}
        <p className="mt-0.5 text-[11px] text-teal-600">{icd.kategori}</p>
      </div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[12px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        >
          Ganti
        </button>
      )}
    </div>
  );
}

// ── Section Card ───────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  accent,
  children,
}: {
  icon: typeof Stethoscope;
  title: string;
  subtitle: string;
  accent: "teal" | "sky";
  children: React.ReactNode;
}) {
  const accentClass =
    accent === "teal"
      ? "bg-teal-100 ring-teal-200 text-teal-700"
      : "bg-sky-100 ring-sky-200 text-sky-700";
  const borderClass =
    accent === "teal" ? "border-teal-100" : "border-sky-100";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Card header */}
      <div
        className={cn(
          "flex items-center gap-2.5 border-b px-4 py-2.5",
          borderClass,
        )}
      >
        <span
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
            accentClass,
          )}
        >
          <Icon size={13} strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-[13px] font-bold text-slate-800">{title}</p>
          <p className="text-[11px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      {/* Card body */}
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Validation Banner ──────────────────────────────────

function ValidationBanner({
  errors,
  warnings,
}: {
  errors: ReadonlyArray<string>;
  warnings: ReadonlyArray<string>;
}) {
  const hasErrors = errors.length > 0;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2.5",
        hasErrors
          ? "border-rose-200 bg-rose-50"
          : "border-amber-200 bg-amber-50",
      )}
    >
      <AlertCircle
        size={14}
        strokeWidth={2.2}
        className={cn(
          "mt-0.5 shrink-0",
          hasErrors ? "text-rose-600" : "text-amber-600",
        )}
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        {errors.map((e) => (
          <p key={e} className="text-[12.5px] font-semibold text-rose-800">
            {e}
          </p>
        ))}
        {warnings.map((w) => (
          <p key={w} className="text-[12.5px] text-amber-800">
            {w}
          </p>
        ))}
      </div>
    </div>
  );
}

// ── AutoSuggest Bar ────────────────────────────────────

function AutoSuggestBar({
  claim,
  open,
  onToggle,
  onImportPrimer,
  onImportSekunder,
  onImportTindakan,
  codingState,
}: {
  claim: ClaimRecord;
  open: boolean;
  onToggle: () => void;
  onImportPrimer: (entry: KodeICD10IM | KodeICD9CMIM) => void;
  onImportSekunder: (entry: KodeICD10IM | KodeICD9CMIM) => void;
  onImportTindakan: (entry: KodeICD10IM | KodeICD9CMIM) => void;
  codingState: CodingState;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-sky-200 bg-linear-to-br from-sky-50/60 via-teal-50/30 to-sky-50/20">
      {/* Toggle header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-sky-50/60"
      >
        <Info size={14} className="shrink-0 text-sky-600" />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-sky-800">
            Saran dari Kunjungan EHIS-Care
          </p>
          <p className="text-[11.5px] text-sky-600">
            {claim.diagnosaSekunder.length + 1} diagnosa ·{" "}
            {claim.tindakanProsedur.length} tindakan — klik untuk impor manual
          </p>
        </div>
        {open ? (
          <ChevronDown size={14} className="shrink-0 text-sky-500" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-sky-500" />
        )}
      </button>

      {/* Expandable content */}
      {open && (
        <div className="border-t border-sky-100 px-4 py-3 space-y-3">
          {/* Diagnosa primer */}
          <div>
            <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-sky-600">
              Diagnosa Primer (dari kunjungan)
            </p>
            <SuggestChip
              kode={claim.diagnosaPrimer.kode}
              deskripsi={claim.diagnosaPrimer.deskripsi}
              isAdded={
                codingState.diagnosaPrimer?.kode === claim.diagnosaPrimer.kode
              }
              onImport={() => onImportPrimer(claim.diagnosaPrimer)}
              color="teal"
            />
          </div>

          {/* Diagnosa sekunder */}
          {claim.diagnosaSekunder.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-sky-600">
                Diagnosa Sekunder ({claim.diagnosaSekunder.length})
              </p>
              <div className="space-y-1">
                {claim.diagnosaSekunder.map((icd) => (
                  <SuggestChip
                    key={icd.kode}
                    kode={icd.kode}
                    deskripsi={icd.deskripsi}
                    isAdded={codingState.diagnosaSekunder.some(
                      (e) => e.icd.kode === icd.kode,
                    )}
                    onImport={() => onImportSekunder(icd)}
                    color="teal"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tindakan */}
          {claim.tindakanProsedur.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-sky-600">
                Tindakan / Prosedur ({claim.tindakanProsedur.length})
              </p>
              <div className="space-y-1">
                {claim.tindakanProsedur.map((p) => (
                  <SuggestChip
                    key={p.kode}
                    kode={p.kode}
                    deskripsi={p.deskripsi}
                    isAdded={codingState.tindakanProsedur.some(
                      (t) => t.kode === p.kode,
                    )}
                    onImport={() => onImportTindakan(p)}
                    color="sky"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestChip({
  kode,
  deskripsi,
  isAdded,
  onImport,
  color,
}: {
  kode: string;
  deskripsi: string;
  isAdded: boolean;
  onImport: () => void;
  color: "teal" | "sky";
}) {
  const codeColor = color === "teal" ? "text-teal-700" : "text-sky-700";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
      <span className={cn("shrink-0 font-mono text-sm font-bold", codeColor)}>
        {kode}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
        {deskripsi}
      </span>
      <button
        type="button"
        disabled={isAdded}
        onClick={onImport}
        className={cn(
          "shrink-0 rounded-md px-2 py-0.5 text-[12px] font-medium transition-colors",
          isAdded
            ? "cursor-default text-teal-600"
            : "bg-sky-50 text-sky-700 hover:bg-sky-100",
        )}
      >
        {isAdded ? "✓ Sudah ada" : "Impor"}
      </button>
    </div>
  );
}
