"use client";

// ─── Cetak Dokumen (Manajemen) ────────────────────────────────
// Dokumen registrasi kunjungan sebagai kolom kartu interaktif, dikelompokkan:
//   Identitas & Antrean  → selalu tersedia setelah pasien terdaftar
//   Administrasi & Klaim → kondisional (SEP terbit · rujukan tertaut · kunjungan selesai)

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Printer, FileText, Ticket, Barcode, ShieldCheck, Navigation, ReceiptText,
  ArrowRight, Lock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KunjunganRecord } from "@/lib/data";
import { getKunjungan, type KunjunganDTO } from "@/lib/api/kunjungan";
import { SepPrintModal } from "@/components/registration/patient/modals/daftar-kunjungan/SepCetak";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Katalog dokumen ──────────────────────────────────────────
type DocStatus = "ready" | "locked";

interface PrintDoc {
  id:     string;
  title:  string;
  desc:   string;
  icon:   IconComponent;
  status: DocStatus;
  hint?:  string;                 // alasan terkunci
}

interface DocGroup {
  label: string;
  docs:  PrintDoc[];
}

function buildGroups(k: KunjunganRecord): DocGroup[] {
  const hasSEP     = !!k.noSEP;
  const hasRujukan = !!k.dokumen?.rujukan;
  const isDone     = k.status === "Selesai";
  return [
    {
      label: "Identitas & Antrean",
      docs: [
        { id: "bukti",   title: "Bukti Pendaftaran", icon: FileText, status: "ready",
          desc: "Ringkasan data kunjungan & nomor registrasi." },
        { id: "antrean", title: "Kartu Antrean",     icon: Ticket,   status: "ready",
          desc: "Nomor antrean untuk pelayanan poliklinik." },
        { id: "gelang",  title: "Gelang Identitas",  icon: Barcode,  status: "ready",
          desc: "Label barcode identitas pasien (patient safety)." },
      ],
    },
    {
      label: "Administrasi & Klaim",
      docs: [
        { id: "sep", title: "Surat Eligibilitas (SEP)", icon: ShieldCheck,
          status: hasSEP ? "ready" : "locked",
          desc: "Surat Eligibilitas Peserta BPJS Kesehatan.",
          hint: "Terbitkan SEP terlebih dahulu untuk kunjungan ini." },
        { id: "rujukan", title: "Surat Rujukan", icon: Navigation,
          status: hasRujukan ? "ready" : "locked",
          desc: "Surat rujukan faskes untuk pelayanan lanjutan.",
          hint: "Belum ada rujukan tertaut pada kunjungan ini." },
        { id: "struk", title: "Struk Pembayaran", icon: ReceiptText,
          status: isDone ? "ready" : "locked",
          desc: "Bukti transaksi pembayaran layanan.",
          hint: "Tersedia setelah kunjungan berstatus Selesai." },
      ],
    },
  ];
}

// ─── Kartu dokumen ────────────────────────────────────────────
function PrintDocCard({ doc, index, onClick, busy }: {
  doc: PrintDoc; index: number; onClick?: () => void; busy?: boolean;
}) {
  const ready = doc.status === "ready";
  const Icon  = doc.icon;

  const inner = (
    <>
      <div className="flex items-start gap-3">
        <div className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition group-hover:scale-105",
          ready ? "bg-sky-50 text-sky-600" : "bg-slate-100 text-slate-400",
        )}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[12.5px] font-bold leading-tight", ready ? "text-slate-800" : "text-slate-500")}>
            {doc.title}
          </p>
          <p className="mt-1 text-[10.5px] leading-snug text-slate-500">{doc.desc}</p>
        </div>
        <span className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide ring-1",
          ready ? "bg-sky-50 text-sky-700 ring-sky-200" : "bg-slate-100 text-slate-500 ring-slate-200",
        )}>
          {ready ? "Siap" : <><Lock size={8} />Terkunci</>}
        </span>
      </div>

      {ready ? (
        <div className="mt-auto flex items-center justify-end gap-1.5 pt-3 font-bold text-sky-600 transition-all group-hover:gap-2.5">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
          <span className="text-[11px]">{busy ? "Menyiapkan…" : "Cetak"}</span>
          {!busy && <ArrowRight size={13} />}
        </div>
      ) : (
        <div className="mt-auto flex items-start gap-1.5 pt-3 text-slate-400">
          <Lock size={11} className="mt-px shrink-0" />
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
      transition={{ duration: 0.2, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      {ready ? (
        <button
          type="button"
          onClick={onClick}
          disabled={busy}
          className={cn(
            base, "w-full cursor-pointer border-slate-200 bg-white shadow-sm",
            "hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200",
            busy && "cursor-wait opacity-80",
          )}
        >
          {inner}
        </button>
      ) : (
        <div aria-disabled className={cn(base, "border-dashed border-slate-200 bg-slate-50/60")}>
          {inner}
        </div>
      )}
    </motion.div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────
export function CetakTab({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const groups     = buildGroups(kunjungan);
  const allDocs    = groups.flatMap((g) => g.docs);
  const readyTotal = allDocs.filter((d) => d.status === "ready").length;

  // SEP → cetakan 1:1 BPJS. Ambil KunjunganDTO nyata (dpjp diresolusi di modal).
  const [sepDto,  setSepDto]  = useState<KunjunganDTO | null>(null);
  const [sepBusy, setSepBusy] = useState(false);

  async function openSep() {
    if (!UUID_RE.test(kunjungan.id)) return; // pasien demo → tak ada SEP nyata
    setSepBusy(true);
    try {
      const dto = await getKunjungan(kunjungan.id);
      if (dto.sep) setSepDto(dto);
    } catch { /* diabaikan — kartu tetap */ }
    finally { setSepBusy(false); }
  }

  return (
    <div className="space-y-5">
      {/* Header + ringkasan kesiapan */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Cetak Dokumen</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Cetak dokumen terkait kunjungan ini</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700 ring-1 ring-sky-200">
          <Printer size={11} />
          {readyTotal}/{allDocs.length} siap
        </span>
      </div>

      {groups.map((group) => {
        const readyInGroup = group.docs.filter((d) => d.status === "ready").length;
        return (
          <div key={group.label} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400">{group.label}</p>
              <span className="h-px flex-1 bg-slate-100" />
              <span className="text-[9px] font-semibold text-slate-400">{readyInGroup}/{group.docs.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.docs.map((doc, i) => (
                <PrintDocCard
                  key={doc.id}
                  doc={doc}
                  index={i}
                  onClick={doc.id === "sep" ? openSep : undefined}
                  busy={doc.id === "sep" && sepBusy}
                />
              ))}
            </div>
          </div>
        );
      })}

      {sepDto && <SepPrintModal kunjungan={sepDto} onClose={() => setSepDto(null)} />}
    </div>
  );
}
