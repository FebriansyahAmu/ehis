"use client";

import { motion } from "framer-motion";
import {
  type ObatRecord, type ObatKategori, type SediaanBentuk,
  type SatuanTerkecil, type RutePemberian,
  OBAT_KATEGORI_CFG, KATEGORI_OBAT_ORDER, BENTUK_CFG, RUTE_CFG, SATUAN_LIST,
} from "@/lib/master/obatMock";
import {
  Field, TextInput, Select, SectionGroup,
} from "@/components/master/shared";

interface IdentitasTabProps {
  draft: ObatRecord;
  onPatch: (patch: Partial<ObatRecord>) => void;
}

export default function IdentitasTab({ draft, onPatch }: IdentitasTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3"
    >
      {/* Section 1: Identitas Dasar */}
      <SectionGroup
        title="Identitas Dasar"
        desc="Kode unik, nama generik (INN), nama dagang, dan produsen."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Kode" required hint="ATC code / kode internal RS">
            <TextInput
              value={draft.kode}
              onChange={(v) => onPatch({ kode: v })}
              placeholder="contoh: J01CR02"
              maxW="max-w-[220px]"
              className="font-mono"
            />
          </Field>
          <Field label="Kategori Terapeutik" required>
            <Select<ObatKategori>
              value={draft.kategori}
              onChange={(v) => v && onPatch({ kategori: v })}
              options={KATEGORI_OBAT_ORDER.map((k) => ({
                value: k,
                label: OBAT_KATEGORI_CFG[k].label,
              }))}
              maxW="max-w-[260px]"
            />
          </Field>
          <Field label="Nama Generik (INN)" required>
            <TextInput
              value={draft.namaGenerik}
              onChange={(v) => onPatch({ namaGenerik: v })}
              placeholder="contoh: Amoxicillin"
              maxW="max-w-[360px]"
            />
          </Field>
          <Field label="Nama Dagang" required>
            <TextInput
              value={draft.namaDagang}
              onChange={(v) => onPatch({ namaDagang: v })}
              placeholder="contoh: Amoxsan"
              maxW="max-w-[360px]"
            />
          </Field>
          <Field label="Pabrik / Produsen" hint="opsional">
            <TextInput
              value={draft.pabrik ?? ""}
              onChange={(v) => onPatch({ pabrik: v || undefined })}
              placeholder="contoh: Sanbe Farma"
              maxW="max-w-[360px]"
            />
          </Field>
        </div>
      </SectionGroup>

      {/* Section 2: Sediaan & Rute */}
      <SectionGroup
        title="Sediaan & Rute Pemberian"
        desc="Bentuk fisik, kekuatan dosis, satuan terkecil, dan rute administrasi utama."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Bentuk Sediaan" required>
            <Select<SediaanBentuk>
              value={draft.bentuk}
              onChange={(v) => v && onPatch({ bentuk: v })}
              options={(Object.keys(BENTUK_CFG) as SediaanBentuk[]).map((b) => ({
                value: b,
                label: BENTUK_CFG[b].label,
              }))}
              maxW="max-w-full"
            />
          </Field>
          <Field label="Kekuatan" required hint="mis. 500 mg, 10 mg/ml">
            <TextInput
              value={draft.kekuatan}
              onChange={(v) => onPatch({ kekuatan: v })}
              placeholder="500 mg"
              maxW="max-w-full"
            />
          </Field>
          <Field label="Satuan Terkecil" hint="unit dispense">
            <Select<SatuanTerkecil>
              value={draft.satuanTerkecil}
              onChange={(v) => onPatch({ satuanTerkecil: v })}
              options={SATUAN_LIST.map((s) => ({ value: s, label: s }))}
              placeholder="— pilih satuan —"
              maxW="max-w-full"
            />
          </Field>
          <Field label="Rute Pemberian" hint="utama, bukan semua rute mungkin">
            <Select<RutePemberian>
              value={draft.rute}
              onChange={(v) => onPatch({ rute: v })}
              options={(Object.keys(RUTE_CFG) as RutePemberian[]).map((r) => ({
                value: r,
                label: `${RUTE_CFG[r].short} — ${RUTE_CFG[r].label}`,
              }))}
              placeholder="— pilih rute —"
              maxW="max-w-full"
            />
          </Field>
        </div>
      </SectionGroup>

      {/* Live Preview */}
      <SectionGroup title="Preview Identitas" desc="Cara obat ini muncul di resep & daftar order.">
        <PreviewCard draft={draft} />
      </SectionGroup>
    </motion.div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PreviewCard({ draft }: { draft: ObatRecord }) {
  const catCfg = OBAT_KATEGORI_CFG[draft.kategori];
  const bentukCfg = BENTUK_CFG[draft.bentuk];
  const ruteLabel = draft.rute ? RUTE_CFG[draft.rute].short : null;

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5">
      <div className="flex items-start gap-3">
        <span className={cnClass("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold m-tiny", catCfg.bg, catCfg.text)}>
          {draft.bentuk.slice(0, 3).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-sm font-bold text-slate-800">
            {draft.namaGenerik || <span className="italic text-slate-400">Nama generik...</span>}
          </p>
          <p className="m-mini text-slate-500">
            {draft.namaDagang || "—"}{draft.pabrik && ` · ${draft.pabrik}`}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {draft.kode && (
              <span className="rounded bg-white px-1.5 py-0 m-mini font-mono text-slate-500 ring-1 ring-slate-200">
                {draft.kode}
              </span>
            )}
            <span className={cnClass("rounded px-1.5 py-0 m-mini font-semibold", catCfg.bg, catCfg.text)}>
              {catCfg.short}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0 m-mini font-semibold text-slate-600">
              {bentukCfg.short}
            </span>
            <span className="m-mini font-semibold text-slate-600">{draft.kekuatan || "—"}</span>
            {ruteLabel && (
              <span className="rounded bg-sky-50 px-1.5 py-0 m-mini font-semibold text-sky-700">
                {ruteLabel}
              </span>
            )}
            {draft.satuanTerkecil && (
              <span className="m-mini italic text-slate-400">/ {draft.satuanTerkecil}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Local cn helper — avoid circular import
function cnClass(...arr: (string | false | null | undefined)[]) {
  return arr.filter(Boolean).join(" ");
}
