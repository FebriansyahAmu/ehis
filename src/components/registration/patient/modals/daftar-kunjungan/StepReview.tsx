"use client";

import { Stethoscope, Shield, FileText } from "lucide-react";
import { RvItem, RvSection2 } from "@/components/registration/kunjungan/Tabs/sep/SepShared";
import { SepStep4 } from "@/components/registration/kunjungan/Tabs/sep/SepSteps";
import type { SepDraft } from "@/components/registration/kunjungan/Tabs/sep/sepTypes";
import { PENJAMIN_CFG } from "../../config";
import { TRIASE_CFG, type KunjunganForm, type PenjaminForm } from "./config";

const KELAS_LABEL: Record<string, string> = { "1": "Kelas 1", "2": "Kelas 2", "3": "Kelas 3", vip: "VIP" };

export function StepReview({
  form, penjamin, isBpjsFlow, draft,
}: {
  form: KunjunganForm;
  penjamin: PenjaminForm;
  isBpjsFlow: boolean;
  draft: SepDraft;
}) {
  const pjLabel = PENJAMIN_CFG[penjamin.tipe].label;

  return (
    <div className="space-y-3">
      <RvSection2 title="Detail Kunjungan" accent="bg-indigo-400"
        icon={<Stethoscope size={11} className="shrink-0 text-slate-400" />}>
        <div className="grid grid-cols-2 gap-3">
          <RvItem label="Unit" value={form.unit} />
          <RvItem label="Tanggal & Jam" value={`${form.tanggal} · ${form.jam}`} />
          <RvItem label="Cara Masuk" value={form.caraMasuk} />
          {form.noRujukan && <RvItem label="No. Rujukan" value={form.noRujukan} mono />}
          {form.unit === "IGD" && <RvItem label="Triase" value={TRIASE_CFG[form.triase].label} />}
          {form.unit === "IGD" && <RvItem label="Cara Datang" value={form.caraDatang} />}
          {form.unit === "Rawat Jalan" && <RvItem label="Poli Tujuan" value={form.poli} />}
          {form.unit === "Rawat Inap" && <RvItem label="Asal Masuk" value={form.asalMasuk} />}
          {form.unit === "Rawat Inap" && <RvItem label="Kelas Rawat" value={KELAS_LABEL[form.kelasRawat] ?? form.kelasRawat} />}
          <RvItem label="Dokter Penanggung Jawab" value={form.dokter.trim() || "—"} fullWidth />
          {form.keluhan.trim() && <RvItem label="Keluhan Utama" value={form.keluhan.trim()} fullWidth />}
        </div>
      </RvSection2>

      <RvSection2 title="Penjamin" accent="bg-emerald-400"
        icon={<Shield size={11} className="shrink-0 text-slate-400" />}>
        <div className="grid grid-cols-2 gap-3">
          <RvItem label="Jenis" value={pjLabel} />
          {penjamin.nomor && <RvItem label="No. Kartu / Anggota" value={penjamin.nomor} mono />}
          {penjamin.kelas && <RvItem label="Hak Kelas" value={KELAS_LABEL[penjamin.kelas] ?? penjamin.kelas} />}
          {penjamin.noPolis && <RvItem label="No. Polis" value={penjamin.noPolis} mono />}
        </div>
      </RvSection2>

      {isBpjsFlow && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <FileText size={12} className="text-sky-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Surat Eligibilitas Peserta (SEP)</p>
          </div>
          <SepStep4 draft={draft} />
        </div>
      )}
    </div>
  );
}
