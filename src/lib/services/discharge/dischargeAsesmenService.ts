// dischargeAsesmenService — Discharge Planning step 1: Asesmen Pemulangan (SNARS ARK 5).
// Simpan = append baris baru (latest-wins per kunjungan; jejak revisi utuh); get = revisi
// terkini atau null (belum pernah diisi). pencatat = nama actor (user login). RBAC
// clinical.rekammedis di Route; ABAC careUnit di route() choke-point.

import * as defaultDal from "@/lib/dal/discharge/dischargeAsesmenDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { DischargeAsesmenEntity } from "@/lib/dal/discharge/dischargeAsesmenDal";
import {
  type DischargeAsesmenInput, type DischargeAsesmenDTO,
} from "@/lib/schemas/discharge/dischargeAsesmen";

type Dal = typeof defaultDal;

function toDTO(e: DischargeAsesmenEntity): DischargeAsesmenDTO {
  return {
    tanggalRencanaKRS: e.tanggalRencanaKrs,
    kondisiPulang: e.kondisiPulang,
    caregiverNama: e.caregiverNama,
    caregiverHubungan: e.caregiverHubungan,
    caregiverKemampuan: e.caregiverKemampuan,
    kebutuhanHomecare: e.kebutuhanHomecare,
    jenisHomecare: e.jenisHomecare,
    kebutuhanAlatBantu: e.kebutuhanAlatBantu,
    alatBantu: e.alatBantu,
    dukunganKeluarga: e.dukunganKeluarga,
    kepatuhanObatSebelumnya: e.kepatuhanObatSebelumnya,
    riwayatReadmisi: e.riwayatReadmisi,
    catatan: e.catatan,
    pencatat: e.pencatat,
    updatedAt: e.createdAt.toISOString(),
  };
}

export function makeDischargeAsesmenService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Revisi terkini (null = belum pernah diisi). */
  async function get(kunjunganId: string, _actor: Actor): Promise<DischargeAsesmenDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latest(kunjunganId);
    return row ? toDTO(row) : null;
  }

  /** Simpan asesmen (append latest-wins; draft parsial sah). */
  async function save(kunjunganId: string, input: DischargeAsesmenInput, actor: Actor): Promise<DischargeAsesmenDTO> {
    await assertKunjungan(kunjunganId);
    const pencatat = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      tanggalRencanaKrs: input.tanggalRencanaKRS,
      kondisiPulang: input.kondisiPulang,
      caregiverNama: input.caregiverNama,
      caregiverHubungan: input.caregiverHubungan,
      caregiverKemampuan: input.caregiverKemampuan,
      kebutuhanHomecare: input.kebutuhanHomecare,
      jenisHomecare: input.jenisHomecare,
      kebutuhanAlatBantu: input.kebutuhanAlatBantu,
      alatBantu: input.alatBantu,
      dukunganKeluarga: input.dukunganKeluarga,
      kepatuhanObatSebelumnya: input.kepatuhanObatSebelumnya,
      riwayatReadmisi: input.riwayatReadmisi,
      catatan: input.catatan,
      pencatat,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  return { get, save };
}

export const dischargeAsesmenService = makeDischargeAsesmenService();
