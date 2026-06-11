"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  TindakanRecord, TindakanKategori, TingkatKompleksitas,
} from "@/lib/master/tindakanMock";
import {
  KATEGORI_CFG, KATEGORI_ORDER, KOMPLEKSITAS_CFG,
} from "@/lib/master/tindakanMock";
import {
  Field, TextInput, TextArea, ToggleSwitch, SectionGroup,
} from "@/components/master/shared";

interface Props {
  draft: TindakanRecord;
  isNew: boolean;
  onPatch: (patch: Partial<TindakanRecord>) => void;
}

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
          <Field label="Kode ICD-9-CM" hint="Opsional">
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

      {/* Kategori — dropdown kustom dengan dot warna kategori + popover beranimasi */}
      <Field label="Kategori" required>
        <KategoriDropdown
          value={draft.kategori}
          onChange={(v) => onPatch({ kategori: v })}
        />
      </Field>

      {/* Status KPTL — toggle yang membuka Nomor KPTL + Tingkat Kompleksitas.
          Kompleksitas kini OPSIONAL (default null) — hanya relevan saat KPTL aktif. */}
      <div className="space-y-2.5">
        <ToggleSwitch
          accent="teal"
          value={!!draft.kptlAktif}
          onChange={(on) =>
            onPatch(
              on
                ? { kptlAktif: true }
                : { kptlAktif: false, nomorKptl: "", kompleksitas: null },
            )
          }
          label="Status KPTL"
          desc="Aktifkan bila tindakan memerlukan Nomor KPTL & tingkat kompleksitas."
        />

        <AnimatePresence initial={false}>
          {draft.kptlAktif && (
            <motion.div
              key="kptl-detail"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <SectionGroup
                title="Detail KPTL"
                desc="Nomor registrasi KPTL & tingkat kompleksitas tindakan"
                icon={<BadgeCheck size={13} />}
                accent={{ bg: "bg-teal-50", text: "text-teal-700" }}
                className="mt-1"
              >
                <div className="space-y-4">
                  <Field label="Nomor KPTL">
                    <TextInput
                      value={draft.nomorKptl ?? ""}
                      onChange={(v) => onPatch({ nomorKptl: v })}
                      placeholder="mis. KPTL-2026-00123"
                      accent="teal"
                      className="font-mono"
                      maxW="max-w-[320px]"
                    />
                  </Field>

                  <Field label="Tingkat Kompleksitas" hint="Opsional — klik ulang untuk batal pilih">
                    <div className="flex flex-wrap gap-2">
                      {KOMPLEKSITAS_ORDER.map((k) => {
                        const cfg = KOMPLEKSITAS_CFG[k];
                        const active = draft.kompleksitas === k;
                        return (
                          <motion.button
                            key={k}
                            type="button"
                            onClick={() => onPatch({ kompleksitas: active ? null : k })}
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
                </div>
              </SectionGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

// ── KategoriDropdown ──────────────────────────────────────
// Dropdown kustom (bukan <select> native): tombol menampilkan dot warna + label kategori,
// popover beranimasi berisi daftar kategori dengan dot warna masing-masing. Tutup via
// klik-luar / Escape / pilih. a11y: listbox + option, aria-selected.

function KategoriDropdown({
  value,
  onChange,
}: {
  value: TindakanKategori;
  onChange: (v: TindakanKategori) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = KATEGORI_CFG[value];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative max-w-[320px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-left text-sm transition outline-none",
          open
            ? "border-teal-300 ring-2 ring-teal-100"
            : "border-slate-200 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-teal-200",
        )}
      >
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white", cfg.dot)} />
        <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{cfg.label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-slate-400"
        >
          <ChevronDown size={15} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute z-20 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/5"
          >
            {KATEGORI_ORDER.map((cat) => {
              const c = KATEGORI_CFG[cat];
              const active = cat === value;
              return (
                <li key={cat}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => { onChange(cat); setOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition",
                      active
                        ? cn(c.bg, c.text, "font-semibold")
                        : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white", c.dot)} />
                    <span className="min-w-0 flex-1 truncate">{c.label}</span>
                    {active && <Check size={14} className="shrink-0" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
