"use client";

import { useEffect, useRef, useState } from "react";
import { IdCard, Scan, Timer, Clock4, Search, X, Loader2, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  RadCatalogRecord, RadRegion, RadKategori, RadStatus,
} from "@/lib/master/radCatalogMock";
import {
  MODALITAS_CFG, MODALITAS_ORDER, MODALITAS_LABEL, MODALITAS_SUBTYPE,
  REGION_LABEL, REGION_ORDER,
} from "../katalogRadiologiShared";
import {
  Field, TextInput, NumberInput, TextArea, Select, SectionGroup, ChipToggle,
} from "@/components/master/shared";
import { listIcd, type IcdDTO } from "@/lib/api/master/icd";

interface Props {
  draft: RadCatalogRecord;
  onPatch: (p: Partial<RadCatalogRecord>) => void;
}

const KATEGORI_OPTIONS: { value: RadKategori; label: string }[] = [
  { value: "Diagnostik", label: "Diagnostik" },
  { value: "Intervensi", label: "Intervensi" },
  { value: "Skrining",   label: "Skrining" },
];

const STATUS_OPTIONS: { value: RadStatus; label: string }[] = [
  { value: "Aktif",     label: "Aktif" },
  { value: "Non_Aktif", label: "Non-Aktif" },
];

export default function IdentitasTab({ draft, onPatch }: Props) {
  const updateTat = <K extends keyof RadCatalogRecord["tatTargetMenit"]>(
    key: K, value: number,
  ) => {
    onPatch({ tatTargetMenit: { ...draft.tatTargetMenit, [key]: value } });
  };

  const subtypeOptions = MODALITAS_SUBTYPE[draft.modalitas] ?? [];

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {/* Identitas Dasar */}
      <SectionGroup title="Identitas Dasar" icon={<IdCard size={11} />}>
        <div className="flex flex-col gap-3">
          <Field label="Nama Pemeriksaan" required>
            <TextInput
              value={draft.nama}
              onChange={(v) => onPatch({ nama: v })}
              placeholder="Mis. CT Thorax dengan Kontras"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Kode Katalog" hint="otomatis dibuat sistem">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                <Hash size={11} className="shrink-0 text-slate-400" />
                <span className="font-mono text-[12px] font-semibold text-slate-600">
                  {draft.kode || "Auto · RAD-NNNN"}
                </span>
              </div>
            </Field>
            <Field label="Kategori">
              <Select<RadKategori>
                value={draft.kategori}
                onChange={(v) => v && onPatch({ kategori: v })}
                options={KATEGORI_OPTIONS}
                maxW="max-w-[200px]"
              />
            </Field>
          </div>
          <Field label="Kode ICD-9-CM" hint="Opsional — ketik manual atau cari dari master ICD Tindakan">
            <IcdPicker
              value={draft.kodeIcd ?? ""}
              onChange={(v) => onPatch({ kodeIcd: v || undefined })}
            />
          </Field>
          <Field label="Deskripsi Singkat" hint="Tampil di card hover, max 200 karakter">
            <TextArea
              value={draft.deskripsi ?? ""}
              onChange={(v) => onPatch({ deskripsi: v.slice(0, 200) })}
              rows={3}
              placeholder="Indikasi utama, lini pertama untuk apa, peringatan klinis singkat..."
            />
          </Field>
        </div>
      </SectionGroup>

      {/* Modalitas & Region */}
      <SectionGroup title="Modalitas & Region" icon={<Scan size={11} />}>
        <div className="flex flex-col gap-3">
          <Field label="Modalitas (FHIR SatuSehat)" required>
            <div className="flex flex-wrap gap-1.5">
              {MODALITAS_ORDER.map((m) => {
                const cfg = MODALITAS_CFG[m];
                const active = draft.modalitas === m;
                const Icon = cfg.icon;
                return (
                  <button
                    key={m}
                    type="button"
                    title={MODALITAS_LABEL[m]}
                    // Ganti modalitas → reset subtype (subtype terikat method).
                    onClick={() => onPatch({ modalitas: m, modalitasSubtype: undefined })}
                    className={cnBtn(active, cfg.bg, cfg.text)}
                  >
                    <Icon size={11} />
                    {cfg.short}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Subtype Method" hint="Opsional — sesuai daftar SatuSehat per modalitas">
            <Select<string>
              value={draft.modalitasSubtype ?? ""}
              onChange={(v) => onPatch({ modalitasSubtype: v || undefined })}
              options={[
                { value: "", label: "— Tidak ada —" },
                ...subtypeOptions.map((s) => ({ value: s, label: s })),
              ]}
              maxW="max-w-[260px]"
            />
          </Field>
          <Field label="Region Tubuh">
            <Select<RadRegion>
              value={draft.region}
              onChange={(v) => v && onPatch({ region: v })}
              options={REGION_ORDER.map((r) => ({ value: r, label: REGION_LABEL[r] }))}
              maxW="max-w-[260px]"
            />
          </Field>
          <Field label="Status">
            <ChipToggle<RadStatus>
              value={draft.status}
              onChange={(v) => onPatch({ status: v })}
              options={STATUS_OPTIONS}
              accent="rose"
            />
          </Field>
        </div>
      </SectionGroup>

      {/* Timing — full width */}
      <div className="lg:col-span-2">
        <SectionGroup
          title="Estimasi & TAT Target"
          icon={<Timer size={11} />}
          desc="Estimasi durasi prosedur dan target Turn-Around Time per urgensi (menit, dari akuisisi sampai laporan rilis)"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Estimasi Prosedur" required hint="menit (akuisisi)">
              <NumberInput
                value={draft.estimasiWaktuMenit}
                onChange={(v) => onPatch({ estimasiWaktuMenit: v ?? 0 })}
                min={1}
                max={480}
                suffix="mnt"
                maxW="max-w-[150px]"
              />
            </Field>
            <Field label="TAT CITO" hint="≤ menit">
              <NumberInput
                value={draft.tatTargetMenit.cito}
                onChange={(v) => updateTat("cito", v ?? 0)}
                min={1}
                suffix="mnt"
                maxW="max-w-[150px]"
              />
            </Field>
            <Field label="TAT Semi-Cito" hint="≤ menit">
              <NumberInput
                value={draft.tatTargetMenit.semiCito}
                onChange={(v) => updateTat("semiCito", v ?? 0)}
                min={1}
                suffix="mnt"
                maxW="max-w-[150px]"
              />
            </Field>
            <Field label="TAT Rutin" hint="≤ menit">
              <NumberInput
                value={draft.tatTargetMenit.rutin}
                onChange={(v) => updateTat("rutin", v ?? 0)}
                min={1}
                suffix="mnt"
                maxW="max-w-[150px]"
              />
            </Field>
          </div>

          {/* Preview info */}
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
            <Clock4 size={12} className="text-slate-400" />
            <p className="text-[10.5px] text-slate-600">
              <strong className="text-slate-800">{draft.estimasiWaktuMenit || 0} mnt</strong> prosedur ·
              CITO <strong className="text-rose-700">{draft.tatTargetMenit.cito}</strong> /
              Semi-Cito <strong className="text-amber-700">{draft.tatTargetMenit.semiCito}</strong> /
              Rutin <strong className="text-slate-700">{draft.tatTargetMenit.rutin}</strong> mnt
            </p>
          </div>
        </SectionGroup>
      </div>
    </div>
  );
}

// ── ICD-9-CM picker (manual + async search master ICD) ────────────────────────

function IcdPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<IcdDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search ke master ICD (jenis ICD-9 = prosedur "ICD Tindakan"). Tak ada setState
  // sinkron di body effect — fetch/clear hanya di dalam timeout (async) → cegah cascading render.
  useEffect(() => {
    const q = value.trim();
    if (!open || q.length < 2) return; // hasil lama disembunyikan oleh render gate
    const ac = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      listIcd({ jenis: "ICD-9", q, status: "Aktif", limit: 8 }, ac.signal)
        .then(({ items }) => setResults(items))
        .catch(() => { /* abaikan (manual entry tetap jalan) */ })
        .finally(() => setLoading(false));
    }, 250);
    return () => { ac.abort(); clearTimeout(t); };
  }, [value, open]);

  const showResults = open && value.trim().length >= 2 && results.length > 0;

  // Tutup dropdown saat klik di luar.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={boxRef} className="relative max-w-90">
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100">
        <Search size={12} className="shrink-0 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Mis. 87.41 atau ketik nama prosedur"
          className="w-full bg-transparent py-1.5 font-mono text-[12px] text-slate-800 outline-none placeholder:font-sans placeholder:text-slate-400"
        />
        {loading && <Loader2 size={12} className="shrink-0 animate-spin text-slate-400" />}
        {value && !loading && (
          <button
            type="button"
            onClick={() => { onChange(""); setResults([]); }}
            className="shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kosongkan kode ICD"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {showResults && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => { onChange(r.kode); setOpen(false); }}
                className="flex w-full items-start gap-2 px-2.5 py-1.5 text-left transition hover:bg-rose-50"
              >
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                  {r.kode}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-slate-600">{r.nama}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Helper ──
function cnBtn(active: boolean, bgActive: string, textActive: string) {
  return cn(
    "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-rose-200",
    active
      ? `${bgActive} ${textActive} border-transparent ring-1 ring-current`
      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
  );
}
