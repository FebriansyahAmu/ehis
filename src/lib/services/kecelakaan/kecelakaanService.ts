// Service Data Kecelakaan (tab registrasi). Muat kunjungan + unit-scope (anti-IDOR) via
// loadKunjunganInScope; registrasi = role global (bypass scope). Upsert 1:1 encounter.Kecelakaan.
// Mapping FE-facing (KecelakaanDraft/UpsertKecelakaanInput) ↔ entity Prisma di sini (DTO tak bocorkan entity).

import * as kecelakaanDal from "@/lib/dal/kecelakaan/kecelakaanDal";
import type { KecelakaanData, KecelakaanEntity, KendaraanRow } from "@/lib/dal/kecelakaan/kecelakaanDal";
import { loadKunjunganInScope } from "@/lib/services/clinicalScope";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { UpsertKecelakaanInput, KecelakaanDTO } from "@/lib/schemas/kecelakaan/kecelakaan";

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
    noKpj:              nn(input.noKpj),
    jenisPekerjaan:     nn(input.jenisPekerjaan),
    lokasiKerja:        nn(input.lokasiKerja),
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
    noKpj:              e.noKpj ?? "",
    jenisPekerjaan:     e.jenisPekerjaan ?? "",
    lokasiKerja:        e.lokasiKerja ?? "",
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

  return { get, upsert };
}

export const kecelakaanService = makeKecelakaanService();
