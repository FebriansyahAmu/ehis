"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  TindakanRecord, TindakanKategori, TingkatKompleksitas,
} from "@/lib/master/tindakanMock";
import {
  KATEGORI_CFG, KATEGORI_ORDER, KOMPLEKSITAS_CFG,
} from "@/lib/master/tindakanMock";
import {
  Field, TextInput, TextArea, Select,
} from "@/components/master/shared";

interface Props {
  draft: TindakanRecord;
  isNew: boolean;
  onPatch: (patch: Partial<TindakanRecord>) => void;
}

const KATEGORI_OPTIONS = KATEGORI_ORDER.map((cat) => ({
  value: cat,
  label: KATEGORI_CFG[cat].label,
}));

const KOMPLEKSITAS_ORDER: TingkatKompleksitas[] = [
  "Sederhana", "Sedang", "Khusus", "Canggih",
];

export default function TindakanIdentitasTab({ draft, isNew, onPatch }: Props) {
  return (
    <div className="space-y-5">
      {/* Kode + Nama — kode disembunyikan saat entry baru */}
      {isNew ? (
        <Field label="Nama Tindakan" required>
          <TextInput
            value={draft.nama}
            onChange={(v) => onPatch({ nama: v })}
            placeholder="Nama lengkap tindakan medis..."
            accent="teal"
            maxW="max-w-full"
          />
        </Field>
      ) : (
        <div className="grid grid-cols-[180px_1fr] gap-4">
          <Field label="Kode ICD-9-CM" required>
            <TextInput
              value={draft.kode}
              onChange={(v) => onPatch({ kode: v })}
              placeholder="mis. 89.00"
              maxLength={12}
              accent="teal"
              className="font-mono"
              maxW="max-w-full"
            />
          </Field>
          <Field label="Nama Tindakan" required>
            <TextInput
              value={draft.nama}
              onChange={(v) => onPatch({ nama: v })}
              placeholder="Nama lengkap tindakan medis..."
              accent="teal"
              maxW="max-w-full"
            />
          </Field>
        </div>
      )}

      {/* Kategori */}
      <Field label="Kategori" required>
        <Select<TindakanKategori>
          value={draft.kategori}
          onChange={(v) => v && onPatch({ kategori: v })}
          options={KATEGORI_OPTIONS}
          accent="teal"
          maxW="max-w-[320px]"
        />
      </Field>

      {/* Kompleksitas — segmented buttons */}
      <Field label="Tingkat Kompleksitas" required>
        <div className="flex flex-wrap gap-2">
          {KOMPLEKSITAS_ORDER.map((k) => {
            const cfg = KOMPLEKSITAS_CFG[k];
            const active = draft.kompleksitas === k;
            return (
              <motion.button
                key={k}
                type="button"
                onClick={() => onPatch({ kompleksitas: k })}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-teal-200",
                  active
                    ? cn("border-transparent ring-1 ring-slate-200", cfg.bg, cfg.text)
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                {k}
              </motion.button>
            );
          })}
        </div>
      </Field>

      {/* Deskripsi */}
      <Field label="Deskripsi" hint="Opsional — prosedur singkat atau catatan klinis">
        <TextArea
          value={draft.deskripsi ?? ""}
          onChange={(v) => onPatch({ deskripsi: v })}
          placeholder="Deskripsi singkat prosedur, indikasi umum, persyaratan khusus..."
          rows={4}
          accent="teal"
        />
      </Field>

      {/* Status */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
        <div className="flex gap-2 max-w-75">
          {(["Aktif", "NonAktif"] as const).map((s) => {
            const active = (draft.status ?? "Aktif") === s;
            return (
              <motion.button
                key={s}
                type="button"
                onClick={() => onPatch({ status: s })}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-sm font-semibold transition outline-none focus-visible:ring-2",
                  active && s === "Aktif" && "border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 focus-visible:ring-emerald-200",
                  active && s === "NonAktif" && "border-transparent bg-slate-100 text-slate-600 ring-1 ring-slate-200 focus-visible:ring-slate-200",
                  !active && "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 focus-visible:ring-slate-200",
                )}
              >
                {s === "Aktif" ? "Aktif" : "Non-Aktif"}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
