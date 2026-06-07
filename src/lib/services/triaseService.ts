// triaseService — domain Triase (rekam medis IGD). Tak import prisma langsung
// (pakai `transaction` + DAL). Append-only: `save` menulis baris baru + sinkron
// cache `kunjungan.triaseLevel` dalam SATU transaksi. `getLatest` = read berdiri sendiri.
//
// Author diambil dari actor (server-side), nama perawat tetap disimpan utk tampilan.
// RBAC `clinical.igd` di Route; ABAC unit-scope menyusul (TODO-CLINICAL §keputusan 4).

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/triaseDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { systemClock, type Clock } from "@/lib/core/clock";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import { triaseLevelToInt, type TriaseInput, type TriaseDTO, type TriaseLevel } from "@/lib/schemas/triase";
import type { TriaseEntity } from "@/lib/dal/triaseDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<TriaseEntity>;

/** datetime-local ("YYYY-MM-DDTHH:mm") atau ISO → Date. Tanpa tz → diperlakukan UTC
 *  (deterministik; selaras konvensi simpan wall-clock di kunjunganService). */
function parseWaktu(raw: string | undefined, now: Date): Date {
  if (!raw) return now;
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw);
  // datetime-local tanpa tz: "YYYY-MM-DDTHH:mm" (16) → tambah detik; lalu paksa UTC.
  const s = hasTz ? raw : `${raw.length === 16 ? `${raw}:00` : raw}Z`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw Errors.validation("Waktu triase tidak valid");
  return d;
}

function toDTO(t: NonNullEntity): TriaseDTO {
  return {
    id: t.id,
    kunjunganId: t.kunjunganId,
    caraMasuk: t.caraMasuk,
    kondisiTiba: t.kondisiTiba,
    keluhanUtama: t.keluhanUtama,
    onset: t.onset,
    lokasiKeluhan: t.lokasiKeluhan,
    kualitasKeluhan: t.kualitasKeluhan,
    skalaBerat: t.skalaBerat,
    faktorPemberat: t.faktorPemberat,
    faktorPeringan: t.faktorPeringan,
    gejalaPenyerta: t.gejalaPenyerta,
    riwayatSerupa: t.riwayatSerupa,
    airwayStatus: t.airwayStatus,
    suaraNapasAbnormal: t.suaraNapasAbnormal,
    breathingQuality: t.breathingQuality,
    pergerakanDada: t.pergerakanDada,
    ototBantu: t.ototBantu,
    sianosis: t.sianosis,
    nadiTeraba: t.nadiTeraba,
    kualitasNadi: t.kualitasNadi,
    crt: t.crt,
    kondisiKulit: t.kondisiKulit,
    perdarahan: t.perdarahan,
    avpu: t.avpu,
    pupil: t.pupil,
    refleksCahaya: t.refleksCahaya,
    traumaLuka: t.traumaLuka,
    lokasiLuka: t.lokasiLuka,
    suhuKulit: t.suhuKulit,
    diagnosisSementara: t.diagnosisSementara,
    tindakanTriase: t.tindakanTriase,
    triageLevel: t.triageLevel as TriaseLevel,
    perawatTriase: t.perawatTriase,
    waktuTriase: t.waktuTriase.toISOString(),
    protocolId: t.protocolId,
    protocolKode: t.protocolKode,
    protocolNama: t.protocolNama,
    selectedCriteria: t.selectedCriteria.map((c) => ({
      id: c.id,
      parameterKode: c.parameterKode,
      parameterLabel: c.parameterLabel,
      levelKode: c.levelKode,
      levelLabel: c.levelLabel,
      nilai: c.nilai,
      sourceCriteriaId: c.sourceCriteriaId,
      urutan: c.urutan,
    })),
    authorUserId: t.authorUserId,
    createdAt: t.createdAt.toISOString(),
  };
}

export function makeTriaseService(deps: { clock?: Clock; dal?: Dal } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;

  /** Validasi kunjungan ada, belum dihapus, dan unit = IGD. */
  async function assertKunjunganIGD(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    if (k.unit !== "IGD") throw Errors.validation("Triase hanya untuk kunjungan IGD");
    return k;
  }

  /** Simpan pengkajian triase (append baris baru) + sinkron cache triaseLevel. */
  async function save(kunjunganId: string, input: TriaseInput, actor: Actor): Promise<TriaseDTO> {
    await assertKunjunganIGD(kunjunganId);
    const waktuTriase = parseWaktu(input.waktuTriase, clock.now());

    const created = await transaction(async (tx) => {
      const row = await dal.create(
        {
          kunjunganId,
          caraMasuk: input.caraMasuk,
          kondisiTiba: input.kondisiTiba,
          keluhanUtama: input.keluhanUtama,
          onset: input.onset,
          lokasiKeluhan: input.lokasiKeluhan ?? null,
          kualitasKeluhan: input.kualitasKeluhan ?? null,
          skalaBerat: input.skalaBerat ?? null,
          faktorPemberat: input.faktorPemberat ?? null,
          faktorPeringan: input.faktorPeringan ?? null,
          gejalaPenyerta: input.gejalaPenyerta,
          riwayatSerupa: input.riwayatSerupa ?? null,
          airwayStatus: input.airwayStatus,
          suaraNapasAbnormal: input.suaraNapasAbnormal,
          breathingQuality: input.breathingQuality,
          pergerakanDada: input.pergerakanDada ?? null,
          ototBantu: input.ototBantu ?? null,
          sianosis: input.sianosis ?? null,
          nadiTeraba: input.nadiTeraba,
          kualitasNadi: input.kualitasNadi ?? null,
          crt: input.crt ?? null,
          kondisiKulit: input.kondisiKulit ?? null,
          perdarahan: input.perdarahan ?? null,
          avpu: input.avpu,
          pupil: input.pupil ?? null,
          refleksCahaya: input.refleksCahaya ?? null,
          traumaLuka: input.traumaLuka ?? null,
          lokasiLuka: input.lokasiLuka ?? null,
          suhuKulit: input.suhuKulit ?? null,
          diagnosisSementara: input.diagnosisSementara ?? null,
          tindakanTriase: input.tindakanTriase,
          triageLevel: input.triageLevel,
          perawatTriase: input.perawatTriase,
          waktuTriase,
          authorUserId: actor.userId,
          authorPegawaiId: actor.pegawaiId,
          protocolId: input.protocolId ?? null,
          protocolKode: input.protocolKode ?? null,
          protocolNama: input.protocolNama ?? null,
          // Snapshot kriteria terpilih; urutan = posisi kirim (urut baris matrix).
          selectedCriteria: input.selectedCriteria.map((c, i) => ({
            parameterKode: c.parameterKode,
            parameterLabel: c.parameterLabel,
            levelKode: c.levelKode,
            levelLabel: c.levelLabel,
            nilai: c.nilai,
            sourceCriteriaId: c.sourceCriteriaId ?? null,
            urutan: i,
          })),
        },
        tx,
      );
      // Sinkron cache di spine (board IGD langsung tak "Belum Triase").
      await kunjunganDal.setTriaseLevel(kunjunganId, triaseLevelToInt(input.triageLevel), tx);
      return row;
    });

    return toDTO(created);
  }

  /** Pengkajian triase terbaru kunjungan (null bila belum ada). */
  async function getLatest(kunjunganId: string, _actor: Actor): Promise<TriaseDTO | null> {
    await assertKunjunganIGD(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const triaseService = makeTriaseService();
