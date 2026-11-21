// observationService — domain Observation (TTV/tanda-tanda vital, rekam medis shared
// IGD/RI/RJ). Append-only time-series: `record` menulis satu baris baru; `list` membaca
// seluruh time-series kunjungan (terbaru dulu). Tak ada cache spine → tanpa transaksi
// (single insert). Tak import prisma langsung (FLOWS §2 — pakai DAL).
//
// Author dari actor (server-side); nama perawat tetap disimpan utk tampilan.
// RBAC `clinical.igd` di Route; ABAC unit-scope menyusul (TODO-CLINICAL §keputusan 4).

import * as defaultDal from "@/lib/dal/observationDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import * as pegawaiDal from "@/lib/dal/pegawaiDal";
import { systemClock, type Clock } from "@/lib/core/clock";
import { parseClientDateTime, rsDayKey, rsParts } from "@/lib/time/rsTime";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { ObservationInput, ObservationDTO, RIShift, StatusKesadaran } from "@/lib/schemas/observation";
import type { ObservationEntity } from "@/lib/dal/observationDal";

type Dal = typeof defaultDal;

/** datetime-local ("YYYY-MM-DDTHH:mm" = jam dinding RS) atau ISO ber-offset → instan nyata. */
function parseWaktu(raw: string | undefined, now: Date): Date {
  if (!raw) return now;
  const d = parseClientDateTime(raw);
  if (!d) throw Errors.validation("Waktu observasi tidak valid");
  return d;
}

/** Turunkan shift dari jam lokal RS bila tak dikirim — mirror timeToShift FE. */
function deriveShift(waktu: Date): RIShift {
  const h = rsParts(waktu).hour;
  if (h >= 7 && h < 14) return "Pagi";
  if (h >= 14 && h < 21) return "Siang";
  return "Malam";
}

/** Nama tampil pegawai (gelar depan + nama + gelar belakang) — mirror authService. */
function namaTampil(p: { gelarDepan: string | null; namaLengkap: string; gelarBelakang: string | null }): string {
  const depan = p.gelarDepan ? `${p.gelarDepan} ` : "";
  const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : "";
  return `${depan}${p.namaLengkap}${belakang}`;
}

/** Pencatat = pegawai dari actor (user login terverifikasi), BUKAN free-text. Fallback ke
 *  `input.perawat`/"—" hanya bila pegawai tak ditemukan (mis. dev actor) — integritas
 *  medico-legal: nama pencatat selalu = penulis terotentikasi pada login nyata. */
async function resolvePerawat(actor: Actor, fallback?: string): Promise<string> {
  const p = actor.pegawaiId ? await pegawaiDal.findById(actor.pegawaiId) : null;
  if (p) return namaTampil(p);
  return fallback?.trim() || "—";
}

function toDTO(o: ObservationEntity): ObservationDTO {
  const iso = o.waktuObservasi.toISOString();
  const p = rsParts(o.waktuObservasi);
  return {
    id: o.id,
    kunjunganId: o.kunjunganId,
    tanggal: rsDayKey(o.waktuObservasi), // YYYY-MM-DD menurut kalender RS
    jam: `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`, // HH:mm jam RS
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
    const perawat = await resolvePerawat(actor, input.perawat);

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
      perawat,
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
