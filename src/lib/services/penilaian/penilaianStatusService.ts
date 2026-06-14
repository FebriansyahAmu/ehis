// penilaianStatusService — tab Penilaian, sub-menu Status Klinis. Append-only: list (riwayat) +
// add (baris baru). pemeriksa = input override ATAU nama actor. tanggal/waktu = derive dari createdAt
// (TZ Asia/Jakarta). RBAC di Route: clinical.penilaian (read/create). ABAC careUnit di route()
// choke-point. Selaras penilaianNyeriService.

import * as defaultDal from "@/lib/dal/penilaian/penilaianStatusDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PenilaianStatusEntity } from "@/lib/dal/penilaian/penilaianStatusDal";
import {
  type PenilaianStatusInput, type PenilaianStatusDTO,
} from "@/lib/schemas/penilaian/penilaianStatus";

type Dal = typeof defaultDal;

const DATE_FMT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" });

function toDTO(e: PenilaianStatusEntity): PenilaianStatusDTO {
  return {
    id: e.id,
    status: e.status,
    kesadaran: e.kesadaran,
    catatan: e.catatan,
    pemeriksa: e.pemeriksa,
    tanggal: DATE_FMT.format(e.createdAt),
    waktu: e.createdAt.toISOString(),
  };
}

export function makePenilaianStatusService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  // GET — riwayat penilaian status klinis per kunjungan (terbaru dulu).
  async function list(kunjunganId: string, _actor: Actor): Promise<PenilaianStatusDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  // POST — tambah 1 penilaian status (append-only).
  async function add(
    kunjunganId: string, input: PenilaianStatusInput, actor: Actor,
  ): Promise<PenilaianStatusDTO> {
    await assertKunjungan(kunjunganId);

    const data = {
      status: input.status?.trim() ?? "",
      kesadaran: input.kesadaran?.trim() ?? "",
      catatan: input.catatan?.trim() ?? "",
    };
    if (!Object.values(data).some(Boolean)) {
      throw Errors.validation("Isi minimal satu field penilaian status klinis");
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

export const penilaianStatusService = makePenilaianStatusService();
