"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BedDouble, Stethoscope, ShieldCheck, Activity, AlertTriangle, Info,
} from "lucide-react";
import type { PetugasDTO } from "@/lib/api/penugasanRuangan";
import type { SpriInput } from "@/lib/schemas/disposisi/disposisi";
import { Select, DatePicker } from "@/components/shared/inputs";
import { type PulangPatient, Field, SectionHeader, textareaCls } from "./pasienPulangShared";
import { resolvePoliBpjs } from "./smfPoliMap";

// Jenis ruang perawatan — tingkat perawatan (level of care), bukan kelas BPJS.
const RUANG_OPTS = ["Perawatan Biasa", "Perawatan Intensif", "Isolasi", "HCU", "ICU"];

function todayYmd(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

interface Props {
  patient: PulangPatient;
  /** Opsi DPJP dari roster ruangan (dihitung di parent — sama pool dgn Dokter Pemulang). */
  dokterOptions: string[];
  /** Roster penuh — utk turunkan SMF/spesialistik + pegawaiId dari DPJP terpilih (by namaTampil). */
  roster: PetugasDTO[];
  /** Emit data SPRI valid (atau null bila form belum lengkap) → parent sertakan saat complete. */
  onChange: (spri: SpriInput | null) => void;
  /** Catatan penutup (kustom per-konteks). Default = alur IGD "Selesaikan & Rawat Inap". */
  submitHint?: React.ReactNode;
}

export default function SPRIPanel({ patient, dokterOptions, roster, onChange, submitHint }: Props) {
  const [dpjp, setDpjp]             = useState(patient.doctor);
  const [tglRawat, setTglRawat]     = useState(todayYmd); // default hari ini, bisa dipilih
  const [ruang, setRuang]           = useState("");
  const [indikasi, setIndikasi]     = useState("");
  const [keterangan, setKeterangan] = useState("");

  // SMF/poli tujuan + pegawaiId diturunkan dari DPJP terpilih (DPJP = Dokter ber-spesialistik).
  const dpjpRow = useMemo(() => roster.find((p) => p.namaTampil === dpjp) ?? null, [roster, dpjp]);
  const spesialistik = dpjpRow?.spesialistik ?? null;
  const poli = useMemo(() => resolvePoliBpjs(spesialistik), [spesialistik]);

  const noKartu = patient.noBpjs ?? "";

  // Komposisi payload SPRI (null bila wajib belum lengkap) — di-emit ke parent.
  const spriForm = useMemo<SpriInput | null>(() => {
    if (!dpjp.trim() || !ruang.trim() || !tglRawat.trim() || !indikasi.trim()) return null;
    return {
      noKartu,
      dpjpNama: dpjp.trim(),
      dpjpPegawaiId: dpjpRow?.pegawaiId,
      smfSpesialistik: spesialistik ?? undefined,
      poliKode: poli?.kode,
      poliNama: poli?.nama,
      tglRencanaRawat: tglRawat,
      jenisPerawatan: ruang as SpriInput["jenisPerawatan"],
      indikasi: indikasi.trim(),
      keterangan: keterangan.trim() || undefined,
    };
  }, [noKartu, dpjp, dpjpRow, spesialistik, poli, tglRawat, ruang, indikasi, keterangan]);

  // onChange = setter stabil dari parent (useState) → tak memicu loop (spriForm di-memo).
  useEffect(() => { onChange(spriForm); }, [spriForm, onChange]);

  return (
    <div className="overflow-hidden rounded-xl border border-violet-200 shadow-sm">
      <SectionHeader icon={BedDouble} title="Penerbitan SPRI — Surat Perintah Rawat Inap" />
      <div className="flex flex-col gap-4 bg-white p-4">

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <Info size={13} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-snug text-amber-700">
            <span className="font-semibold">Mode Demo · Mock SPRI.</span>{" "}
            No. Referensi diterbitkan otomatis saat kunjungan diselesaikan. Bila BPJS bermasalah,
            surat tetap terbit tanpa referensi — dilengkapi via <span className="font-semibold">Worklist Admisi Registrasi</span>.
          </p>
        </div>

        {/* Peserta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="shrink-0 text-violet-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">No. Kartu BPJS</span>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-700">
            {noKartu || "— (penjamin non-BPJS)"}
          </span>
        </div>

        {/* DPJP + Tanggal rencana rawat */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="DPJP Rawat Inap" required hint="Dipilih dari dokter yang ditugaskan ke ruangan ini.">
            <Select
              value={dpjp}
              onChange={setDpjp}
              options={dokterOptions}
              icon={Stethoscope}
              searchable
              placeholder="— Pilih DPJP penerima —"
            />
          </Field>
          <Field label="Tanggal Rencana Rawat Inap" required>
            <DatePicker value={tglRawat} onChange={setTglRawat} clearable={false} placeholder="Pilih tanggal" />
          </Field>
        </div>

        {/* SMF / Poli tujuan — read-only, diturunkan dari spesialistik DPJP (→ poliKontrol). */}
        <Field label="SMF / Poli Tujuan (BPJS)" hint="Otomatis dari spesialistik DPJP — dikirim sebagai poliKontrol.">
          {poli ? (
            <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5">
              <Activity size={14} className="shrink-0 text-violet-500" />
              <span className="text-xs font-semibold text-violet-800">{poli.nama}</span>
              <span className="ml-auto rounded-md bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-violet-600 ring-1 ring-violet-200">
                {poli.kode}
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-[11px] leading-snug text-amber-700">
                {dpjp.trim() === ""
                  ? "Pilih DPJP untuk menentukan SMF/poli tujuan."
                  : spesialistik
                  ? `Spesialistik "${spesialistik}" belum dipetakan ke poli BPJS — lengkapi smfPoliMap.`
                  : "DPJP terpilih bukan dokter spesialis (tanpa SMF) — poliKontrol akan dikirim kosong."}
              </p>
            </div>
          )}
        </Field>

        {/* Jenis ruang perawatan */}
        <Field label="Jenis Ruang Perawatan" required>
          <Select value={ruang} onChange={setRuang} options={RUANG_OPTS} icon={BedDouble} placeholder="— Pilih jenis ruang —" />
        </Field>

        {/* Indikasi */}
        <Field label="Indikasi Rawat Inap" required>
          <textarea
            value={indikasi}
            onChange={(e) => setIndikasi(e.target.value)}
            rows={3}
            placeholder="Indikasi medis pasien perlu rawat inap: mis. GJK NYHA III eksaserbasi akut, perlu monitoring hemodinamik & terapi IV lanjutan..."
            className={textareaCls}
          />
        </Field>

        {/* Keterangan */}
        <Field label="Keterangan">
          <textarea
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            rows={2}
            placeholder="Catatan tambahan (opsional)…"
            className={textareaCls}
          />
        </Field>

        {submitHint ?? (
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info size={11} className="shrink-0" />
            SPRI terbit otomatis saat menekan <span className="font-semibold text-slate-500">Selesaikan &amp; Rawat Inap</span>.
          </p>
        )}
      </div>
    </div>
  );
}
