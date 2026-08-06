"use client";

// ─── Cetak Dokumen ────────────────────────────────────────────
// Seksi penerbitan berkas klaim kecelakaan sebagai kolom kartu interaktif.
//   KLL   → Surat Keterangan Kecelakaan (Jasa Raharja)  · lampiran rincian biaya
//   Kerja → Formulir KK1 (Laporan Tahap I) · KK2 / KK3 (tahap lanjutan)
// Kartu "Siap Cetak" membuka modal A4; kartu "Tahap Lanjutan" = jejak alur (belum digenerate).

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Printer, FileText, ReceiptText, ClipboardCheck, Stethoscope,
  ArrowRight, Clock, ShieldOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard } from "./kecelakaanShared";
import { SuratJRModal } from "./SuratJRModal";
import { SuratKK1Modal } from "./SuratKK1Modal";
import type { KecelakaanDraft } from "./kecelakaanTypes";

// ─── Tone ─────────────────────────────────────────────────────
type Tone = "amber" | "emerald";
const TONE: Record<Tone, {
  iconBg: string; hoverBorder: string; ring: string; cta: string; readyChip: string;
}> = {
  amber: {
    iconBg:      "bg-amber-100 text-amber-600",
    hoverBorder: "hover:border-amber-300",
    ring:        "focus-visible:ring-amber-200",
    cta:         "text-amber-600",
    readyChip:   "bg-amber-50 text-amber-700 ring-amber-200",
  },
  emerald: {
    iconBg:      "bg-emerald-100 text-emerald-600",
    hoverBorder: "hover:border-emerald-300",
    ring:        "focus-visible:ring-emerald-200",
    cta:         "text-emerald-600",
    readyChip:   "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};

// ─── Katalog dokumen per jenis ────────────────────────────────
type DocId = "jr" | "jr-biaya" | "kk1" | "kk2" | "kk3";

interface DocCard {
  id:       DocId;
  title:    string;
  subtitle: string;
  reg:      string;
  icon:     IconComponent;
  nomor?:   string;                 // pola penomoran (informasi)
  status:   "ready" | "soon";
  hint?:    string;                 // konteks kapan dokumen tahap-lanjutan berlaku
}

const DOCS_KLL: DocCard[] = [
  {
    id: "jr", title: "Surat Keterangan Kecelakaan", icon: FileText, status: "ready",
    subtitle: "Keterangan rawat untuk pengajuan santunan Jasa Raharja.",
    reg: "Jasa Raharja · UU 34/1964", nomor: "NNN/SKK-KLL/RS/MM/YYYY",
  },
  {
    id: "jr-biaya", title: "Rincian Biaya Perawatan", icon: ReceiptText, status: "soon",
    subtitle: "Lampiran kuitansi biaya sebagai berkas santunan.",
    reg: "Lampiran klaim JR",
    hint: "Otomatis dari modul Billing setelah perawatan selesai.",
  },
];

const DOCS_KK: DocCard[] = [
  {
    id: "kk1", title: "Formulir 3 / KK1", icon: FileText, status: "ready",
    subtitle: "Laporan Kecelakaan Kerja Tahap I ke BPJS Ketenagakerjaan.",
    reg: "Permenaker 5/2021 jo 1/2025", nomor: "NNN/KK1-JKK/RS/MM/YYYY",
  },
  {
    id: "kk2", title: "Formulir 3a / KK2", icon: ClipboardCheck, status: "soon",
    subtitle: "Laporan Tahap II — hasil akhir perawatan / penetapan kecacatan.",
    reg: "Lanjutan JKK", nomor: "NNN/KK2-JKK/RS/MM/YYYY",
    hint: "Diisi setelah perawatan selesai atau ada penetapan kecacatan.",
  },
  {
    id: "kk3", title: "Surat Ket. Dokter (KK3)", icon: Stethoscope, status: "soon",
    subtitle: "Keterangan dokter pemeriksa / surat kesembuhan.",
    reg: "Formulir 3b JKK", nomor: "NNN/KK3-JKK/RS/MM/YYYY",
    hint: "Diterbitkan dokter penasihat / DPJP saat kontrol akhir.",
  },
];

// ─── Kartu dokumen ────────────────────────────────────────────
function DokumenCard({
  doc, tone, index, onOpen,
}: {
  doc:   DocCard;
  tone:  Tone;
  index: number;
  onOpen: () => void;
}) {
  const t     = TONE[tone];
  const ready = doc.status === "ready";
  const Icon  = doc.icon;

  const inner = (
    <>
      <div className="flex items-start gap-3">
        <div className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition group-hover:scale-105",
          ready ? t.iconBg : "bg-slate-100 text-slate-400",
        )}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[12.5px] font-bold leading-tight", ready ? "text-slate-800" : "text-slate-500")}>
            {doc.title}
          </p>
          <p className="mt-1 text-[10.5px] leading-snug text-slate-500">{doc.subtitle}</p>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide ring-1",
          ready ? t.readyChip : "bg-slate-100 text-slate-500 ring-slate-200",
        )}>
          {ready ? "Siap Cetak" : "Tahap Lanjutan"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {doc.nomor && (
          <span className="rounded-md bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-500 ring-1 ring-slate-200">
            {doc.nomor}
          </span>
        )}
        <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-500 ring-1 ring-slate-200">
          {doc.reg}
        </span>
      </div>

      {ready ? (
        <div className={cn(
          "mt-auto flex items-center justify-end gap-1.5 pt-3 font-bold transition-all group-hover:gap-2.5",
          t.cta,
        )}>
          <Printer size={13} />
          <span className="text-[11px]">Cetak Dokumen</span>
          <ArrowRight size={13} />
        </div>
      ) : (
        <div className="mt-auto flex items-start gap-1.5 pt-3 text-slate-400">
          <Clock size={12} className="mt-px shrink-0" />
          <span className="text-[10px] leading-snug">{doc.hint}</span>
        </div>
      )}
    </>
  );

  const base = "group flex h-full flex-col rounded-2xl border p-4 text-left transition-all duration-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      {ready ? (
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            base, "w-full bg-white shadow-sm border-slate-200 cursor-pointer",
            "hover:-translate-y-0.5 hover:shadow-md", t.hoverBorder,
            "focus-visible:outline-none focus-visible:ring-2", t.ring,
          )}
        >
          {inner}
        </button>
      ) : (
        <div
          aria-disabled
          className={cn(base, "border-dashed border-slate-200 bg-slate-50/60")}
        >
          {inner}
        </div>
      )}
    </motion.div>
  );
}

// ─── Panel ────────────────────────────────────────────────────
export function CetakDokumenPanel({ draft }: { draft: KecelakaanDraft }) {
  const [openDoc, setOpenDoc] = useState<DocId | null>(null);

  if (draft.jenis === "lainnya") {
    return (
      <SectionCard icon={ShieldOff} title="Cetak Dokumen" accent="slate">
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400">
            <FileText size={16} />
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Tidak ada dokumen klaim khusus untuk kategori ini. Penjaminan mengikuti
            kepesertaan pasien (BPJS Kesehatan / Umum / Asuransi).
          </p>
        </div>
      </SectionCard>
    );
  }

  const tone: Tone = draft.jenis === "kll" ? "amber" : "emerald";
  const docs = draft.jenis === "kll" ? DOCS_KLL : DOCS_KK;
  const readyCount = docs.filter((d) => d.status === "ready").length;
  const soonCount  = docs.length - readyCount;

  return (
    <>
      <SectionCard
        icon={Printer}
        title="Cetak Dokumen"
        accent={tone}
        right={
          <span className="text-[9.5px] font-semibold text-slate-400">
            {readyCount} siap · {soonCount} lanjutan
          </span>
        }
      >
        <p className="-mt-1 text-[10.5px] leading-relaxed text-slate-500">
          Terbitkan berkas klaim dari data kecelakaan yang telah diisi. Kelengkapan
          isian meningkatkan akurasi dokumen.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {docs.map((doc, i) => (
            <DokumenCard
              key={doc.id}
              doc={doc}
              tone={tone}
              index={i}
              onOpen={() => setOpenDoc(doc.id)}
            />
          ))}
        </div>
      </SectionCard>

      {openDoc === "jr"  && <SuratJRModal  draft={draft} onClose={() => setOpenDoc(null)} />}
      {openDoc === "kk1" && <SuratKK1Modal draft={draft} onClose={() => setOpenDoc(null)} />}
    </>
  );
}
