"use client";

import { useState, useMemo } from "react";
import { Printer, FileText, Receipt, Tag, BookOpen, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FarmasiOrder, getPatientInfo, DEPO_LABEL } from "@/components/farmasi/farmasiShared";
import ResepCetakModal from "@/components/shared/resep/ResepCetakModal";
import type { ResepCetakData } from "@/components/shared/resep/ResepCetakTemplate";
import { EtiketCetakModal, LabelCetakModal } from "./labelEtiketCetak";

function fmtRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function toIso(tanggal: string): string {
  const d = new Date(tanggal);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// ── FarmasiOrder → ResepCetakData (template A4) ────────────
function buildResepCetakData(order: FarmasiOrder): ResepCetakData {
  const patient = getPatientInfo(order.noRM);
  const tanggalIso = order.tteSignedAt ?? toIso(order.tanggal);
  return {
    noResep: order.noOrder,
    tanggal: tanggalIso,
    pasien: {
      nama: order.namaPasien,
      noRM: order.noRM,
      usia: patient?.usia,
      jenisKelamin: patient?.jenisKelamin,
      unit: order.unit,
    },
    dokter: order.dokterPeminta,
    dokterKontak: order.penulisKontak,
    depo: order.depoNama || "Depo Farmasi",
    catatan: order.catatanResep,
    kondisi: {
      ginjal: order.kondisiGinjal,
      kehamilan: order.kondisiKehamilan,
      menyusui: order.kondisiMenyusui,
    },
    items: order.items.map((it) => ({
      namaObat: it.namaObat,
      dosis: it.dosis || undefined,
      dosisSekali: it.dosisSekali,
      signa: it.signa,
      jumlah: it.jumlah,
      rute: it.rute || undefined,
      aturanPakai: it.aturanPakai,
      kategori: it.kategori,
    })),
    tte: {
      token: order.tteToken ?? "",
      signedBy: order.tteSignedBy ?? order.dokterPeminta,
      signedAt: order.tteSignedAt ?? tanggalIso,
    },
  };
}

type DocKind = "resep" | "label" | "etiket";

// ── Doc row ────────────────────────────────────────────────

interface DocRowProps {
  icon: React.ReactNode; iconBg: string; title: string; desc: string; onPreview: () => void;
}

function DocRow({ icon, iconBg, title, desc, onPreview }: DocRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition-colors hover:border-sky-200">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconBg)}>{icon}</div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{desc}</p>
      </div>

      {/* Tombol Cetak — buka preview */}
      <button
        type="button"
        onClick={onPreview}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 transition-all hover:bg-sky-50 active:scale-95"
      >
        <Printer size={13} /> Cetak
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

const DOCS: { kind: DocKind; icon: React.ReactNode; iconBg: string; title: string }[] = [
  { kind: "resep",  icon: <FileText size={16} className="text-sky-600" />,   iconBg: "bg-sky-100",   title: "Cetak Resep" },
  { kind: "label",  icon: <Tag size={16} className="text-amber-600" />,      iconBg: "bg-amber-100", title: "Label Obat" },
  { kind: "etiket", icon: <BookOpen size={16} className="text-violet-600" />, iconBg: "bg-violet-100", title: "Etiket Aturan Pakai" },
];

export default function DokumenPane({ order }: { order: FarmasiOrder }) {
  const patient = getPatientInfo(order.noRM);
  const [cetak, setCetak] = useState<DocKind | null>(null);

  const totalHarga = order.items.reduce((s, i) => s + (i.hargaSatuan ?? 0) * i.jumlah, 0);
  const cetakData  = useMemo(() => buildResepCetakData(order), [order]);

  const desc: Record<DocKind, string> = {
    resep:  `${order.noOrder} · ${order.items.length} item · ${order.dokterPeminta}`,
    label:  `${order.items.length} label · identitas pasien + obat`,
    etiket: `${order.items.length} etiket · aturan pakai (putih / biru)`,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cetak Dokumen</p>

      {/* Ringkasan order (1 baris, minimalist) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500">
        <span className="font-semibold text-slate-800">{order.namaPasien}</span>
        <span className="font-mono">{order.noRM}</span>
        <span className="h-3 w-px bg-slate-200" />
        <span>{order.noOrder}</span>
        <span>{order.tanggal}</span>
        <span>{DEPO_LABEL[order.depo]}</span>
        {patient?.ruangan && <span>{patient.ruangan}{patient.noBed ? ` · ${patient.noBed}` : ""}</span>}
        <span className="ml-auto font-semibold text-sky-700">{fmtRupiah(totalHarga)}</span>
      </div>

      {/* Daftar dokumen */}
      <div className="space-y-2">
        {DOCS.map((d) => (
          <DocRow
            key={d.kind}
            icon={d.icon} iconBg={d.iconBg} title={d.title} desc={desc[d.kind]}
            onPreview={() => setCetak(d.kind)}
          />
        ))}

        {/* Kwitansi — dinonaktifkan */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 opacity-60" aria-disabled="true">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Receipt size={16} className="text-slate-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-500">Kwitansi Pembayaran</p>
            <p className="mt-0.5 truncate text-xs text-slate-400">Belum digunakan saat ini</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400">
            <Ban size={11} /> Nonaktif
          </span>
        </div>
      </div>

      {/* Preview & cetak (A4) */}
      <ResepCetakModal  open={cetak === "resep"}  onClose={() => setCetak(null)} data={cetakData} />
      <LabelCetakModal  open={cetak === "label"}  onClose={() => setCetak(null)} order={order} />
      <EtiketCetakModal open={cetak === "etiket"} onClose={() => setCetak(null)} order={order} />
    </div>
  );
}
