// penilaianPediatrikService — tab Penilaian, sub-menu Pediatrik. Append-only: list (riwayat) +
// add (baris baru). pemeriksa = input override ATAU nama actor. tanggal/waktu = derive dari createdAt
// (TZ Asia/Jakarta). RBAC di Route: clinical.penilaian (read/create). ABAC careUnit di route()
// choke-point. Selaras penilaianStatusService.

import * as defaultDal from "@/lib/dal/penilaian/penilaianPediatrikDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PenilaianPediatrikEntity } from "@/lib/dal/penilaian/penilaianPediatrikDal";
import {
  type PenilaianPediatrikInput, type PenilaianPediatrikDTO,
} from "@/lib/schemas/penilaian/penilaianPediatrik";

type Dal = typeof defaultDal;

const DATE_FMT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" });

function toDTO(e: PenilaianPediatrikEntity): PenilaianPediatrikDTO {
  return {
    id: e.id,
    beratLahir: e.beratLahir,
    usiaGestasi: e.usiaGestasi,
    imunisasi: e.imunisasi,
    tumbuhKembang: e.tumbuhKembang,
    catatan: e.catatan,
    pemeriksa: e.pemeriksa,
    tanggal: DATE_FMT.format(e.createdAt),
    waktu: e.createdAt.toISOString(),
  };
}

export function makePenilaianPediatrikService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  // GET — riwayat penilaian pediatrik per kunjungan (terbaru dulu).
  async function list(kunjunganId: string, _actor: Actor): Promise<PenilaianPediatrikDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  // POST — tambah 1 penilaian pediatrik (append-only).
  async function add(
    kunjunganId: string, input: PenilaianPediatrikInput, actor: Actor,
  ): Promise<PenilaianPediatrikDTO> {
    await assertKunjungan(kunjunganId);

    const data = {
      beratLahir: input.beratLahir?.trim() ?? "",
      usiaGestasi: input.usiaGestasi?.trim() ?? "",
      imunisasi: input.imunisasi?.trim() ?? "",
      tumbuhKembang: input.tumbuhKembang?.trim() ?? "",
      catatan: input.catatan?.trim() ?? "",
    };
    if (!Object.values(data).some(Boolean)) {
      throw Errors.validation("Isi minimal satu field penilaian pediatrik");
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

export const penilaianPediatrikService = makePenilaianPediatrikService();
