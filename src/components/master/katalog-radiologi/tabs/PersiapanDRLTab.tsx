"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Droplets, AlertTriangle, Plus, X, BookOpen, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  RadCatalogRecord, RadJenisKontras, PersiapanProtap, KontrasInfo, DRLReferensi,
} from "@/lib/master/radCatalogMock";
import {
  KONTRAS_LABEL, KONTRAS_ORDER, isDRLApplicable, MODALITAS_LABEL,
} from "../katalogRadiologiShared";
import {
  Field, TextInput, NumberInput, TextArea, Select, SectionGroup,
} from "@/components/master/shared";

interface Props {
  draft: RadCatalogRecord;
  onPatch: (p: Partial<RadCatalogRecord>) => void;
}

export default function PersiapanDRLTab({ draft, onPatch }: Props) {
  const patchPersiapan = (patch: Partial<PersiapanProtap>) =>
    onPatch({ persiapan: { ...draft.persiapan, ...patch } });

  const patchKontras = (patch: Partial<KontrasInfo>) =>
    onPatch({ kontras: { ...draft.kontras, ...patch } });

  const patchDRL = (patch: Partial<DRLReferensi>) =>
    onPatch({ drlReferensi: { ...(draft.drlReferensi ?? {}), ...patch } });

  const drlApplicable = isDRLApplicable(draft.modalitas);
  const usesKontras   = draft.kontras.jenis !== "Tanpa";

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {/* ── LEFT: Persiapan & Protap ─────────────────────── */}
      <SectionGroup
        title="Persiapan & Protap"
        icon={<ShieldAlert size={11} />}
        accent={{ bg: "bg-amber-50/60", text: "text-amber-700" }}
      >
        <div className="flex flex-col gap-3">
          <Field label="Puasa Pra-Pemeriksaan" hint="0 = tidak perlu puasa">
            <NumberInput
              value={draft.persiapan.puasaJam}
              onChange={(v) => patchPersiapan({ puasaJam: v })}
              min={0}
              max={24}
              suffix="jam"
              maxW="max-w-[150px]"
            />
          </Field>

          <Field label="Premedikasi" hint="Mis. steroid 13/7/1 jam pre-prosedur">
            <TextInput
              value={draft.persiapan.premedikasi ?? ""}
              onChange={(v) => patchPersiapan({ premedikasi: v })}
              placeholder="Methylprednisolone 32 mg PO H-13, H-7, H-1"
            />
          </Field>

          <Field label="Kontraindikasi" hint="Tekan Enter untuk menambah">
            <KontraindikasiInput
              items={draft.persiapan.kontraindikasi}
              onChange={(items) => patchPersiapan({ kontraindikasi: items })}
            />
          </Field>

          <Field label="Instruksi untuk Pasien">
            <TextArea
              value={draft.persiapan.instruksiPasien ?? ""}
              onChange={(v) => patchPersiapan({ instruksiPasien: v })}
              rows={3}
              placeholder="Lepas perhiasan logam. Pakai gown rumah sakit. Akses IV 18G di antecubital."
            />
          </Field>

          <Field label="Catatan Khusus">
            <TextArea
              value={draft.persiapan.catatanKhusus ?? ""}
              onChange={(v) => patchPersiapan({ catatanKhusus: v })}
              rows={2}
              placeholder="Cek kreatinin dalam 30 hari. Hidrasi pre & post."
            />
          </Field>
        </div>
      </SectionGroup>

      {/* ── RIGHT: Kontras + DRL stacked ─────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Kontras */}
        <SectionGroup
          title="Media Kontras"
          icon={<Droplets size={11} />}
          accent={{ bg: "bg-sky-50/60", text: "text-sky-700" }}
        >
          <div className="flex flex-col gap-3">
            <Field label="Jenis Kontras" required>
              <Select<RadJenisKontras>
                value={draft.kontras.jenis}
                onChange={(v) => v && patchKontras({ jenis: v })}
                options={KONTRAS_ORDER.map((k) => ({ value: k, label: KONTRAS_LABEL[k] }))}
                maxW="max-w-[240px]"
              />
            </Field>

            <AnimatePresence initial={false}>
              {usesKontras && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Field label="Dosis Kontras">
                      <NumberInput
                        value={draft.kontras.dosisMl}
                        onChange={(v) => patchKontras({ dosisMl: v })}
                        min={0}
                        max={500}
                        suffix="ml"
                      />
                    </Field>
                    <Field label="Kecepatan Injeksi" hint="ml/detik">
                      <NumberInput
                        value={draft.kontras.kecepatanInjeksiMlSec}
                        onChange={(v) => patchKontras({ kecepatanInjeksiMlSec: v })}
                        min={0}
                        max={10}
                        step={0.5}
                        suffix="ml/s"
                      />
                    </Field>
                  </div>

                  <PremedToggle
                    checked={!!draft.kontras.premedikasiSteroidJikaAlergi}
                    onChange={(v) => patchKontras({ premedikasiSteroidJikaAlergi: v })}
                  />

                  <Field label="Catatan Kontras" className="mt-3">
                    <TextArea
                      value={draft.kontras.catatan ?? ""}
                      onChange={(v) => patchKontras({ catatan: v })}
                      rows={2}
                      placeholder="Iohexol 300/350 mg/ml atau Iopromide 370 mg/ml"
                    />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SectionGroup>

        {/* DRL */}
        <SectionGroup
          title="Diagnostic Reference Level (DRL)"
          icon={<AlertTriangle size={11} />}
          accent={{ bg: "bg-rose-50/60", text: "text-rose-700" }}
          desc="PMK 1014/2008 — nilai maks. dewasa standar (60–80 kg)"
        >
          {!drlApplicable ? (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
              <Info size={14} className="mt-0.5 shrink-0 text-emerald-600" />
              <p className="text-[11px] leading-relaxed text-emerald-800">
                <strong>{MODALITAS_LABEL[draft.modalitas]}</strong> tidak menggunakan radiasi pengion —
                DRL tidak relevan. Lewati section ini.
              </p>
            </div>
          ) : (
            <DRLFields modalitas={draft.modalitas} value={draft.drlReferensi} onChange={patchDRL} />
          )}
        </SectionGroup>
      </div>
    </div>
  );
}

// ── Kontraindikasi Tag Input ──────────────────────────────

function KontraindikasiInput({
  items, onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [text, setText] = useState("");

  const add = () => {
    const v = text.trim();
    if (!v) return;
    if (items.includes(v)) {
      setText("");
      return;
    }
    onChange([...items, v]);
    setText("");
  };

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Mis. Hamil, Kreatinin >1.5"
          className="flex-1 max-w-[280px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
        <button
          type="button"
          onClick={add}
          disabled={!text.trim()}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          <Plus size={11} />
          Tambah
        </button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-center text-[10.5px] text-slate-400">
          Belum ada kontraindikasi tercatat
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence initial={false}>
            {items.map((kx, i) => (
              <motion.span
                key={kx + i}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10.5px] font-medium text-rose-700"
              >
                {kx}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-full p-0.5 text-rose-400 transition hover:bg-rose-100 hover:text-rose-700 outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                  aria-label={`Hapus ${kx}`}
                >
                  <X size={10} />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Premed Toggle ────────────────────────────────────────

function PremedToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "mt-3 flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
        checked
          ? "border-sky-200 bg-sky-50/70"
          : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <span className={cn(
        "relative mt-0.5 inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-sky-600" : "bg-slate-200",
      )}>
        <span className={cn(
          "inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-3.5" : "translate-x-0.5",
        )} />
      </span>
      <div className="min-w-0">
        <p className={cn("text-[11px] font-semibold", checked ? "text-sky-800" : "text-slate-700")}>
          Premedikasi steroid wajib jika riwayat alergi kontras
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
          Methylprednisolone 32 mg PO H-13, H-7, dan H-1 sebelum pemeriksaan. Standar ACR.
        </p>
      </div>
    </button>
  );
}

// ── DRL Fields (conditional per modalitas) ───────────────

function DRLFields({
  modalitas, value, onChange,
}: {
  modalitas: RadCatalogRecord["modalitas"];
  value: DRLReferensi | undefined;
  onChange: (patch: Partial<DRLReferensi>) => void;
}) {
  const v = value ?? {};

  const renderField = () => {
    if (modalitas === "CT") {
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="CTDIvol" hint="mGy">
            <NumberInput
              value={v.ctdiVol}
              onChange={(n) => onChange({ ctdiVol: n })}
              min={0}
              step={0.5}
              suffix="mGy"
            />
          </Field>
          <Field label="DLP" hint="mGy·cm">
            <NumberInput
              value={v.dlp}
              onChange={(n) => onChange({ dlp: n })}
              min={0}
              step={10}
              suffix="mGy·cm"
            />
          </Field>
        </div>
      );
    }
    if (modalitas === "RF") {
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="DAP" hint="Gy·cm²">
            <NumberInput
              value={v.dap}
              onChange={(n) => onChange({ dap: n })}
              min={0}
              step={0.5}
              suffix="Gy·cm²"
            />
          </Field>
          <Field label="Waktu Fluoroskopi" hint="menit">
            <NumberInput
              value={v.waktuFluoroMenit}
              onChange={(n) => onChange({ waktuFluoroMenit: n })}
              min={0}
              step={0.5}
              suffix="mnt"
            />
          </Field>
        </div>
      );
    }
    // XR / Mammografi (MG) / DXA / NM → Entrance Surface Dose (NM: proxy aktivitas)
    return (
      <Field label="Entrance Surface Dose" hint="mGy — DRL referensi dewasa">
        <NumberInput
          value={v.entranceDose}
          onChange={(n) => onChange({ entranceDose: n })}
          min={0}
          step={0.01}
          suffix="mGy"
          maxW="max-w-[200px]"
        />
      </Field>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {renderField()}

      <Field label="Sumber Referensi" hint="Standar / regulasi">
        <TextInput
          value={v.catatan ?? ""}
          onChange={(s) => onChange({ catatan: s })}
          placeholder="PMK 1014/2008 — DRL dewasa CT Thorax kontras"
        />
      </Field>

      {/* Reference card */}
      <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2">
        <BookOpen size={12} className="mt-0.5 shrink-0 text-rose-500" />
        <p className="text-[10px] leading-relaxed text-rose-800">
          DRL = nilai <strong>referensi maksimum</strong>, bukan batas absolut.
          Tujuan: identifikasi prosedur yang konsisten melebihi DRL → audit optimasi protokol.
          Pediatrik & extreme BMI butuh DRL lokal terpisah.
        </p>
      </div>
    </div>
  );
}
