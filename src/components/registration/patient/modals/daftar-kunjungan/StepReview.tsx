"use client";

import { Stethoscope, Shield, FileText, ClipboardList, Clock } from "lucide-react";
import { RvItem, RvSection2 } from "@/components/registration/kunjungan/Tabs/sep/SepShared";
import { SepStep4 } from "@/components/registration/kunjungan/Tabs/sep/SepSteps";
import type { SepDraft } from "@/components/registration/kunjungan/Tabs/sep/sepTypes";
import { PENJAMIN_CFG } from "../../config";
import { TRIASE_CFG, RIKELAS_LABEL, kategoriOf, type KunjunganForm, type PenjaminForm, type RujukanPick } from "./config";

const KELAS_LABEL: Record<string, string> = { "1": "Kelas 1", "2": "Kelas 2", "3": "Kelas 3", vip: "VIP" };
const RUJUKAN_SOURCE_LABEL: Record<RujukanPick["source"], string> = {
  masuk: "Rujukan Masuk (FKTP)",
  kontrol: "Kontrol Pasca Ranap",
};

export function StepReview({
  form, penjamin, isBpjsFlow, terbitSep, rujukan, draft,
}: {
  form: KunjunganForm;
  penjamin: PenjaminForm;
  isBpjsFlow: boolean;
  /** SEP diterbitkan sekarang (true) atau ditangguhkan/buat nanti (false). */
  terbitSep: boolean;
  rujukan: RujukanPick | null;
  draft: SepDraft;
}) {
  const pjLabel = PENJAMIN_CFG[penjamin.tipe].label;
  const pjKategori = kategoriOf(penjamin.tipe); // Umum tak punya kartu/kelas; kelas hanya BPJS; polis hanya Asuransi.

  return (
    <div className="space-y-3">
      <RvSection2 title="Detail Kunjungan" accent="bg-indigo-400"
        icon={<Stethoscope size={11} className="shrink-0 text-slate-400" />}>
        <div className="grid grid-cols-2 gap-3">
          <RvItem label="Unit" value={form.unit} />
          <RvItem label="Tanggal & Jam" value={`${form.tanggal} · ${form.jam}`} />
          {form.unit === "IGD" && <RvItem label="Triase" value={form.triase ? TRIASE_CFG[form.triase].label : "Belum ditentukan"} />}
          {form.unit === "IGD" && <RvItem label="Ruangan IGD" value={form.ruanganNama.trim() || "—"} />}
          {form.unit === "Rawat Jalan" && <RvItem label="Poli Tujuan" value={form.poli} />}
          {form.unit === "Rawat Inap" && <RvItem label="Asal Masuk" value={form.asalMasuk} />}
          {form.unit === "Rawat Inap" && (
            <RvItem
              label="Kelas Kamar"
              value={form.kelasKamar ? (RIKELAS_LABEL[form.kelasKamar] ?? form.kelasKamar) : (KELAS_LABEL[form.kelasRawat] ?? "—")}
            />
          )}
          {form.unit === "Rawat Inap" && <RvItem label="Ruangan" value={form.ruanganNama.trim() || "—"} />}
          {form.unit === "Rawat Inap" && <RvItem label="Bed (reserve)" value={form.bedNama.trim() || "—"} />}
          <RvItem
            label="Dokter Penanggung Jawab"
            value={(form.dpjpNama.trim() || form.dokter.trim()) || "—"}
            fullWidth
          />
          {form.keluhan.trim() && <RvItem label="Keluhan Utama" value={form.keluhan.trim()} fullWidth />}
        </div>
      </RvSection2>

      <RvSection2 title="Penjamin" accent="bg-emerald-400"
        icon={<Shield size={11} className="shrink-0 text-slate-400" />}>
        <div className="grid grid-cols-2 gap-3">
          <RvItem label="Jenis" value={pjLabel} />
          {pjKategori !== "Umum" && penjamin.nomor && <RvItem label="No. Kartu / Anggota" value={penjamin.nomor} mono />}
          {pjKategori === "BPJS" && penjamin.kelas && <RvItem label="Hak Kelas" value={KELAS_LABEL[penjamin.kelas] ?? penjamin.kelas} />}
          {pjKategori === "Asuransi" && penjamin.noPolis && <RvItem label="No. Polis" value={penjamin.noPolis} mono />}
        </div>
      </RvSection2>

      {rujukan?.noRujukan && (
        <RvSection2 title="Rujukan" accent="bg-sky-400"
          icon={<ClipboardList size={11} className="shrink-0 text-slate-400" />}>
          <div className="grid grid-cols-2 gap-3">
            <RvItem label="Sumber" value={RUJUKAN_SOURCE_LABEL[rujukan.source]} />
            <RvItem label="No. Rujukan" value={rujukan.noRujukan} mono />
            {rujukan.diagnosa && (
              <RvItem label="Diagnosa" value={`${rujukan.diagnosa.code} — ${rujukan.diagnosa.name}`} fullWidth />
            )}
          </div>
        </RvSection2>
      )}

      {isBpjsFlow && terbitSep && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <FileText size={12} className="text-sky-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Surat Eligibilitas Peserta (SEP)</p>
          </div>
          <SepStep4 draft={draft} />
        </div>
      )}

      {isBpjsFlow && !terbitSep && (
        <div className="flex items-start gap-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2.5">
          <Clock size={13} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-relaxed text-amber-700">
            <span className="font-semibold">SEP ditangguhkan.</span> Kunjungan terdaftar tanpa
            menerbitkan SEP — terbitkan nanti dari detail kunjungan / menu BPJS.
          </p>
        </div>
      )}
    </div>
  );
}
