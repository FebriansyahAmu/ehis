// penilaianNyeriService — tab Penilaian, sub-menu Nyeri (asesmen komprehensif). Append-only:
// list (riwayat) + add (baris baru). SKOR NRS bukan urusan domain ini (single source = Observation).
// pemeriksa = input override ATAU nama actor. tanggal/waktu = derive dari createdAt (TZ Asia/Jakarta).
// RBAC di Route: clinical.penilaian (read/create). ABAC careUnit di route() choke-point. Selaras penilaianFisikService.

import * as defaultDal from "@/lib/dal/penilaian/penilaianNyeriDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PenilaianNyeriEntity } from "@/lib/dal/penilaian/penilaianNyeriDal";
import {
  type PenilaianNyeriInput, type PenilaianNyeriDTO,
} from "@/lib/schemas/penilaian/penilaianNyeri";

type Dal = typeof defaultDal;

const DATE_FMT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" });

function toDTO(e: PenilaianNyeriEntity): PenilaianNyeriDTO {
  return {
    id: e.id,
    lokasi: e.lokasi,
    karakter: e.karakter,
    durasi: e.durasi,
    faktorPemberat: e.faktorPemberat,
    faktorPeringan: e.faktorPeringan,
    tipeNyeri: e.tipeNyeri,
    dampakFungsional: e.dampakFungsional,
    rencanaReasesmen: e.rencanaReasesmen,
    catatan: e.catatan,
    pemeriksa: e.pemeriksa,
    tanggal: DATE_FMT.format(e.createdAt),
    waktu: e.createdAt.toISOString(),
  };
}

export function makePenilaianNyeriService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  // GET — riwayat penilaian nyeri per kunjungan (terbaru dulu).
  async function list(kunjunganId: string, _actor: Actor): Promise<PenilaianNyeriDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  // POST — tambah 1 asesmen nyeri (append-only).
  async function add(
    kunjunganId: string, input: PenilaianNyeriInput, actor: Actor,
  ): Promise<PenilaianNyeriDTO> {
    await assertKunjungan(kunjunganId);

    const data = {
      lokasi: input.lokasi?.trim() ?? "",
      karakter: input.karakter?.trim() ?? "",
      durasi: input.durasi?.trim() ?? "",
      faktorPemberat: input.faktorPemberat?.trim() ?? "",
      faktorPeringan: input.faktorPeringan?.trim() ?? "",
      tipeNyeri: input.tipeNyeri?.trim() ?? "",
      dampakFungsional: input.dampakFungsional?.trim() ?? "",
      rencanaReasesmen: input.rencanaReasesmen?.trim() ?? "",
      catatan: input.catatan?.trim() ?? "",
    };
    if (!Object.values(data).some(Boolean)) {
      throw Errors.validation("Isi minimal satu field asesmen nyeri");
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

export const penilaianNyeriService = makePenilaianNyeriService();
