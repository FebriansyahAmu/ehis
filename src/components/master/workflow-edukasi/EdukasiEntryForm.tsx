"use client";

import { useState, useMemo } from "react";
import { Save, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field, TextInput, NumberInput, TextArea, Select, SectionGroup,
} from "@/components/master/shared";
import {
  type EdukasiEntry, type EdukasiCollection,
  type TopikKategori, type PemahamanTone, type TandaBahayaKondisi,
  KATEGORI_LIST, KATEGORI_CFG,
  TONE_LIST, TONE_CFG,
  KONDISI_LIST, KONDISI_CFG,
  isEdukasiEntryValid,
} from "@/lib/master/edukasiMock";
import { suggestKode } from "./edukasiShared";

interface Props {
  collection: EdukasiCollection;
  initial: EdukasiEntry;
  onSave: (entry: EdukasiEntry) => void;
  onCancel: () => void;
  existingKodes: string[];
  mode: "create" | "edit";
}

export default function EdukasiEntryForm({
  collection, initial, onSave, onCancel, existingKodes, mode,
}: Props) {
  const [draft, setDraft] = useState<EdukasiEntry>(initial);
  const [kodeManual, setKodeManual] = useState(mode === "edit");

  const patch = <K extends keyof EdukasiEntry>(k: K, v: EdukasiEntry[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  const updateLabel = (label: string) => {
    setDraft((p) => ({
      ...p,
      label,
      kode: kodeManual ? p.kode : suggestKode(label),
    }));
  };

  const kodeError = useMemo(() => {
    if (!draft.kode.trim()) return "Kode wajib diisi";
    if (existingKodes.includes(draft.kode)) return "Kode sudah dipakai entri lain";
    if (!/^[A-Z0-9_]+$/.test(draft.kode)) return "Hanya huruf besar, angka, underscore";
    return "";
  }, [draft.kode, existingKodes]);

  const canSave = isEdukasiEntryValid(draft) && !kodeError;

  return (
    <div className="rounded-lg border border-amber-200 bg-white p-3 shadow-sm">
      <SectionGroup
        title={mode === "create" ? "Entri Baru" : `Edit: ${initial.label}`}
        accent={{ bg: "bg-amber-50", text: "text-amber-700" }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Label */}
          <Field label="Label" required hint="Nama tampil di UI workflow">
            <TextInput
              value={draft.label}
              onChange={updateLabel}
              placeholder={`mis. ${exampleLabelFor(collection)}`}
              accent="amber"
              maxW="max-w-sm"
            />
          </Field>

          {/* Kode */}
          <Field label="Kode" required hint={kodeError || "Auto-generate dari label. Edit untuk override."}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draft.kode}
                onChange={(e) => {
                  setKodeManual(true);
                  patch("kode", e.target.value.toUpperCase().replace(/\s+/g, "_"));
                }}
                placeholder={exampleKodeFor(collection)}
                className={cn(
                  "w-full max-w-[200px] rounded-md border bg-white px-2.5 py-1.5 font-mono text-xs text-slate-800 outline-none transition",
                  kodeError
                    ? "border-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-200"
                    : "border-slate-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-200",
                )}
              />
              {kodeError && <AlertCircle size={13} className="shrink-0 text-rose-500" />}
            </div>
          </Field>

          {/* Deskripsi — full width */}
          <div className="sm:col-span-2">
            <Field label="Deskripsi" hint="Penjelasan singkat tentang entri ini (opsional)">
              <TextArea
                value={draft.deskripsi ?? ""}
                onChange={(v) => patch("deskripsi", v)}
                placeholder="mis. Penjelasan kondisi klinis saat ini kepada pasien/keluarga"
                rows={2}
                accent="amber"
              />
            </Field>
          </div>

          {/* Conditional: Kategori */}
          {collection.hasKategori && (
            <div className="sm:col-span-2">
              <Field label="Kategori" required hint="Kelompok topik — Medis / Farmasi / Nutrisi / dll">
                <div className="flex flex-wrap gap-1.5">
                  {KATEGORI_LIST.map((k) => {
                    const cfg = KATEGORI_CFG[k];
                    const active = draft.kategori === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => patch("kategori", k)}
                        className={cn(
                          "flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-semibold transition",
                          active
                            ? cn(cfg.chip, "border-current ring-1 ring-amber-100")
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        )}
                      >
                        <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                        {k}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}

          {/* Conditional: Tone */}
          {collection.hasTone && (
            <div className="sm:col-span-2">
              <Field label="Tone Warna" required hint="Warna semantik untuk visualisasi tingkat pemahaman">
                <div className="flex flex-wrap gap-2">
                  {TONE_LIST.map((t) => {
                    const cfg = TONE_CFG[t];
                    const active = draft.tone === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => patch("tone", t)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition",
                          active
                            ? cn(cfg.chip, "border-current ring-1", cfg.ring)
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        )}
                      >
                        <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}

          {/* Conditional: Kondisi */}
          {collection.hasKondisi && (
            <div className="sm:col-span-2">
              <Field label="Kelompok Kondisi" required hint="Kelompok klinis tanda bahaya — untuk filter & pengelompokan di UI">
                <div className="flex flex-wrap gap-1.5">
                  {KONDISI_LIST.map((k) => {
                    const cfg = KONDISI_CFG[k];
                    const active = draft.kondisi === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => patch("kondisi", k)}
                        className={cn(
                          "flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-semibold transition",
                          active
                            ? cn(cfg.chip, "border-current ring-1 ring-amber-100")
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        )}
                      >
                        <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                        {k}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}

          {/* Urutan */}
          <Field label="Urutan" hint="Posisi tampil di list (kecil = atas)">
            <NumberInput
              value={draft.urutan}
              onChange={(v) => patch("urutan", v ?? 1)}
              min={1}
              max={99}
              accent="amber"
              maxW="max-w-[100px]"
            />
          </Field>

          {/* Status */}
          <Field label="Status" hint="Non-aktif menyembunyikan entri dari workflow">
            <Select
              value={draft.status}
              onChange={(v) => patch("status", v as "Aktif" | "NonAktif")}
              options={[
                { value: "Aktif", label: "Aktif" },
                { value: "NonAktif", label: "Non-Aktif" },
              ]}
              accent="amber"
              maxW="max-w-[160px]"
            />
          </Field>
        </div>

        {/* Live preview */}
        <PreviewBlock draft={draft} collection={collection} />

        {/* Actions */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <X size={11} className="mr-1 inline" />
            Batal
          </button>
          <button
            type="button"
            onClick={() => canSave && onSave(draft)}
            disabled={!canSave}
            className={cn(
              "flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition",
              canSave
                ? "bg-amber-600 hover:bg-amber-700"
                : "cursor-not-allowed bg-slate-300",
            )}
          >
            <Save size={11} />
            {mode === "create" ? "Tambah" : "Simpan Perubahan"}
          </button>
        </div>
      </SectionGroup>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function PreviewBlock({ draft, collection }: { draft: EdukasiEntry; collection: EdukasiCollection }) {
  const previewChipCfg = pickPreviewChip(draft, collection);

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Preview</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200">
          {draft.label || "(label kosong)"}
        </span>
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600 ring-1 ring-slate-200">
          {draft.kode || "(kode)"}
        </code>
        {previewChipCfg && (
          <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", previewChipCfg.chip)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", previewChipCfg.dot)} />
            {previewChipCfg.label}
          </span>
        )}
        {draft.status === "NonAktif" && (
          <span className="rounded-full bg-slate-200 px-1.5 text-[9px] font-bold uppercase text-slate-600">off</span>
        )}
      </div>
      {draft.deskripsi && (
        <p className="mt-1.5 text-[10.5px] leading-snug text-slate-500">{draft.deskripsi}</p>
      )}
    </div>
  );
}

function pickPreviewChip(
  draft: EdukasiEntry,
  collection: EdukasiCollection,
): { chip: string; dot: string; label: string } | null {
  if (collection.hasKategori && draft.kategori) {
    const cfg = KATEGORI_CFG[draft.kategori as TopikKategori];
    return { chip: cfg.chip, dot: cfg.dot, label: draft.kategori };
  }
  if (collection.hasTone && draft.tone) {
    const cfg = TONE_CFG[draft.tone as PemahamanTone];
    return { chip: cfg.chip, dot: cfg.dot, label: cfg.label };
  }
  if (collection.hasKondisi && draft.kondisi) {
    const cfg = KONDISI_CFG[draft.kondisi as TandaBahayaKondisi];
    return { chip: cfg.chip, dot: cfg.dot, label: draft.kondisi };
  }
  return null;
}

// ── Per-collection placeholder hints ────────────────────

function exampleLabelFor(c: EdukasiCollection): string {
  switch (c.key) {
    case "topik-edukasi":       return "Penjelasan Diagnosis";
    case "media-edukasi":       return "Leaflet";
    case "metode-edukasi":      return "Diskusi Dua Arah";
    case "hambatan-komunikasi": return "Gangguan Pendengaran";
    case "tingkat-pemahaman":   return "Perlu Pengulangan";
    case "tanda-bahaya":        return "Nyeri Dada Hebat";
    case "tipe-instruksi":      return "Instruksi Discharge";
  }
}

function exampleKodeFor(c: EdukasiCollection): string {
  switch (c.key) {
    case "topik-edukasi":       return "DIAGNOSIS";
    case "media-edukasi":       return "LEAFLET";
    case "metode-edukasi":      return "DISKUSI";
    case "hambatan-komunikasi": return "PENDENGARAN";
    case "tingkat-pemahaman":   return "PERLU_ULANG";
    case "tanda-bahaya":        return "NYERI_DADA";
    case "tipe-instruksi":      return "DISCHARGE";
  }
}
