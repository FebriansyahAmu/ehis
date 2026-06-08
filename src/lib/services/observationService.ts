// observationService — domain Observation (TTV/tanda-tanda vital, rekam medis shared
// IGD/RI/RJ). Append-only time-series: `record` menulis satu baris baru; `list` membaca
// seluruh time-series kunjungan (terbaru dulu). Tak ada cache spine → tanpa transaksi
// (single insert). Tak import prisma langsung (FLOWS §2 — pakai DAL).
//
// Author dari actor (server-side); nama perawat tetap disimpan utk tampilan.
// RBAC `clinical.igd` di Route; ABAC unit-scope menyusul (TODO-CLINICAL §keputusan 4).

import * as defaultDal from "@/lib/dal/observationDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { systemClock, type Clock } from "@/lib/core/clock";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { ObservationInput, ObservationDTO, RIShift, StatusKesadaran } from "@/lib/schemas/observation";
import type { ObservationEntity } from "@/lib/dal/observationDal";

type Dal = typeof defaultDal;

/** datetime-local ("YYYY-MM-DDTHH:mm") atau ISO → Date. Tanpa tz → diperlakukan UTC
 *  (deterministik; selaras konvensi simpan wall-clock di triase/kunjunganService). */
function parseWaktu(raw: string | undefined, now: Date): Date {
  if (!raw) return now;
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw);
  const s = hasTz ? raw : `${raw.length === 16 ? `${raw}:00` : raw}Z`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw Errors.validation("Waktu observasi tidak valid");
  return d;
}

/** Turunkan shift dari jam (UTC wall-clock) bila tak dikirim — mirror timeToShift FE. */
function deriveShift(waktu: Date): RIShift {
  const h = waktu.getUTCHours();
  if (h >= 7 && h < 14) return "Pagi";
  if (h >= 14 && h < 21) return "Siang";
  return "Malam";
}

function toDTO(o: ObservationEntity): ObservationDTO {
  const iso = o.waktuObservasi.toISOString();
  return {
    id: o.id,
    kunjunganId: o.kunjunganId,
    tanggal: iso.slice(0, 10), // YYYY-MM-DD (wall-clock UTC = yang diinput)
    jam: iso.slice(11, 16), // HH:mm
    shift: (o.shift as RIShift | null) ?? null,
    perawat: o.perawat,
    vitalSigns: {
      tdSistolik: o.tdSistolik,
      tdDiastolik: o.tdDiastolik,
      nadi: o.nadi,
      respirasi: o.respirasi,
      suhu: o.suhu,
      spo2: o.spo2,
      gcsEye: o.gcsEye,
      gcsVerbal: o.gcsVerbal,
      gcsMotor: o.gcsMotor,
      skalaNyeri: o.skalaNyeri,
      beratBadan: o.beratBadan ?? undefined,
      tinggiBadan: o.tinggiBadan ?? undefined,
    },
    statusKesadaran: o.statusKesadaran as StatusKesadaran,
    waktuObservasi: iso,
    authorUserId: o.authorUserId,
    createdAt: o.createdAt.toISOString(),
  };
}

export function makeObservationService(deps: { clock?: Clock; dal?: Dal } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;

  /** Validasi kunjungan ada & belum dihapus (TTV shared → tanpa batasan unit). */
  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Catat satu pengukuran TTV (append baris baru). */
  async function record(kunjunganId: string, input: ObservationInput, actor: Actor): Promise<ObservationDTO> {
    await assertKunjungan(kunjunganId);
    const waktuObservasi = parseWaktu(input.waktuObservasi, clock.now());

    const row = await dal.create({
      kunjunganId,
      tdSistolik: input.tdSistolik,
      tdDiastolik: input.tdDiastolik,
      nadi: input.nadi,
      respirasi: input.respirasi,
      suhu: input.suhu,
      spo2: input.spo2,
      gcsEye: input.gcsEye,
      gcsVerbal: input.gcsVerbal,
      gcsMotor: input.gcsMotor,
      skalaNyeri: input.skalaNyeri,
      beratBadan: input.beratBadan ?? null,
      tinggiBadan: input.tinggiBadan ?? null,
      statusKesadaran: input.statusKesadaran,
      shift: input.shift ?? deriveShift(waktuObservasi),
      perawat: input.perawat,
      waktuObservasi,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });

    return toDTO(row);
  }

  /** Seluruh time-series TTV kunjungan (terbaru dulu; [] bila belum ada). */
  async function list(kunjunganId: string, _actor: Actor): Promise<ObservationDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.listByKunjungan(kunjunganId);
    return rows.map(toDTO);
  }

  return { record, list };
}

export const observationService = makeObservationService();
