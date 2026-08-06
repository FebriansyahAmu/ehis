// Service Data Kecelakaan (tab registrasi). Muat kunjungan + unit-scope (anti-IDOR) via
// loadKunjunganInScope; registrasi = role global (bypass scope). Upsert 1:1 encounter.Kecelakaan.
// Mapping FE-facing (KecelakaanDraft/UpsertKecelakaanInput) ↔ entity Prisma di sini (DTO tak bocorkan entity).

import * as kecelakaanDal from "@/lib/dal/kecelakaan/kecelakaanDal";
import type { KecelakaanData, KecelakaanEntity, KendaraanRow } from "@/lib/dal/kecelakaan/kecelakaanDal";
import * as bpjsDal from "@/lib/dal/bpjsDal";
import { loadKunjunganInScope } from "@/lib/services/clinicalScope";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  UpsertKecelakaanInput, KecelakaanDTO, SepJaminanSyncDTO, SuplesiKandidatDTO,
} from "@/lib/schemas/kecelakaan/kecelakaan";

// Peserta BPJS Kesehatan (jaminan SEP). Non-BPJS → sinkronisasi jaminan ditolak.
const isBpjs = (t: string): boolean => t === "BPJS_Non_PBI" || t === "BPJS_PBI";

// jenis + lingkup + jumlah kendaraan → { lakaLantas, penjamin } SEP (server-otoritatif).
//  • KLL          → KLL_BKK, penjamin "1" (Jasa Raharja).
//  • KK murni      → KK,      penjamin "2" (BPJS Ketenagakerjaan).
//  • KK saat PP/dinas berunsur lalu lintas (ada kendaraan) → KLL_KK, penjamin "1,2" (JR + BPJS TK).
//  • lainnya       → BKLL,    tanpa penjamin kecelakaan.
// Rujukan: docs/KECELAKAAN-KERJA-JKK.md §4.
function deriveLaka(
  jenis: string,
  lingkup: string,
  kendaraanCount: number,
): { lakaLantas: SepJaminanSyncDTO["lakaLantas"]; penjamin: string | null } {
  if (jenis === "kll") return { lakaLantas: "KLL_BKK", penjamin: "1" };
  if (jenis === "kerja") {
    const laluLintas = (lingkup === "pp" || lingkup === "dinas") && kendaraanCount > 0;
    return laluLintas
      ? { lakaLantas: "KLL_KK", penjamin: "1,2" }
      : { lakaLantas: "KK", penjamin: "2" };
  }
  return { lakaLantas: "BKLL", penjamin: null };
}

type Entity = NonNullable<KecelakaanEntity>;

// "" → null (bersihkan DB); pertahankan nilai non-kosong.
const nn = (s: string): string | null => (s.trim() === "" ? null : s.trim());

/** "YYYY-MM-DD" → Date UTC-midnight (aman timezone; @db.Date simpan tanggal). "" → null. */
function toDateOnly(s: string): Date | null {
  const v = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toData(input: UpsertKecelakaanInput): KecelakaanData {
  return {
    jenis:              input.jenis,
    tglKejadian:        toDateOnly(input.tanggal),
    waktuKejadian:      nn(input.waktu),
    provinsi:           nn(input.provinsi),
    lokasi:             nn(input.lokasi),
    kronologi:          nn(input.kronologi),
    mekanismeTrauma:    nn(input.mekanismeTrauma),
    statusLp:           input.statusLP,
    noLapPol:           nn(input.noLapPol),
    satuanPolisi:       nn(input.satuanPolisi),
    kendaraan:          input.kendaraan.map((k): KendaraanRow => ({ jenis: k.jenis, noPol: k.noPol, peran: k.peran })),
    penjaminLanjutan:   nn(input.penjaminLanjutan),
    statusKoordinasiJr: input.statusKoordinasiJR,
    namaPerusahaan:     nn(input.namaPerusahaan),
    npp:                nn(input.npp),
    noKpj:              nn(input.noKpj),
    jenisPekerjaan:     nn(input.jenisPekerjaan),
    lokasiKerja:        nn(input.lokasiKerja),
    lingkupKerja:       nn(input.lingkupKerja),
    statusLaporanKk:    input.statusLaporanKk,
    isPlkk:             input.isPlkk,
    // Badan penyelenggara penjamin kecelakaan = derivasi server (anti-spoof, single source).
    penjaminBadan:      deriveLaka(input.jenis, input.lingkupKerja, input.kendaraan.length).penjamin,
    statusPenjaminanKk: input.statusPenjaminanKk,
    noJaminanKk:        nn(input.noJaminanKk),
    suplesi:            input.suplesi,
    noSepSuplesi:       nn(input.noSepSuplesi),
    statusKlaim:        input.statusKlaim,
    nomorKlaim:         nn(input.nomorKlaim),
  };
}

function toKendaraanDTO(raw: unknown): KecelakaanDTO["kendaraan"] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => {
    const o = (r ?? {}) as Record<string, unknown>;
    const peran = o.peran === "Pelaku" || o.peran === "Keterlibatan" ? o.peran : "Korban";
    return { jenis: String(o.jenis ?? ""), noPol: String(o.noPol ?? ""), peran };
  });
}

function toDTO(e: Entity): KecelakaanDTO {
  return {
    jenis:              (e.jenis as KecelakaanDTO["jenis"]) || "kll",
    tanggal:            e.tglKejadian ? e.tglKejadian.toISOString().slice(0, 10) : "",
    waktu:              e.waktuKejadian ?? "",
    provinsi:           e.provinsi ?? "",
    lokasi:             e.lokasi ?? "",
    kronologi:          e.kronologi ?? "",
    mekanismeTrauma:    e.mekanismeTrauma ?? "",
    statusLP:           (e.statusLp as KecelakaanDTO["statusLP"]) || "belum",
    noLapPol:           e.noLapPol ?? "",
    satuanPolisi:       e.satuanPolisi ?? "",
    kendaraan:          toKendaraanDTO(e.kendaraan),
    penjaminLanjutan:   e.penjaminLanjutan ?? "",
    statusKoordinasiJR: (e.statusKoordinasiJr as KecelakaanDTO["statusKoordinasiJR"]) || "belum",
    namaPerusahaan:     e.namaPerusahaan ?? "",
    npp:                e.npp ?? "",
    noKpj:              e.noKpj ?? "",
    jenisPekerjaan:     e.jenisPekerjaan ?? "",
    lokasiKerja:        e.lokasiKerja ?? "",
    lingkupKerja:       (e.lingkupKerja as KecelakaanDTO["lingkupKerja"]) || "",
    statusLaporanKk:    (e.statusLaporanKk as KecelakaanDTO["statusLaporanKk"]) || "belum",
    isPlkk:             e.isPlkk ?? true,
    penjaminBadan:      e.penjaminBadan ?? "",
    statusPenjaminanKk: (e.statusPenjaminanKk as KecelakaanDTO["statusPenjaminanKk"]) || "menunggu",
    noJaminanKk:        e.noJaminanKk ?? "",
    suplesi:            e.suplesi ?? false,
    noSepSuplesi:       e.noSepSuplesi ?? "",
    statusKlaim:        (e.statusKlaim as KecelakaanDTO["statusKlaim"]) || "belum",
    nomorKlaim:         e.nomorKlaim ?? "",
    updatedAt:          e.updatedAt.toISOString(),
  };
}

export function makeKecelakaanService(deps: { dal?: typeof kecelakaanDal } = {}) {
  const dal = deps.dal ?? kecelakaanDal;

  /** Data kecelakaan kunjungan (null bila belum ada). Gate registration.kunjungan:read. */
  async function get(kunjunganId: string, actor: Actor): Promise<KecelakaanDTO | null> {
    await loadKunjunganInScope(kunjunganId, actor);
    const row = await dal.findByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  /** Simpan/ganti data kecelakaan (last-write-wins). Ditolak untuk kunjungan Cancelled. */
  async function upsert(kunjunganId: string, input: UpsertKecelakaanInput, actor: Actor): Promise<KecelakaanDTO> {
    const k = await loadKunjunganInScope(kunjunganId, actor);
    if (k.status === "Cancelled") throw Errors.validation("Kunjungan dibatalkan — data kecelakaan tidak dapat diubah");
    const row = await dal.upsertByKunjungan(kunjunganId, toData(input));
    return toDTO(row);
  }

  /**
   * JEMBATAN Kecelakaan → SEP.jaminan (satu primitif, dari tab Data Kecelakaan). Menyalin
   * lakaLantas (derive dari jenis) + No. LP + tgl kejadian + kronologi + suplesi ke SEP AKTIF.
   * `lokasiLaka` DITUNDA (butuh referensi wilayah BPJS). Membaca record kecelakaan TERSIMPAN
   * (single source) → operator simpan dulu. Gate registration.kunjungan:update.
   */
  async function syncToSep(kunjunganId: string, actor: Actor): Promise<SepJaminanSyncDTO> {
    const k = await loadKunjunganInScope(kunjunganId, actor);
    if (k.status === "Cancelled") throw Errors.validation("Kunjungan dibatalkan — jaminan tidak dapat disinkronkan");
    if (!isBpjs(k.penjaminTipe)) throw Errors.validation("Sinkronisasi jaminan hanya untuk peserta BPJS Kesehatan");
    const rec = await dal.findByKunjungan(kunjunganId);
    if (!rec) throw Errors.validation("Belum ada data kecelakaan — simpan data kecelakaan dulu sebelum sinkronisasi");
    const sep = await bpjsDal.findSepByKunjungan(kunjunganId);
    if (!sep) throw Errors.validation("Belum ada SEP aktif pada kunjungan ini — terbitkan SEP dulu");

    const kendaraanCount = Array.isArray(rec.kendaraan) ? rec.kendaraan.length : 0;
    const { lakaLantas, penjamin } = deriveLaka(rec.jenis, rec.lingkupKerja ?? "", kendaraanCount);
    const count = await bpjsDal.updateSepJaminan(sep.id, {
      lakaLantas,
      penjamin,
      noLp: rec.noLapPol ?? null,
      tglKejadian: rec.tglKejadian ?? null,
      keteranganLaka: rec.kronologi ?? null,
      suplesi: rec.suplesi,
      noSepSuplesi: rec.suplesi ? (rec.noSepSuplesi ?? null) : null,
    });
    if (count === 0) throw Errors.internal("Gagal memperbarui jaminan SEP");

    return {
      noSep:          sep.noSep,
      lakaLantas,
      penjamin,
      noLp:           rec.noLapPol ?? "",
      tglKejadian:    rec.tglKejadian ? rec.tglKejadian.toISOString().slice(0, 10) : "",
      keteranganLaka: rec.kronologi ?? "",
      suplesi:        rec.suplesi,
      noSepSuplesi:   rec.suplesi ? (rec.noSepSuplesi ?? "") : "",
    };
  }

  /** Kandidat No. SEP suplesi (SEP KLL terbit pasien, lintas kunjungan, exclude kunjungan ini). */
  async function listSuplesiKandidat(kunjunganId: string, actor: Actor): Promise<SuplesiKandidatDTO[]> {
    const k = await loadKunjunganInScope(kunjunganId, actor);
    const rows = await bpjsDal.listLakaSepByPatient(k.patientId, kunjunganId);
    return rows
      .filter((r) => r.noSep)
      .map((r) => ({ noSep: r.noSep!, tglSep: r.tglSep.toISOString().slice(0, 10), lakaLantas: r.lakaLantas }));
  }

  return { get, upsert, syncToSep, listSuplesiKandidat };
}

export const kecelakaanService = makeKecelakaanService();
