"use client";

// Surat Kontrol (Rawat Jalan) — memakai komponen SHARED JadwalKontrolSection (sama seperti Rawat
// Inap). Persist ke medicalrecord.JadwalKontrol (nomor auto JK-<YYMM><NNN>); pasien BPJS → V-Claim
// RencanaKontrol/insert → No. Referensi; pratinjau payload via hyperlink (pola SEP).
// Panel Riwayat surat (samping) di-DRIVE dari DB (onServerItemsChange) — BUKAN in-memory: terisi
// dari fetch saat dibuka + sinkron create/edit/hapus. Tiap jadwal juga membawa data CETAK A4
// (SuratKontrolCetakData konteks "rj") → tombol Cetak di panel kanan buka modal template resmi.
// Pasien demo (non-UUID) = daftar lokal.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import type { JadwalKontrolDTO } from "@/lib/api/jadwalKontrol/jadwalKontrol";
import JadwalKontrolSection, {
  type JadwalKontrolLocal,
} from "@/components/shared/medical-records/jadwalKontrol/JadwalKontrolSection";
import type { SuratKontrolCetakData } from "@/components/shared/medical-records/jadwalKontrol/SuratKontrolCetakTemplate";
import { type SuratPatient, type SuratDibuat, genNomorSurat } from "./suratDokumenShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Satu jadwal kontrol → kartu riwayat (SuratDibuat) + data cetak A4 (SuratKontrolCetakData). */
export interface KontrolSuratEntry {
  surat: SuratDibuat;
  cetak: SuratKontrolCetakData;
}

function fmtTgl(ymd?: string): string {
  if (!ymd) return "";
  const d = new Date(/^\d{4}-\d{2}-\d{2}/.test(ymd) ? `${ymd.slice(0, 10)}T00:00:00` : ymd);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// Identitas pasien + konteks poliklinik (sama untuk semua jadwal pasien ini).
function buildPasien(patient: SuratPatient): SuratKontrolCetakData["pasien"] {
  return {
    nama: patient.name,
    noRM: patient.noRM,
    gender: patient.gender,
    umur: `${patient.age} tahun`,
    tanggalLahir: patient.tanggalLahir || undefined,
    penjamin: (patient.penjamin ?? "Umum").replace(/_/g, " "),
  };
}

function buildPerawatan(patient: SuratPatient): SuratKontrolCetakData["perawatan"] {
  return {
    ruangan: patient.poli ? `Poliklinik ${patient.poli}` : "Poliklinik",
    kelas: "",
    dpjp: patient.dokter,
    tglMasuk: fmtTgl(patient.tanggalKunjungan),
    diagnosa: patient.diagnosa ? [{ kode: "", nama: patient.diagnosa, utama: true }] : [],
  };
}

// Field id data selaras SURAT_CONFIG "surat-kontrol" agar label detail terbaca di kartu riwayat.
function dtoToSurat(dto: JadwalKontrolDTO): SuratDibuat {
  return {
    id: dto.id,
    jenis: "surat-kontrol",
    nomorSurat: dto.nomor || dto.noReferensi || "—",
    tanggalBuat: dto.createdAt.slice(0, 10),
    data: {
      tanggalKontrol: dto.tanggal,
      poli: dto.poliKontrol ? `${dto.poliNama} (${dto.poliKontrol})` : dto.poliNama,
      dokterTujuan: dto.dokterNama,
      catatan: dto.catatan,
      ...(dto.noReferensi ? { "No. Referensi": dto.noReferensi } : {}),
      ...(dto.noSep ? { "No. SEP": dto.noSep } : {}),
    },
    dokterPembuat: dto.pencatat || dto.dokterNama,
  };
}

function dtoToCetak(dto: JadwalKontrolDTO, base: Pick<SuratKontrolCetakData, "pasien" | "perawatan">): SuratKontrolCetakData {
  return {
    konteks: "rj",
    jadwal: {
      nomor: dto.nomor, tanggal: dto.tanggal,
      poliNama: dto.poliNama, poliKontrol: dto.poliKontrol || undefined,
      dokterNama: dto.dokterNama, kodeDokter: dto.kodeDokter || undefined,
      noSep: dto.noSep || undefined, noReferensi: dto.noReferensi,
      catatan: dto.catatan || undefined, pencatat: dto.pencatat || undefined,
      terbitAt: dto.createdAt,
    },
    ...base,
  };
}

/** Bangun entri (kartu + cetak) dari DTO server — dipakai induk untuk PRAMUAT Riwayat Surat
 *  saat tab dibuka (tanpa menunggu pane dibuka). Sumber tunggal pemetaan (dipakai mirror pane juga). */
export function kontrolEntriesFromDtos(dtos: JadwalKontrolDTO[], patient: SuratPatient): KontrolSuratEntry[] {
  const base = { pasien: buildPasien(patient), perawatan: buildPerawatan(patient) };
  return dtos.map((dto) => ({ surat: dtoToSurat(dto), cetak: dtoToCetak(dto, base) }));
}

function localToSurat(jk: JadwalKontrolLocal, dokterPembuat: string): SuratDibuat {
  return {
    id: jk.id,
    jenis: "surat-kontrol",
    nomorSurat: genNomorSurat("surat-kontrol"),
    tanggalBuat: new Date().toISOString().slice(0, 10),
    data: {
      tanggalKontrol: jk.tanggal,
      poli: jk.poliKontrol ? `${jk.poli} (${jk.poliKontrol})` : jk.poli,
      dokterTujuan: jk.dokter,
      catatan: jk.catatan,
      ...(jk.noSEP ? { "No. SEP": jk.noSEP } : {}),
    },
    dokterPembuat,
  };
}

function localToCetak(jk: JadwalKontrolLocal, base: Pick<SuratKontrolCetakData, "pasien" | "perawatan">): SuratKontrolCetakData {
  return {
    konteks: "rj",
    jadwal: {
      nomor: "", tanggal: jk.tanggal,
      poliNama: jk.poli, poliKontrol: jk.poliKontrol,
      dokterNama: jk.dokter, kodeDokter: jk.kodeDokter,
      noSep: jk.noSEP, noReferensi: undefined,
      catatan: jk.catatan || undefined,
    },
    ...base,
  };
}

export default function SuratKontrolPane({
  patient, onListChange,
}: {
  patient: SuratPatient;
  /** Mirror daftar surat kontrol (kartu + data cetak) ke induk. Harus stabil (mis. setState). */
  onListChange?: (entries: KontrolSuratEntry[]) => void;
}) {
  const { session } = useSession();
  const kunjunganId = patient.kunjunganId ?? "";
  const isPersisted = UUID_RE.test(kunjunganId);
  const isBpjs = (patient.penjamin ?? "").startsWith("BPJS");
  const [serverItems, setServerItems] = useState<JadwalKontrolDTO[]>([]);
  const [localItems, setLocalItems] = useState<JadwalKontrolLocal[]>([]);
  const jumlah = isPersisted ? serverItems.length : localItems.length;

  // Mirror ke induk: persisted → dari DB (serverItems); demo → lokal.
  useEffect(() => {
    if (!onListChange) return;
    const base = { pasien: buildPasien(patient), perawatan: buildPerawatan(patient) };
    const entries: KontrolSuratEntry[] = isPersisted
      ? kontrolEntriesFromDtos(serverItems, patient)
      : localItems.map((jk) => ({ surat: localToSurat(jk, patient.dokter), cetak: localToCetak(jk, base) }));
    onListChange(entries);
  }, [isPersisted, serverItems, localItems, patient, onListChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            <CalendarCheck size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-700">Surat Kontrol</p>
            <p className="mt-0.5 text-xs text-slate-400">Jadwal kunjungan ulang / follow-up poliklinik</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isBpjs && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <ShieldCheck size={11} /> BPJS
            </span>
          )}
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-bold",
            jumlah > 0 ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-400",
          )}>
            {jumlah} jadwal
          </span>
        </div>
      </div>

      {/* Info strip */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] text-slate-500">
        <span><span className="font-semibold text-slate-700">Pasien</span> {patient.name}</span>
        <span><span className="font-semibold text-slate-700">No. RM</span> {patient.noRM}</span>
        {!isPersisted && (
          <span className="text-amber-600">Pasien demo — jadwal tersimpan lokal (tidak dikirim ke BPJS).</span>
        )}
        {isPersisted && (
          <span className="text-slate-400">
            Nomor surat kontrol auto sistem{isBpjs && " · No. Referensi dari V-Claim RencanaKontrol/insert saat disimpan"} · cetak surat resmi dari panel Riwayat.
          </span>
        )}
      </div>

      {/* Form + daftar */}
      <div className="p-4">
        <JadwalKontrolSection
          isPersisted={isPersisted}
          kunjunganId={kunjunganId}
          items={localItems}
          onChange={setLocalItems}
          isBpjs={isBpjs}
          userNama={session?.namaTampil ?? ""}
          onServerItemsChange={setServerItems}
        />
      </div>
    </motion.div>
  );
}
