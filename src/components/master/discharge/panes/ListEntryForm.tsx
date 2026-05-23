"use client";

import { useState, useMemo } from "react";
import { Save, X, AlertCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field, TextInput, NumberInput, TextArea, Select, SectionGroup,
} from "@/components/master/shared";
import {
  type DischargeListEntry, isListEntryValid,
} from "@/lib/master/dischargeKlasifikasiMock";
import { suggestKode } from "../dischargeShared";

interface Props {
  initial: DischargeListEntry;
  onSave: (entry: DischargeListEntry) => void;
  onCancel: () => void;
  existingKodes: string[];
  hasRequired?: boolean;
  hasSublabel?: boolean;
  mode: "create" | "edit";
}

export default function ListEntryForm({
  initial, onSave, onCancel, existingKodes, hasRequired, hasSublabel, mode,
}: Props) {
  const [draft, setDraft] = useState<DischargeListEntry>(initial);
  const [kodeManual, setKodeManual] = useState(mode === "edit");

  const patch = <K extends keyof DischargeListEntry>(k: K, v: DischargeListEntry[K]) =>
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

  const canSave = isListEntryValid(draft) && !kodeError;

  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-3 shadow-sm">
      <SectionGroup
        title={mode === "create" ? "Entri Baru" : `Edit: ${initial.label}`}
        accent={{ bg: "bg-emerald-50", text: "text-emerald-700" }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Label */}
          <Field label="Label" required hint="Nama tampil di UI workflow">
            <TextInput
              value={draft.label}
              onChange={updateLabel}
              placeholder="mis. Perawatan Luka"
              accent="emerald"
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
                placeholder="PERAWATAN_LUKA"
                className={cn(
                  "w-full max-w-[200px] rounded-md border bg-white px-2.5 py-1.5 font-mono text-xs text-slate-800 outline-none transition",
                  kodeError
                    ? "border-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-200"
                    : "border-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200",
                )}
              />
              {kodeError && <AlertCircle size={13} className="shrink-0 text-rose-500" />}
            </div>
          </Field>

          {/* Sublabel (Checklist only) */}
          {hasSublabel && (
            <div className="sm:col-span-2">
              <Field label="Sublabel" hint="Penjelasan singkat di bawah label (untuk checklist)">
                <TextInput
                  value={draft.sublabel ?? ""}
                  onChange={(v) => patch("sublabel", v)}
                  placeholder="mis. Semua topik esensial sudah diberikan dan dipahami"
                  accent="emerald"
                  maxW="max-w-2xl"
                />
              </Field>
            </div>
          )}

          {/* Deskripsi */}
          {!hasSublabel && (
            <div className="sm:col-span-2">
              <Field label="Deskripsi" hint="Penjelasan lengkap tentang entri ini (opsional)">
                <TextArea
                  value={draft.deskripsi ?? ""}
                  onChange={(v) => patch("deskripsi", v)}
                  placeholder="mis. Ganti perban, debridemen ringan, evaluasi penyembuhan."
                  rows={2}
                  accent="emerald"
                />
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
              accent="emerald"
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
              accent="emerald"
              maxW="max-w-[160px]"
            />
          </Field>

          {/* Required (Checklist only) */}
          {hasRequired && (
            <div className="sm:col-span-2">
              <Field label="Tingkat Kewajiban" hint="Wajib = harus terkonfirmasi sebelum pasien boleh pulang">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => patch("required", true)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-semibold transition",
                      draft.required
                        ? "border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}
                  >
                    <Star size={11} className={draft.required ? "fill-current" : ""} />
                    Wajib
                  </button>
                  <button
                    type="button"
                    onClick={() => patch("required", false)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-semibold transition",
                      !draft.required
                        ? "border-slate-400 bg-slate-50 text-slate-700 ring-1 ring-slate-200"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}
                  >
                    Opsional
                  </button>
                </div>
              </Field>
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Preview</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200">
              {draft.label || "(label kosong)"}
            </span>
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600 ring-1 ring-slate-200">
              {draft.kode || "(kode)"}
            </code>
            {hasRequired && draft.required && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                <Star size={9} className="fill-current" /> Wajib
              </span>
            )}
            {draft.status === "NonAktif" && (
              <span className="rounded-full bg-slate-200 px-1.5 text-[9px] font-bold uppercase text-slate-600">off</span>
            )}
          </div>
          {hasSublabel && draft.sublabel && (
            <p className="mt-1.5 text-[10.5px] leading-snug text-slate-500">{draft.sublabel}</p>
          )}
          {!hasSublabel && draft.deskripsi && (
            <p className="mt-1.5 text-[10.5px] leading-snug text-slate-500">{draft.deskripsi}</p>
          )}
        </div>

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
                ? "bg-emerald-600 hover:bg-emerald-700"
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
