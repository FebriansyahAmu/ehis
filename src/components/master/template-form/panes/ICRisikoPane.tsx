"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, AlertTriangle, Plus, X, Lightbulb,
  Heart, GitBranch, Ban,
} from "lucide-react";
import {
  Field, TextInput, TextArea, Select, SectionGroup,
} from "@/components/master/shared";
import type { ICRisikoTemplate } from "@/lib/master/templateFormMock";

interface Props {
  draft: ICRisikoTemplate;
  onPatch: (patch: Partial<ICRisikoTemplate>) => void;
}

export default function ICRisikoPane({ draft, onPatch }: Props) {
  const [newRisk, setNewRisk] = useState("");

  const addRisk = () => {
    if (!newRisk.trim()) return;
    onPatch({ risikoSpesifik: [...draft.risikoSpesifik, newRisk.trim()] });
    setNewRisk("");
  };

  const removeRisk = (idx: number) => {
    onPatch({ risikoSpesifik: draft.risikoSpesifik.filter((_, i) => i !== idx) });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Identitas tindakan */}
      <SectionGroup
        title="Identitas Tindakan"
        icon={<ClipboardCheck size={11} />}
        accent={{ bg: "bg-rose-50", text: "text-rose-700" }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Label Template" required>
            <TextInput
              value={draft.label}
              onChange={(v) => onPatch({ label: v })}
              placeholder="mis. Operasi Apendiks (Apendektomi)"
              accent="rose"
              maxW="max-w-md"
            />
          </Field>

          <Field label="Nama Tindakan" required hint="Akan match dengan Katalog Tindakan saat dipakai">
            <TextInput
              value={draft.tindakan}
              onChange={(v) => onPatch({ tindakan: v })}
              placeholder="Apendektomi"
              accent="rose"
              maxW="max-w-md"
            />
          </Field>

          <Field label="Kode ICD-9-CM" hint="Opsional, untuk mapping otomatis">
            <TextInput
              value={draft.kodeIcd9 ?? ""}
              onChange={(v) => onPatch({ kodeIcd9: v })}
              placeholder="47.01"
              accent="rose"
              maxW="max-w-[160px]"
            />
          </Field>

          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(v) => onPatch({ status: v as "Aktif" | "NonAktif" })}
              options={[
                { value: "Aktif", label: "Aktif" },
                { value: "NonAktif", label: "Non-Aktif" },
              ]}
              accent="rose"
              maxW="max-w-[180px]"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Deskripsi" hint="Penjelasan singkat tindakan (opsional)">
              <TextArea
                value={draft.deskripsi ?? ""}
                onChange={(v) => onPatch({ deskripsi: v })}
                placeholder="mis. Tindakan pembedahan untuk mengangkat apendiks yang meradang"
                rows={2}
                accent="rose"
              />
            </Field>
          </div>
        </div>
      </SectionGroup>

      {/* Risiko spesifik — tag list */}
      <SectionGroup
        title="Risiko Spesifik Tindakan"
        desc="Wajib min. 1 risiko. Tambahkan satu per satu — akan tampil sebagai chip yang bisa di-select di InformedConsentTab"
        icon={<AlertTriangle size={11} />}
        accent={{ bg: "bg-amber-50", text: "text-amber-700" }}
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newRisk}
            onChange={(e) => setNewRisk(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRisk();
              }
            }}
            placeholder="mis. Perdarahan intra-operasi"
            className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none transition focus:border-rose-400 focus:ring-1 focus:ring-rose-200"
          />
          <button
            type="button"
            onClick={addRisk}
            disabled={!newRisk.trim()}
            className="flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:bg-slate-300"
          >
            <Plus size={11} /> Tambah
          </button>
        </div>

        {draft.risikoSpesifik.length === 0 ? (
          <p className="mt-2 rounded-md border border-dashed border-rose-300 bg-rose-50/30 p-3 text-center text-[11px] italic text-rose-500">
            Belum ada risiko ditambahkan. Wajib min. 1 untuk template ini valid.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            <AnimatePresence>
              {draft.risikoSpesifik.map((r, i) => (
                <motion.li
                  key={`${r}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-2.5 py-1.5"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-100 font-mono text-[10px] font-bold text-amber-700">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[11px] text-slate-700">{r}</span>
                  <button
                    type="button"
                    onClick={() => removeRisk(i)}
                    className="rounded p-1 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600"
                    aria-label="Hapus risiko"
                  >
                    <X size={11} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </SectionGroup>

      {/* Manfaat & alternatif */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionGroup
          title="Manfaat Tindakan"
          icon={<Heart size={11} />}
          accent={{ bg: "bg-emerald-50", text: "text-emerald-700" }}
        >
          <Field label="Manfaat" hint="Apa yang akan didapat pasien dari tindakan ini">
            <TextArea
              value={draft.manfaat}
              onChange={(v) => onPatch({ manfaat: v })}
              placeholder="mis. Mencegah ruptur apendiks dan peritonitis difus yang dapat mengancam jiwa"
              rows={4}
              accent="rose"
            />
          </Field>
        </SectionGroup>

        <SectionGroup
          title="Alternatif Tersedia"
          icon={<GitBranch size={11} />}
          accent={{ bg: "bg-sky-50", text: "text-sky-700" }}
        >
          <Field label="Alternatif" hint="Pilihan terapi lain selain tindakan ini">
            <TextArea
              value={draft.alternatif}
              onChange={(v) => onPatch({ alternatif: v })}
              placeholder="mis. Terapi konservatif dengan antibiotik (hanya untuk apendisitis tanpa komplikasi)"
              rows={4}
              accent="rose"
            />
          </Field>
        </SectionGroup>
      </div>

      {/* Konsekuensi tolak */}
      <SectionGroup
        title="Konsekuensi Jika Menolak"
        icon={<Ban size={11} />}
        accent={{ bg: "bg-rose-50", text: "text-rose-700" }}
      >
        <Field label="Konsekuensi" hint="Risiko jika pasien menolak tindakan">
          <TextArea
            value={draft.konsekuensiTolak}
            onChange={(v) => onPatch({ konsekuensiTolak: v })}
            placeholder="mis. Risiko ruptur apendiks, peritonitis, sepsis, dan kematian"
            rows={3}
            accent="rose"
          />
        </Field>
      </SectionGroup>

      {/* Reminder */}
      <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2">
        <Lightbulb size={13} className="mt-0.5 shrink-0 text-sky-600" />
        <p className="flex-1 text-[10.5px] leading-relaxed text-sky-800">
          <strong>PMK 290/2008 Pasal 7 ayat 3:</strong> Penjelasan tindakan kedokteran sekurang-kurangnya mencakup diagnosis, tujuan, alternatif, risiko, komplikasi, prognosis, dan perkiraan biaya. Template ini auto-populate field tersebut saat dipakai di InformedConsentTab.
        </p>
      </div>
    </div>
  );
}
