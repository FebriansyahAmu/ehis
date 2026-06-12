"use client";

import { motion } from "framer-motion";
import {
  Network, Sparkles, CheckCircle2, Info, Trash2, PlusCircle, FlaskConical, Boxes, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ObatRecord, type KfaMapping, type KfaMappedIngredient,
  emptyKfaMapping,
} from "@/lib/master/obatMock";
import type { KfaProduct } from "@/lib/master/kfaMock";
import { Field, TextInput, NumberInput, SectionGroup } from "@/components/master/shared";
import { productToMapping, isKfaMapped } from "../kfa/kfaMapHelpers";
import KfaSearchPanel from "../kfa/KfaSearchPanel";
import KfaFhirPreview from "../kfa/KfaFhirPreview";

interface Props {
  draft: ObatRecord;
  onPatch: (patch: Partial<ObatRecord>) => void;
}

export default function MappingKfaTab({ draft, onPatch }: Props) {
  const m: KfaMapping = draft.kfa ?? emptyKfaMapping();
  const mapped = isKfaMapped(m);

  // ── Mutators ─────────────────────────────────────────
  const patchKfa = (patch: Partial<KfaMapping>) => onPatch({ kfa: { ...m, ...patch } });

  const applyProduct = (p: KfaProduct) => onPatch({ kfa: productToMapping(p) });

  const clearMapping = () => onPatch({ kfa: emptyKfaMapping() });

  const setIngredients = (list: KfaMappedIngredient[]) => patchKfa({ zatAktif: list });
  const addIngredient = () => setIngredients([...m.zatAktif, { kode: "", display: "" }]);
  const updateIngredient = (i: number, patch: Partial<KfaMappedIngredient>) =>
    setIngredients(m.zatAktif.map((z, idx) => (idx === i ? { ...z, ...patch } : z)));
  const removeIngredient = (i: number) =>
    setIngredients(m.zatAktif.filter((_, idx) => idx !== i));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3"
    >
      {/* Status banner */}
      <StatusBanner mapping={m} mapped={mapped} onClear={clearMapping} />

      {/* 1 · Pencarian KFA */}
      <SectionGroup
        title="Cari Produk di KFA"
        desc="Temukan padanan obat ini di Kamus Farmasi & Alkes, lalu petakan otomatis."
        icon={<Network size={12} />}
        accent={{ bg: "bg-indigo-50", text: "text-indigo-700" }}
      >
        <KfaSearchPanel
          defaultQuery={draft.namaGenerik || draft.namaDagang || ""}
          selectedPoaKode={m.poaKode}
          onPick={applyProduct}
        />
      </SectionGroup>

      {/* 2 · Produk & Bentuk (Grup 1) */}
      <SectionGroup
        title="Grup 1 · Produk, Rute & Bentuk Sediaan"
        desc="POA = produk aktual (ber-NIE) · POV = produk virtual (generik). Bisa diedit manual."
        icon={<Boxes size={12} />}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="POA — Kode" hint="Produk Obat Aktual (kfa_code)">
            <TextInput
              value={m.poaKode ?? ""}
              onChange={(v) => patchKfa({ poaKode: v || undefined })}
              placeholder="mis. 936210001"
              className="font-mono"
              maxW="max-w-full"
              accent="violet"
            />
          </Field>
          <Field label="POA — Nama Produk">
            <TextInput
              value={m.poaNama ?? ""}
              onChange={(v) => patchKfa({ poaNama: v || undefined })}
              placeholder="Nama produk aktual KFA"
              maxW="max-w-full"
              accent="violet"
            />
          </Field>

          <Field label="POV — Kode" hint="Produk Obat Virtual (92xxxxxx)">
            <TextInput
              value={m.povKode ?? ""}
              onChange={(v) => patchKfa({ povKode: v || undefined })}
              placeholder="mis. 92000111"
              className="font-mono"
              maxW="max-w-full"
              accent="violet"
            />
          </Field>
          <Field label="POV — Nama Produk">
            <TextInput
              value={m.povNama ?? ""}
              onChange={(v) => patchKfa({ povNama: v || undefined })}
              placeholder="Nama produk virtual KFA"
              maxW="max-w-full"
              accent="violet"
            />
          </Field>

          <Field label="Bentuk Sediaan — Kode">
            <TextInput
              value={m.bentukKode ?? ""}
              onChange={(v) => patchKfa({ bentukKode: v || undefined })}
              placeholder="mis. BS001"
              className="font-mono"
              maxW="max-w-full"
              accent="violet"
            />
          </Field>
          <Field label="Bentuk Sediaan — Nama">
            <TextInput
              value={m.bentukNama ?? ""}
              onChange={(v) => patchKfa({ bentukNama: v || undefined })}
              placeholder="mis. Tablet Salut Selaput"
              maxW="max-w-full"
              accent="violet"
            />
          </Field>

          <Field label="Rute Pemberian — Kode">
            <TextInput
              value={m.ruteKode ?? ""}
              onChange={(v) => patchKfa({ ruteKode: v || undefined })}
              placeholder="mis. RM001"
              className="font-mono"
              maxW="max-w-full"
              accent="violet"
            />
          </Field>
          <Field label="Rute Pemberian — Nama">
            <TextInput
              value={m.ruteNama ?? ""}
              onChange={(v) => patchKfa({ ruteNama: v || undefined })}
              placeholder="mis. Oral / Intravena"
              maxW="max-w-full"
              accent="violet"
            />
          </Field>

          <Field label="NIE — Nomor Izin Edar BPOM" hint="opsional" className="sm:col-span-2">
            <TextInput
              value={m.nie ?? ""}
              onChange={(v) => patchKfa({ nie: v || undefined })}
              placeholder="mis. DBL7613500410A1"
              className="font-mono"
              maxW="max-w-[320px]"
              accent="violet"
            />
          </Field>
        </div>
      </SectionGroup>

      {/* 3 · Zat Aktif & Dosis (Grup 2) */}
      <SectionGroup
        title="Grup 2 · Zat Aktif (BZA) & Dosis"
        desc="Bahan Zat Aktif (kode 91xxxxxx) + kekuatan per satuan. Bisa lebih dari satu."
        icon={<FlaskConical size={12} />}
        action={
          <button
            type="button"
            onClick={addIngredient}
            className="flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white transition hover:bg-indigo-500"
          >
            <PlusCircle size={12} /> Tambah
          </button>
        }
      >
        {m.zatAktif.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-3">
            <FlaskConical size={16} className="shrink-0 text-slate-400" />
            <p className="text-[11px] leading-snug text-slate-500">
              Belum ada zat aktif. Pilih produk dari pencarian KFA untuk mengisi otomatis, atau
              tambah manual.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {m.zatAktif.map((z, i) => (
              <IngredientCard
                key={i}
                index={i}
                ing={z}
                onChange={(patch) => updateIngredient(i, patch)}
                onRemove={() => removeIngredient(i)}
              />
            ))}
          </div>
        )}
      </SectionGroup>

      {/* 4 · FHIR preview */}
      <KfaFhirPreview obat={draft} />
    </motion.div>
  );
}

// ── Sub-components ────────────────────────────────────────

function StatusBanner({
  mapping: m, mapped, onClear,
}: {
  mapping: KfaMapping;
  mapped: boolean;
  onClear: () => void;
}) {
  if (!mapped) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2.5">
        <Info size={16} className="mt-0.5 shrink-0 text-indigo-600" />
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-indigo-800">Belum dipetakan ke KFA</p>
          <p className="mt-0.5 text-[10px] leading-snug text-indigo-700/80">
            Pemetaan ke Kamus Farmasi & Alkes diperlukan agar obat ini dapat dikirim ke
            SatuSehat (FHIR <span className="font-mono">Medication</span>). Cari produknya di bawah.
          </p>
        </div>
      </div>
    );
  }

  const fromApi = m.sumber === "KFA_API";
  return (
    <div className="flex items-start justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5">
      <div className="flex items-start gap-2.5 min-w-0">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[12px] font-bold text-emerald-800">Terpetakan ke KFA</p>
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0 text-[9px] font-bold",
              fromApi ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600",
            )}>
              {fromApi ? <Sparkles size={9} /> : null}
              {fromApi ? "Dari KFA" : "Manual"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[10px] text-emerald-700/80">
            {m.poaNama ?? m.povNama}
            {m.poaKode && <span className="ml-1 font-mono">· POA {m.poaKode}</span>}
            {m.mappedAt && <span className="ml-1">· {fmtWaktu(m.mappedAt)}</span>}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="flex shrink-0 items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
      >
        <RotateCcw size={11} /> Reset
      </button>
    </div>
  );
}

function IngredientCard({
  index, ing, onChange, onRemove,
}: {
  index: number;
  ing: KfaMappedIngredient;
  onChange: (patch: Partial<KfaMappedIngredient>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
          <FlaskConical size={10} /> BZA #{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Hapus zat aktif ${index + 1}`}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Field label="Kode BZA" hint="91xxxxxx">
          <TextInput
            value={ing.kode}
            onChange={(v) => onChange({ kode: v })}
            placeholder="91000101"
            className="font-mono"
            maxW="max-w-full"
            accent="violet"
          />
        </Field>
        <Field label="Nama Zat Aktif" className="col-span-1">
          <TextInput
            value={ing.display}
            onChange={(v) => onChange({ display: v })}
            placeholder="Parasetamol"
            maxW="max-w-full"
            accent="violet"
          />
        </Field>
        <Field label="Dosis">
          <NumberInput
            value={ing.dosis}
            onChange={(v) => onChange({ dosis: v })}
            placeholder="500"
            step={1}
            maxW="max-w-full"
            accent="violet"
          />
        </Field>
        <Field label="Satuan KFA" hint="UCUM">
          <TextInput
            value={ing.satuan ?? ""}
            onChange={(v) => onChange({ satuan: v || undefined })}
            placeholder="mg"
            maxW="max-w-full"
            accent="violet"
          />
        </Field>
        <Field label="Dosis per Satuan" className="col-span-2 lg:col-span-4">
          <TextInput
            value={ing.dosisPerSatuan ?? ""}
            onChange={(v) => onChange({ dosisPerSatuan: v || undefined })}
            placeholder="500 mg / 1 tablet"
            maxW="max-w-full"
            accent="violet"
          />
        </Field>
      </div>
    </div>
  );
}

function fmtWaktu(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
