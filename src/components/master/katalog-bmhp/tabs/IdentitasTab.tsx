"use client";

import { motion } from "framer-motion";
import {
  type BmhpRecord, type BmhpKategori, type BmhpSatuan,
  BMHP_KATEGORI_CFG, KATEGORI_BMHP_ORDER, SATUAN_BMHP_LIST,
} from "@/lib/master/bmhpMock";
import {
  Field, TextInput, NumberInput, Select, SectionGroup,
} from "@/components/master/shared";

interface IdentitasTabProps {
  draft: BmhpRecord;
  onPatch: (patch: Partial<BmhpRecord>) => void;
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
        desc="Nama barang, merek/dagang, kategori inventaris, dan produsen."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Kategori" required>
            <Select<BmhpKategori>
              value={draft.kategori}
              onChange={(v) => v && onPatch({ kategori: v })}
              options={KATEGORI_BMHP_ORDER.map((k) => ({
                value: k,
                label: BMHP_KATEGORI_CFG[k].label,
              }))}
              accent="teal"
              maxW="max-w-[260px]"
            />
          </Field>
          <Field label="Nama Barang" required>
            <TextInput
              value={draft.nama}
              onChange={(v) => onPatch({ nama: v })}
              placeholder="contoh: Spuit 3 cc"
              accent="teal"
              maxW="max-w-[360px]"
            />
          </Field>
          <Field label="Merek / Dagang" hint="opsional">
            <TextInput
              value={draft.merek ?? ""}
              onChange={(v) => onPatch({ merek: v || undefined })}
              placeholder="contoh: Terumo"
              accent="teal"
              maxW="max-w-[360px]"
            />
          </Field>
          <Field label="Pabrik / Produsen" hint="opsional">
            <TextInput
              value={draft.pabrik ?? ""}
              onChange={(v) => onPatch({ pabrik: v || undefined })}
              placeholder="contoh: Terumo Indonesia"
              accent="teal"
              maxW="max-w-[360px]"
            />
          </Field>
        </div>
      </SectionGroup>

      {/* Section 2: Ukuran & Kemasan */}
      <SectionGroup
        title="Ukuran & Kemasan"
        desc="Size/ukuran fisik, satuan terkecil dispense, dan isi per kemasan."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Ukuran / Size" hint="mis. 3 cc, No. 7, Fr 16, 16x16 cm">
            <TextInput
              value={draft.ukuran ?? ""}
              onChange={(v) => onPatch({ ukuran: v || undefined })}
              placeholder="3 cc"
              accent="teal"
              maxW="max-w-full"
            />
          </Field>
          <Field label="Satuan Terkecil" required hint="unit dispense">
            <Select<BmhpSatuan>
              value={draft.satuan}
              onChange={(v) => v && onPatch({ satuan: v })}
              options={SATUAN_BMHP_LIST.map((s) => ({ value: s, label: s }))}
              accent="teal"
              maxW="max-w-full"
            />
          </Field>
          <Field label="Isi per Kemasan" hint="qty per box/pak (opsional)">
            <NumberInput
              value={draft.isiPerKemasan}
              onChange={(v) => onPatch({ isiPerKemasan: v })}
              placeholder="0"
              step={1}
              accent="teal"
              maxW="max-w-full"
            />
          </Field>
        </div>
      </SectionGroup>

      {/* Live Preview */}
      <SectionGroup title="Preview Identitas" desc="Cara barang ini muncul di daftar order & billing.">
        <PreviewCard draft={draft} />
      </SectionGroup>
    </motion.div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PreviewCard({ draft }: { draft: BmhpRecord }) {
  const catCfg = BMHP_KATEGORI_CFG[draft.kategori];

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5">
      <div className="flex items-start gap-3">
        <span className={cnClass("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold m-tiny", catCfg.bg, catCfg.text)}>
          {catCfg.short.slice(0, 3).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-sm font-bold text-slate-800">
            {draft.nama || <span className="italic text-slate-400">Nama barang...</span>}
          </p>
          <p className="m-mini text-slate-500">
            {draft.merek || "—"}{draft.pabrik && ` · ${draft.pabrik}`}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={cnClass("rounded px-1.5 py-0 m-mini font-semibold", catCfg.bg, catCfg.text)}>
              {catCfg.short}
            </span>
            {draft.ukuran && (
              <span className="rounded bg-slate-100 px-1.5 py-0 m-mini font-semibold text-slate-600">
                {draft.ukuran}
              </span>
            )}
            <span className="m-mini italic text-slate-400">/ {draft.satuan}</span>
            {draft.isiPerKemasan ? (
              <span className="m-mini text-slate-400">isi {draft.isiPerKemasan}</span>
            ) : null}
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
