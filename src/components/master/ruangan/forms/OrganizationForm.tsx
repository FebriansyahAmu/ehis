"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, MapPin, Save, Trash2, ChevronDown, ChevronRight,
  Hospital, Lock, ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type OrganizationNode, type AnyNode, type Alamat, type OrgType,
  PROVINSI_LIST, KOTA_BY_PROVINSI, ORG_TYPE_CFG, getAncestors, isRSRoot,
} from "../ruanganShared";

interface OrganizationFormProps {
  node: OrganizationNode;
  nodes: AnyNode[];
  childCount: number;
  onSave: (next: OrganizationNode) => void | Promise<void>;
  onDelete: (node: AnyNode) => void | Promise<void>;
}

const ORG_TYPE_OPTIONS: OrgType[] = ["dept", "dept-clin", "team", "prov"];

export default function OrganizationForm({
  node, nodes, childCount, onSave, onDelete,
}: OrganizationFormProps) {
  const [form, setForm] = useState<OrganizationNode>(node);
  const [gpsOpen, setGpsOpen] = useState(!!node.gps);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const isRoot = isRSRoot(node);
  const ancestors = useMemo(() => getAncestors(nodes, node), [nodes, node]);

  const update = <K extends keyof OrganizationNode>(key: K, value: OrganizationNode[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const updateAlamat = <K extends keyof Alamat>(key: K, value: Alamat[K]) => {
    setForm((f) => ({ ...f, alamat: { ...f.alamat, [key]: value } }));
    setDirty(true);
  };

  const kotaList = useMemo(() => {
    const prov = PROVINSI_LIST.find((p) => p.nama === form.alamat.provinsi);
    return prov ? KOTA_BY_PROVINSI[prov.kode] ?? [] : [];
  }, [form.alamat.provinsi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave(form);
      setDirty(false); // hanya reset bila sukses — gagal → tetap dirty untuk retry
    } catch {
      /* error sudah di-surface parent (alert) */
    } finally {
      setSaving(false);
    }
  };

  const headerCfg = isRoot
    ? { bg: "bg-violet-50", ring: "ring-violet-100", text: "text-violet-600", label: "RS Induk", Icon: Hospital }
    : { bg: "bg-teal-50", ring: "ring-teal-100", text: "text-teal-600", label: "Unit / Organisasi", Icon: Building2 };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Header + breadcrumb */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-2", headerCfg.bg, headerCfg.ring)}>
              <headerCfg.Icon size={16} className={headerCfg.text} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-[10px] font-semibold uppercase tracking-wider", headerCfg.text)}>
                {headerCfg.label}
              </p>
              <h2 className="truncate text-sm font-bold text-slate-900">{form.name || "Unit Baru"}</h2>
            </div>
          </div>
          {ancestors.length > 1 && <Breadcrumb ancestors={ancestors} />}
        </div>
        {!isRoot && childCount === 0 && (
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

      {isRoot && <RSRootBanner />}

      {/* Section: Identitas */}
      <FormSection title="Identitas Unit">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nama Unit" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              disabled={isRoot}
              className={fieldCls}
              placeholder="Mis. Instalasi Rawat Inap"
            />
          </Field>
          <Field label="Kode Unit" hint={isRoot ? undefined : "Kode unik otomatis — boleh diubah"}>
            <input
              type="text"
              value={form.kode}
              onChange={(e) => update("kode", e.target.value.toUpperCase())}
              disabled={isRoot}
              className={cn(fieldCls, "font-mono uppercase")}
              placeholder="UN2606001"
            />
          </Field>
          <Field label="Telepon">
            <input
              type="tel"
              value={form.telp}
              onChange={(e) => update("telp", e.target.value)}
              disabled={isRoot}
              className={fieldCls}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
              disabled={isRoot}
              className={fieldCls}
            />
          </Field>
        </div>
      </FormSection>

      {/* Section: Klasifikasi (active + orgType) */}
      <FormSection title="Klasifikasi & Status">
        <div className="grid grid-cols-1 gap-3">
          <Field label="Jenis Unit" hint="Klasifikasi internal untuk pengelompokan & filtering">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {ORG_TYPE_OPTIONS.map((t) => {
                const cfg = ORG_TYPE_CFG[t];
                const active = form.orgType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => !isRoot && update("orgType", t)}
                    disabled={isRoot}
                    title={cfg.desc}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-left transition",
                      active
                        ? cn("border-transparent ring-2 ring-offset-1 ring-teal-300", cfg.bg, cfg.text)
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                      isRoot && "cursor-not-allowed opacity-70",
                    )}
                  >
                    <p className="text-[11px] font-semibold">{cfg.label}</p>
                    <p className="mt-0.5 text-[9px] leading-tight opacity-80">{cfg.desc}</p>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Status Aktif" hint="Non-aktifkan unit tanpa menghapus data">
            <button
              type="button"
              onClick={() => !isRoot && update("active", !form.active)}
              disabled={isRoot}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 transition",
                form.active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500",
                isRoot ? "cursor-not-allowed opacity-70" : "hover:brightness-95",
              )}
            >
              {form.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              <span className="text-[11px] font-semibold">
                {form.active ? "Aktif" : "Non-Aktif"}
              </span>
            </button>
          </Field>
        </div>
      </FormSection>

      {/* Section: Alamat */}
      <FormSection title="Alamat" icon={<MapPin size={11} />}>
        <div className="grid grid-cols-1 gap-3">
          <Field label="Jalan / Nomor">
            <input
              type="text"
              value={form.alamat.jalan}
              onChange={(e) => updateAlamat("jalan", e.target.value)}
              disabled={isRoot}
              className={fieldCls}
              placeholder="Jl. Harapan Sehat No. 1"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Provinsi">
              <select
                value={form.alamat.provinsi}
                onChange={(e) => {
                  updateAlamat("provinsi", e.target.value);
                  updateAlamat("kota", "");
                }}
                disabled={isRoot}
                className={selectCls}
              >
                <option value="">— Pilih Provinsi —</option>
                {PROVINSI_LIST.map((p) => (
                  <option key={p.kode} value={p.nama}>{p.nama}</option>
                ))}
              </select>
            </Field>
            <Field label="Kota / Kabupaten">
              <select
                value={form.alamat.kota}
                onChange={(e) => updateAlamat("kota", e.target.value)}
                disabled={isRoot || kotaList.length === 0}
                className={cn(selectCls, (isRoot || kotaList.length === 0) && "cursor-not-allowed opacity-60")}
              >
                <option value="">— Pilih Kota —</option>
                {kotaList.map((k) => (
                  <option key={k.kode} value={k.nama}>{k.nama}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Kecamatan">
              <input type="text" value={form.alamat.kecamatan} onChange={(e) => updateAlamat("kecamatan", e.target.value)} disabled={isRoot} className={fieldCls} />
            </Field>
            <Field label="Kelurahan">
              <input type="text" value={form.alamat.kelurahan} onChange={(e) => updateAlamat("kelurahan", e.target.value)} disabled={isRoot} className={fieldCls} />
            </Field>
            <Field label="Kode Pos">
              <input type="text" value={form.alamat.kodePos} onChange={(e) => updateAlamat("kodePos", e.target.value)} disabled={isRoot} className={cn(fieldCls, "font-mono")} inputMode="numeric" />
            </Field>
          </div>

          <Field label="Kode Wilayah Kemendagri" hint="10 digit — dipakai untuk pelaporan & integrasi eksternal">
            <input
              type="text"
              value={form.alamat.kodeWilayah}
              onChange={(e) => updateAlamat("kodeWilayah", e.target.value)}
              disabled={isRoot}
              className={cn(fieldCls, "font-mono")}
              inputMode="numeric"
              maxLength={10}
              placeholder="3171010001"
            />
          </Field>
        </div>
      </FormSection>

      {/* Section: GPS (collapsible) */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setGpsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <MapPin size={11} />
            </span>
            <span className="text-[11px] font-bold text-slate-800">Koordinat GPS</span>
            <span className="text-[10px] text-slate-400">(opsional)</span>
          </span>
          <motion.span animate={{ rotate: gpsOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronDown size={13} className="text-slate-400" />
          </motion.span>
        </button>
        {gpsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-slate-100 px-3.5 pb-3.5 pt-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude">
                <input
                  type="number"
                  step="any"
                  value={form.gps?.lat ?? ""}
                  onChange={(e) => update("gps", { lat: parseFloat(e.target.value) || 0, lng: form.gps?.lng ?? 0 })}
                  disabled={isRoot}
                  className={cn(fieldCls, "font-mono")}
                  placeholder="-6.1944"
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="number"
                  step="any"
                  value={form.gps?.lng ?? ""}
                  onChange={(e) => update("gps", { lat: form.gps?.lat ?? 0, lng: parseFloat(e.target.value) || 0 })}
                  disabled={isRoot}
                  className={cn(fieldCls, "font-mono")}
                  placeholder="106.8229"
                />
              </Field>
            </div>
          </motion.div>
        )}
      </div>

      {/* Submit */}
      {!isRoot && (
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
      )}
    </form>
  );
}

// ── Sub-components ───────────────────────────────────────

function RSRootBanner() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50/60 px-3 py-2.5">
      <Lock size={13} className="mt-0.5 shrink-0 text-violet-600" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-violet-800">Profil RS — Read Only</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-violet-700">
          Data inti RS Induk dikelola di modul <span className="font-semibold">Profil RS</span>{" "}
          (Konfigurasi). Halaman ini hanya menampilkan sebagai parent dari semua sub-unit di
          bawahnya.
        </p>
      </div>
    </div>
  );
}

function Breadcrumb({ ancestors }: { ancestors: AnyNode[] }) {
  return (
    <nav aria-label="Path organisasi" className="mt-2 flex flex-wrap items-center gap-0.5 text-[10px] text-slate-500">
      {ancestors.slice(0, -1).map((a) => (
        <span key={a.id} className="flex items-center gap-0.5">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{a.name}</span>
          <ChevronRight size={10} className="shrink-0 text-slate-300" />
        </span>
      ))}
    </nav>
  );
}

// ── Shared Field Components (re-used by Location/Bed forms via export) ──

export const fieldCls =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export const selectCls = cn(fieldCls, "appearance-none bg-no-repeat bg-[right_8px_center] pr-7 cursor-pointer");

export function Field({
  label, hint, required, children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="text-[9px] text-slate-400">{hint}</span>}
    </label>
  );
}

export function FormSection({
  title, icon, children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="mb-3 flex items-center gap-1.5">
        {icon && <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-500">{icon}</span>}
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{title}</h3>
      </div>
      {children}
    </div>
  );
}
