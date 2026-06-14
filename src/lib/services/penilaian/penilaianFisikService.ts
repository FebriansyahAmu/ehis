// penilaianFisikService — tab Penilaian, sub-menu Fisik. Append-only time-series: list (riwayat)
// + add (baris baru). pemeriksa = input override ATAU nama actor. tanggal/waktu = derive dari
// createdAt (TZ Asia/Jakarta). RBAC di Route: clinical.penilaian (read/create). ABAC careUnit di
// route() choke-point (clinical.* + params.id). Selaras pemeriksaanFisikService / asesmenGiziService.

import * as defaultDal from "@/lib/dal/penilaian/penilaianFisikDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PenilaianFisikEntity } from "@/lib/dal/penilaian/penilaianFisikDal";
import {
  type PenilaianFisikInput, type PenilaianFisikDTO,
} from "@/lib/schemas/penilaian/penilaianFisik";

type Dal = typeof defaultDal;

const DATE_FMT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" });

function toDTO(e: PenilaianFisikEntity): PenilaianFisikDTO {
  return {
    id: e.id,
    pemeriksaanUmum: e.pemeriksaanUmum,
    keadaanUmum: e.keadaanUmum,
    kesadaran: e.kesadaran,
    gizi: e.gizi,
    mobilitas: e.mobilitas,
    pemeriksa: e.pemeriksa,
    tanggal: DATE_FMT.format(e.createdAt),
    waktu: e.createdAt.toISOString(),
  };
}

export function makePenilaianFisikService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  // GET — riwayat penilaian fisik per kunjungan (terbaru dulu).
  async function list(kunjunganId: string, _actor: Actor): Promise<PenilaianFisikDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  // POST — tambah 1 penilaian fisik (append-only).
  async function add(
    kunjunganId: string, input: PenilaianFisikInput, actor: Actor,
  ): Promise<PenilaianFisikDTO> {
    await assertKunjungan(kunjunganId);

    const data = {
      pemeriksaanUmum: input.pemeriksaanUmum?.trim() ?? "",
      keadaanUmum: input.keadaanUmum?.trim() ?? "",
      kesadaran: input.kesadaran?.trim() ?? "",
      gizi: input.gizi?.trim() ?? "",
      mobilitas: input.mobilitas?.trim() ?? "",
    };
    if (!data.pemeriksaanUmum && !data.keadaanUmum && !data.kesadaran && !data.gizi && !data.mobilitas) {
      throw Errors.validation("Isi minimal satu field penilaian fisik");
    }

    const pemeriksa = input.pemeriksa?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      ...data,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  return { list, add };
}

export const penilaianFisikService = makePenilaianFisikService();
