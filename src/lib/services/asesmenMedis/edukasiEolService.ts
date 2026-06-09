// edukasiEolService — Asesmen Medis · Edukasi · End of Life (Advance Care Planning).
// Care plan = single-record latest-wins (savePlan append, get latest); family meeting = log
// per-item (addMeeting/deleteMeeting). Petugas/author = user login (actor). Tak ada cache spine.
//
// RBAC `clinical.igd` di Route; ABAC unit-scope menyusul (TODO-CLINICAL §keputusan 4).

import * as defaultDal from "@/lib/dal/asesmenMedis/edukasiEolDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  EdukasiEolInput,
  EdukasiEolMeetingInput,
  EdukasiEolDTO,
  EdukasiEolPlanDTO,
  EdukasiEolMeetingDTO,
  EolCodeStatus,
  EolPengambilKeputusan,
} from "@/lib/schemas/asesmenMedis/edukasiEol";
import type { EolPlanEntity, EolMeetingEntity } from "@/lib/dal/asesmenMedis/edukasiEolDal";

type Dal = typeof defaultDal;

function toPlanDTO(p: EolPlanEntity): EdukasiEolPlanDTO {
  return {
    id: p.id,
    kunjunganId: p.kunjunganId,
    codeStatus: p.codeStatus as EolCodeStatus,
    alasanKode: p.alasanKode,
    pengambilKeputusan: p.pengambilKeputusan as EolPengambilKeputusan,
    namaWali: p.namaWali,
    hubunganWali: p.hubunganWali,
    kontakWali: p.kontakWali,
    advanceDirective: p.advanceDirective,
    terapiDiinginkan: p.terapiDiinginkan,
    terapiDitolak: p.terapiDitolak,
    tujuanPerawatan: p.tujuanPerawatan,
    gejalaDitangani: p.gejalaDitangani,
    kebutuhanSpiritual: p.kebutuhanSpiritual,
    petugasPaliatif: p.petugasPaliatif,
    tanggalDNR: p.tanggalDNR,
    dokterDNR: p.dokterDNR,
    catatanDNR: p.catatanDNR,
    petugas: p.petugas,
    createdAt: p.createdAt.toISOString(),
  };
}

function toMeetingDTO(m: EolMeetingEntity): EdukasiEolMeetingDTO {
  return {
    id: m.id,
    tanggal: m.tanggal,
    peserta: m.peserta,
    topik: m.topik,
    keputusan: m.keputusan,
    createdAt: m.createdAt.toISOString(),
  };
}

export function makeEdukasiEolService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Agregat: care plan terbaru (null bila belum) + log pertemuan keluarga. */
  async function get(kunjunganId: string, _actor: Actor): Promise<EdukasiEolDTO> {
    await assertKunjungan(kunjunganId);
    const [plan, meetings] = await Promise.all([
      dal.latestPlan(kunjunganId),
      dal.listMeetings(kunjunganId),
    ]);
    return {
      kunjunganId,
      plan: plan ? toPlanDTO(plan) : null,
      meetings: meetings.map(toMeetingDTO),
    };
  }

  /** Simpan care plan (append baris baru, latest-wins). Petugas dari user login. */
  async function savePlan(kunjunganId: string, input: EdukasiEolInput, actor: Actor): Promise<EdukasiEolPlanDTO> {
    await assertKunjungan(kunjunganId);
    const petugas = await resolveActorNama(actor);

    const row = await dal.createPlan({
      kunjunganId,
      codeStatus: input.codeStatus,
      alasanKode: input.alasanKode ?? null,
      pengambilKeputusan: input.pengambilKeputusan,
      namaWali: input.namaWali ?? null,
      hubunganWali: input.hubunganWali ?? null,
      kontakWali: input.kontakWali ?? null,
      advanceDirective: input.advanceDirective,
      terapiDiinginkan: input.terapiDiinginkan,
      terapiDitolak: input.terapiDitolak,
      tujuanPerawatan: input.tujuanPerawatan ?? null,
      gejalaDitangani: input.gejalaDitangani ?? null,
      kebutuhanSpiritual: input.kebutuhanSpiritual ?? null,
      petugasPaliatif: input.petugasPaliatif ?? null,
      tanggalDNR: input.tanggalDNR ?? null,
      dokterDNR: input.dokterDNR ?? null,
      catatanDNR: input.catatanDNR ?? null,
      petugas,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });

    return toPlanDTO(row);
  }

  /** Tambah 1 catatan pertemuan keluarga (append). */
  async function addMeeting(kunjunganId: string, input: EdukasiEolMeetingInput, actor: Actor): Promise<EdukasiEolMeetingDTO> {
    await assertKunjungan(kunjunganId);
    const row = await dal.createMeeting({
      kunjunganId,
      tanggal: input.tanggal ?? null,
      peserta: input.peserta,
      topik: input.topik,
      keputusan: input.keputusan ?? null,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toMeetingDTO(row);
  }

  /** Soft-delete 1 pertemuan. Guard kepemilikan kunjungan. */
  async function deleteMeeting(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    const m = await dal.findMeetingById(itemId);
    if (!m || m.kunjunganId !== kunjunganId || m.deletedAt) {
      throw Errors.notFound("Pertemuan keluarga tidak ditemukan");
    }
    await dal.softDeleteMeeting(itemId);
  }

  return { get, savePlan, addMeeting, deleteMeeting };
}

export const edukasiEolService = makeEdukasiEolService();
