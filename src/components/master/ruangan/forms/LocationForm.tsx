"use client";

import { useMemo, useState } from "react";
import { DoorOpen, Save, Trash2, ChevronRight, Layers, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LocationNode, type AnyNode, type BedSubRecord,
  LOCATION_TYPE_LABEL, type LocationType, type LocationKelas,
  getEffectiveAlamat, getAncestors, bedKodes,
} from "../ruanganShared";
import BedManagerPanel from "./BedManagerPanel";
import { Field, FormSection, fieldCls } from "./OrganizationForm";
import { Select, type SelectOption } from "@/components/shared/inputs/Select";

interface LocationFormProps {
  node: LocationNode;
  parentName: string;
  nodes: AnyNode[];
  onSave: (next: LocationNode) => void | Promise<void>;
  onDelete: (node: AnyNode) => void | Promise<void>;
}

// "Penunjang" sengaja TIDAK ditawarkan (deprecated) — dipecah jadi Laboratorium + Radiologi.
const LOCATION_TYPES: LocationType[] = [
  "Rawat_Inap", "Rawat_Jalan", "ICU", "HCU", "Isolasi", "IGD", "OK", "Laboratorium", "Radiologi", "Farmasi", "Gudang",
];
const KELAS_OPTIONS: LocationKelas[] = ["VIP", "Kelas_1", "Kelas_2", "Kelas_3", "—"];

// Opsi untuk global <Select> (value=enum, label human-readable).
const LOCATION_TYPE_OPTIONS: SelectOption[] = LOCATION_TYPES.map((t) => ({
  value: t,
  label: LOCATION_TYPE_LABEL[t],
}));
const KELAS_OPTIONS_SELECT: SelectOption[] = KELAS_OPTIONS.map((k) => ({
  value: k,
  label: k === "—" ? "Tidak Berlaku" : k.replace("_", " "),
}));

export default function LocationForm({
  node, parentName, nodes, onSave, onDelete,
}: LocationFormProps) {
  const [form, setForm] = useState<LocationNode>(node);
  const [overrideAlamat, setOverrideAlamat] = useState(!!node.alamatOverride);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const ancestors = useMemo(() => getAncestors(nodes, node), [nodes, node]);

  const update = <K extends keyof LocationNode>(key: K, value: LocationNode[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const inheritedAlamat = !overrideAlamat
    ? getEffectiveAlamat(nodes, { ...node, alamatOverride: undefined } as LocationNode)
    : null;

  const handleBedsChange = (beds: BedSubRecord[]) => {
    update("beds", beds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const next: LocationNode = {
      ...form,
      alamatOverride: overrideAlamat ? form.alamatOverride : undefined,
    };
    setSaving(true);
    try {
      await onSave(next);
      setDirty(false); // hanya reset bila sukses — gagal → tetap dirty untuk retry
    } catch {
      /* error sudah di-surface parent (alert) */
    } finally {
      setSaving(false);
    }
  };

  const canDelete = form.beds.length === 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Header + breadcrumb */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 ring-2 ring-sky-100">
              <DoorOpen size={16} className="text-sky-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-600">
                Ruangan
              </p>
              <h2 className="truncate text-sm font-bold text-slate-900">{form.name || "Ruangan Baru"}</h2>
              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                di bawah <span className="font-semibold text-slate-600">{parentName}</span>
              </p>
            </div>
          </div>
          {ancestors.length > 1 && (
            <nav aria-label="Path organisasi" className="mt-2 flex flex-wrap items-center gap-0.5 text-[10px] text-slate-500">
              {ancestors.slice(0, -1).map((a) => (
                <span key={a.id} className="flex items-center gap-0.5">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{a.name}</span>
                  <ChevronRight size={10} className="shrink-0 text-slate-300" />
                </span>
              ))}
            </nav>
          )}
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 size={11} />
            Hapus
          </button>
        )}
      </div>

      {/* Section: Identitas */}
      <FormSection title="Identitas Ruangan">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nama Ruangan" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              className={fieldCls}
              placeholder="Mis. Bangsal Melati"
            />
          </Field>
          <Field label="Kode Ruangan" hint="Kode unik otomatis — boleh diubah">
            <input
              type="text"
              value={form.kode}
              onChange={(e) => update("kode", e.target.value.toUpperCase())}
              className={cn(fieldCls, "font-mono uppercase")}
              placeholder="R2606001"
            />
          </Field>
          <Field label="Jenis Ruangan" required>
            <Select
              value={form.locationType}
              onChange={(v) => update("locationType", v as LocationType)}
              options={LOCATION_TYPE_OPTIONS}
              icon={Layers}
              placeholder="Pilih jenis ruangan…"
            />
          </Field>
          <Field label="Kelas">
            <Select
              value={form.kelas}
              onChange={(v) => update("kelas", v as LocationKelas)}
              options={KELAS_OPTIONS_SELECT}
              icon={Tag}
              placeholder="Pilih kelas…"
            />
          </Field>
          <Field label="Kapasitas Bed" hint="Jumlah bed yang direncanakan">
            <input
              type="number"
              min={1}
              max={50}
              value={form.kapasitas}
              onChange={(e) => update("kapasitas", parseInt(e.target.value, 10) || 1)}
              className={cn(fieldCls, "font-mono")}
            />
          </Field>
        </div>
      </FormSection>

      {/* Section: Alamat — inherit toggle */}
      <FormSection title="Alamat Ruangan">
        <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
          <input
            type="checkbox"
            checked={!overrideAlamat}
            onChange={(e) => {
              setOverrideAlamat(!e.target.checked);
              setDirty(true);
            }}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-1 focus:ring-teal-200"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-700">
              Ikuti alamat unit induk
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Ruangan mewarisi alamat dari <span className="font-semibold">{parentName}</span>.
              Matikan jika ruangan berada di alamat berbeda.
            </p>
          </div>
        </label>

        {!overrideAlamat && inheritedAlamat && (
          <div className="mt-2.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              Alamat yang Diwariskan
            </p>
            <p className="mt-1 text-[11px] text-slate-700">
              {inheritedAlamat.jalan}, {inheritedAlamat.kelurahan}, {inheritedAlamat.kecamatan}
            </p>
            <p className="text-[10px] text-slate-500">
              {inheritedAlamat.kota}, {inheritedAlamat.provinsi} {inheritedAlamat.kodePos}
            </p>
          </div>
        )}

        {overrideAlamat && (
          <div className="mt-2.5 grid grid-cols-1 gap-3">
            <Field label="Jalan / Nomor">
              <input
                type="text"
                value={form.alamatOverride?.jalan ?? ""}
                onChange={(e) =>
                  update("alamatOverride", {
                    ...(form.alamatOverride ?? {
                      jalan: "", kelurahan: "", kecamatan: "", kota: "", provinsi: "", kodePos: "", kodeWilayah: "",
                    }),
                    jalan: e.target.value,
                  })
                }
                className={fieldCls}
              />
            </Field>
            <p className="text-[10px] text-slate-400">
              Lengkapi sisa kolom alamat di sini saat alamat override diaktifkan.
            </p>
          </div>
        )}
      </FormSection>

      {/* Bed Manager — sub-collection per ruangan */}
      <BedManagerPanel
        beds={form.beds}
        kapasitas={form.kapasitas}
        existingBedKodes={bedKodes(nodes)}
        onChange={handleBedsChange}
      />

      {/* Submit */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-[10px] text-slate-400">
          {saving ? "Menyimpan…" : dirty ? "Perubahan belum disimpan" : "Tidak ada perubahan"}
        </p>
        <button
          type="submit"
          disabled={!dirty || saving}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm transition",
            dirty && !saving
              ? "bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98]"
              : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
        >
          <Save size={12} />
          {saving ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
