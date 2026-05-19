"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, Check, AlertCircle, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TindakanRecord, TindakanKategori, TingkatKompleksitas } from "@/lib/master/tindakanMock";
import { KATEGORI_CFG, KATEGORI_ORDER, KOMPLEKSITAS_CFG, CLINICAL_UNITS_FOR_LAYANAN } from "@/lib/master/tindakanMock";
import type { SpesialisCode } from "@/components/master/dokter/dokterShared";
import {
  tindakanInitials, isTindakanValid, TINDAKAN_TABS, getStatusCfg,
  SPESIALIS_ORDER, SPESIALIS_SHORT,
} from "./katalogTindakanShared";
import type { TindakanTabKey } from "./katalogTindakanShared";

// ── Teal-flavored input primitives ───────────────────────

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

// ── Main Component ───────────────────────────────────────

interface TindakanDetailProps {
  draft: TindakanRecord;
  isNew: boolean;
  isDirty: boolean;
  onPatch: (patch: Partial<TindakanRecord>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function TindakanDetail({
  draft, isNew, isDirty, onPatch, onSave, onCancel, onDelete,
}: TindakanDetailProps) {
  const [tab, setTab] = useState<TindakanTabKey>("identitas");
  const valid = isTindakanValid(draft, isNew);
  const catCfg = KATEGORI_CFG[draft.kategori];
  const statusCfg = getStatusCfg(draft.status);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header bar — soft green when adding new */}
      <motion.div
        animate={{
          backgroundColor: isNew ? "rgb(240 253 244)" : "rgb(248 250 252 / 0.6)",
          borderColor: isNew ? "rgb(187 247 208)" : "rgb(241 245 249)",
        }}
        transition={{ duration: 0.25 }}
        className="shrink-0 border-b px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm",
            isNew
              ? "bg-emerald-100 text-emerald-700"
              : catCfg ? cn(catCfg.bg, catCfg.text) : "bg-slate-100 text-slate-400",
          )}>
            {draft.nama.trim() ? tindakanInitials(draft) : "??"}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="truncate text-sm font-bold text-slate-900">
                {draft.nama.trim() || <span className="italic text-slate-400">Tindakan Baru</span>}
              </p>
              {isNew && (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  + Entri Baru
                </span>
              )}
              {isDirty && !isNew && (
                <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  <AlertCircle size={9} /> Belum tersimpan
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] text-slate-400">{draft.kode || "—"}</span>
              {!isNew && draft.kategori && (
                <span className={cn("rounded px-1.5 py-0 text-[10px] font-semibold", catCfg?.bg, catCfg?.text)}>
                  {catCfg?.short}
                </span>
              )}
              {!isNew && draft.kompleksitas && (
                <span className={cn("rounded px-1.5 py-0 text-[10px] font-medium", KOMPLEKSITAS_CFG[draft.kompleksitas].bg, KOMPLEKSITAS_CFG[draft.kompleksitas].text)}>
                  {draft.kompleksitas}
                </span>
              )}
              {!isNew && (
                <span className={cn("rounded px-1.5 py-0 text-[10px] font-medium", statusCfg.bg, statusCfg.text)}>
                  {statusCfg.label}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {onDelete && !isNew && (
              <motion.button type="button" onClick={onDelete} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 size={11} /> Hapus
              </motion.button>
            )}
            <motion.button type="button" onClick={onCancel} disabled={!isDirty} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <X size={11} /> Batal
            </motion.button>
            <motion.button type="button" onClick={onSave} disabled={!isDirty || !valid} whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition disabled:opacity-40",
                isNew ? "bg-emerald-600 hover:bg-emerald-700" : "bg-teal-600 hover:bg-teal-700",
              )}
            >
              <Check size={11} /> {isNew ? "Tambah" : "Simpan"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="flex shrink-0 gap-0.5 border-b border-slate-100 bg-white px-3 pt-2">
        {TINDAKAN_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-semibold transition",
                active
                  ? "border-slate-200 bg-white text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              <t.icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="p-4"
          >
            {tab === "identitas" && <IdentitasTab draft={draft} isNew={isNew} onPatch={onPatch} />}
            {tab === "relasi" && <RelasiTab draft={draft} onPatch={onPatch} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Tab: Identitas ────────────────────────────────────────

function IdentitasTab({ draft, isNew, onPatch }: {
  draft: TindakanRecord;
  isNew: boolean;
  onPatch: (p: Partial<TindakanRecord>) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Kode + Nama — kode disembunyikan saat entry baru */}
      {isNew ? (
        <Field label="Nama Tindakan" required>
          <input
            type="text"
            value={draft.nama}
            onChange={(e) => onPatch({ nama: e.target.value })}
            placeholder="Nama lengkap tindakan medis..."
            className={inputCls}
          />
        </Field>
      ) : (
        <div className="grid grid-cols-[180px_1fr] gap-4">
          <Field label="Kode ICD-9-CM" required>
            <input
              type="text"
              value={draft.kode}
              onChange={(e) => onPatch({ kode: e.target.value })}
              placeholder="mis. 89.00"
              maxLength={12}
              className={inputCls}
            />
          </Field>
          <Field label="Nama Tindakan" required>
            <input
              type="text"
              value={draft.nama}
              onChange={(e) => onPatch({ nama: e.target.value })}
              placeholder="Nama lengkap tindakan medis..."
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {/* Kategori */}
      <Field label="Kategori" required>
        <select
          value={draft.kategori ?? ""}
          onChange={(e) => onPatch({ kategori: e.target.value as TindakanKategori })}
          className={cn(inputCls, "max-w-[320px] appearance-none pr-8",
            "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")] bg-[length:14px] bg-position-[right_10px_center] bg-no-repeat",
          )}
        >
          {KATEGORI_ORDER.map((cat) => (
            <option key={cat} value={cat}>{KATEGORI_CFG[cat].label}</option>
          ))}
        </select>
      </Field>

      {/* Kompleksitas segmented */}
      <Field label="Tingkat Kompleksitas" required>
        <div className="flex flex-wrap gap-2">
          {(["Sederhana", "Sedang", "Khusus", "Canggih"] as TingkatKompleksitas[]).map((k) => {
            const cfg = KOMPLEKSITAS_CFG[k];
            const active = draft.kompleksitas === k;
            return (
              <motion.button
                key={k}
                type="button"
                onClick={() => onPatch({ kompleksitas: k })}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-semibold transition",
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
        <textarea
          value={draft.deskripsi ?? ""}
          onChange={(e) => onPatch({ deskripsi: e.target.value })}
          placeholder="Deskripsi singkat prosedur, indikasi umum, persyaratan khusus..."
          rows={4}
          className={cn(inputCls, "resize-none leading-relaxed")}
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
                  "flex-1 rounded-lg border py-2 text-sm font-semibold transition",
                  active && s === "Aktif" && "border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                  active && s === "NonAktif" && "border-transparent bg-slate-100 text-slate-600 ring-1 ring-slate-200",
                  !active && "border-slate-200 bg-white text-slate-400 hover:bg-slate-50",
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

// ── Tab: Relasi Default ───────────────────────────────────

function RelasiTab({ draft, onPatch }: {
  draft: TindakanRecord;
  onPatch: (p: Partial<TindakanRecord>) => void;
}) {
  const toggleSpesialis = (code: SpesialisCode) => {
    const next = draft.spesialisDefault.includes(code)
      ? draft.spesialisDefault.filter((c) => c !== code)
      : [...draft.spesialisDefault, code];
    onPatch({ spesialisDefault: next });
  };

  const toggleUnit = (kode: string) => {
    const next = draft.unitDefault.includes(kode)
      ? draft.unitDefault.filter((c) => c !== kode)
      : [...draft.unitDefault, kode];
    onPatch({ unitDefault: next });
  };

  const unitByCategory = CLINICAL_UNITS_FOR_LAYANAN.reduce<
    Record<string, typeof CLINICAL_UNITS_FOR_LAYANAN>
  >((acc, u) => {
    if (!acc[u.category]) acc[u.category] = [];
    acc[u.category].push(u);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3">
        <Network size={14} className="mt-0.5 shrink-0 text-sky-500" />
        <p className="text-[11px] text-sky-800 leading-relaxed">
          Nilai ini dipakai sebagai <strong>seed awal</strong> di{" "}
          <strong>Mapping Hub → Kewenangan Klinis</strong> dan{" "}
          <strong>Layanan Unit</strong> saat tindakan ditambahkan.
          Admin tetap dapat mengubah relasi di Mapping Hub.
        </p>
      </div>

      {/* Spesialis */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-3 py-2">
          <p className="text-xs font-bold text-slate-700">Spesialis Berwenang Default</p>
          <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
            {draft.spesialisDefault.length} dipilih
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 p-3">
          {SPESIALIS_ORDER.map((code) => {
            const active = draft.spesialisDefault.includes(code);
            return (
              <motion.button
                key={code}
                type="button"
                onClick={() => toggleSpesialis(code)}
                title={code}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                  active
                    ? "border-teal-200 bg-teal-50 text-teal-800 ring-1 ring-teal-100"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {SPESIALIS_SHORT[code]}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Unit Default */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-3 py-2">
          <p className="text-xs font-bold text-slate-700">Unit Layanan Default</p>
          <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
            {draft.unitDefault.length} dipilih
          </span>
        </div>
        <div className="space-y-3 p-3">
          {(["Klinis", "Poli", "Penunjang"] as const).map((cat) => (
            <div key={cat}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{cat}</p>
              <div className="flex flex-wrap gap-1.5">
                {(unitByCategory[cat] ?? []).map((u) => {
                  const active = draft.unitDefault.includes(u.kode);
                  return (
                    <motion.button
                      key={u.kode}
                      type="button"
                      onClick={() => toggleUnit(u.kode)}
                      title={u.nama}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                        active
                          ? "border-teal-200 bg-teal-50 text-teal-800 ring-1 ring-teal-100"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      {u.short}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
