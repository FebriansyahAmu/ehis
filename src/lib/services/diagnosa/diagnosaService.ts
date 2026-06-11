// diagnosaService — tab Diagnosa (koding ICD-10 + prosedur ICD-9 per kunjungan).
// Daftar hidup per-item; maks 1 Utama aktif (promosi menggeser Utama lama → Sekunder,
// atomik dalam transaksi; partial unique index = backstop DB). Mutasi diagnosa
// mengembalikan agregat penuh karena promosi Utama mengubah baris lain.
// Pemeriksa = user login (actor→pegawai). RBAC di Route: ICD-10 diagnosa = `clinical.diagnosa`,
// prosedur ICD-9-CM = `clinical.prosedur` (resource terpisah → Perawat boleh input ICD-9 tanpa
// hak tulis ICD-10). GET agregat di-gate clinical.diagnosa:read (memuat ICD-10 + ICD-9 sekaligus).
// ABAC careUnit ditegakkan route() choke-point (clinical.*).

import * as defaultDal from "@/lib/dal/diagnosa/diagnosaDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { transaction, type Tx } from "@/lib/db/prisma";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  DiagnosaItemInput,
  DiagnosaItemUpdate,
  ProsedurItemInput,
  DiagnosaItemDTO,
  ProsedurItemDTO,
  DiagnosaDTO,
  DiagnosaTipe,
  DiagnosaStatus,
} from "@/lib/schemas/diagnosa/diagnosa";
import type { DiagnosaEntity, ProsedurEntity } from "@/lib/dal/diagnosa/diagnosaDal";

type Dal = typeof defaultDal;

function toItemDTO(d: DiagnosaEntity): DiagnosaItemDTO {
  return {
    id: d.id,
    kodeIcd10: d.kodeIcd10,
    namaDiagnosis: d.namaDiagnosis,
    tipe: d.tipe as DiagnosaTipe,
    status: d.status as DiagnosaStatus,
    alasan: d.alasan ?? undefined,
    analisa: d.analisa ?? undefined,
    kategori: d.kategori ?? undefined,
    inaCbg: d.inaCbg ?? undefined,
    pemeriksa: d.pemeriksa,
    createdAt: d.createdAt.toISOString(),
  };
}

function toProsedurDTO(p: ProsedurEntity): ProsedurItemDTO {
  return {
    id: p.id,
    kode: p.kode,
    nama: p.nama,
    kategori: p.kategori,
    catatan: p.catatan ?? undefined,
    pemeriksa: p.pemeriksa,
    createdAt: p.createdAt.toISOString(),
  };
}

export function makeDiagnosaService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertDiagnosaMilikKunjungan(kunjunganId: string, itemId: string, tx?: Tx) {
    const item = await dal.findDiagnosaById(itemId, tx);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Diagnosis tidak ditemukan");
    }
    return item;
  }

  async function aggregate(kunjunganId: string, tx?: Tx): Promise<DiagnosaDTO> {
    const [items, prosedur] = await Promise.all([
      dal.listDiagnosa(kunjunganId, tx),
      dal.listProsedur(kunjunganId, tx),
    ]);
    return {
      kunjunganId,
      items: items.map(toItemDTO),
      prosedur: prosedur.map(toProsedurDTO),
    };
  }

  async function get(kunjunganId: string, _actor: Actor): Promise<DiagnosaDTO> {
    await assertKunjungan(kunjunganId);
    return aggregate(kunjunganId);
  }

  async function addDiagnosa(
    kunjunganId: string,
    input: DiagnosaItemInput,
    actor: Actor,
  ): Promise<DiagnosaDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolveActorNama(actor);

    return transaction(async (tx) => {
      const sudahAda = await dal.findDiagnosaAktifByKode(kunjunganId, input.kodeIcd10, tx);
      if (sudahAda) {
        throw Errors.validation(`Kode ${input.kodeIcd10} sudah tercatat pada kunjungan ini`);
      }
      if (input.tipe === "Utama") await dal.demoteUtama(kunjunganId, null, tx);

      await dal.createDiagnosa(
        {
          kunjunganId,
          kodeIcd10: input.kodeIcd10,
          namaDiagnosis: input.namaDiagnosis,
          tipe: input.tipe,
          status: input.status,
          alasan: input.alasan ?? null,
          analisa: input.analisa ?? null,
          kategori: input.kategori ?? null,
          inaCbg: input.inaCbg ?? null,
          pemeriksa,
          authorUserId: actor.userId,
          authorPegawaiId: actor.pegawaiId,
        },
        tx,
      );

      return aggregate(kunjunganId, tx);
    });
  }

  async function updateDiagnosa(
    kunjunganId: string,
    itemId: string,
    input: DiagnosaItemUpdate,
    _actor: Actor,
  ): Promise<DiagnosaDTO> {
    await assertKunjungan(kunjunganId);

    return transaction(async (tx) => {
      await assertDiagnosaMilikKunjungan(kunjunganId, itemId, tx);
      if (input.tipe === "Utama") await dal.demoteUtama(kunjunganId, itemId, tx);

      const count = await dal.updateDiagnosa(
        itemId,
        { tipe: input.tipe, status: input.status, alasan: input.alasan, analisa: input.analisa },
        tx,
      );
      if (count === 0) throw Errors.notFound("Diagnosis tidak ditemukan");

      return aggregate(kunjunganId, tx);
    });
  }

  async function deleteDiagnosa(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertDiagnosaMilikKunjungan(kunjunganId, itemId);
    await dal.softDeleteDiagnosa(itemId);
  }

  async function addProsedur(
    kunjunganId: string,
    input: ProsedurItemInput,
    actor: Actor,
  ): Promise<ProsedurItemDTO> {
    await assertKunjungan(kunjunganId);

    const sudahAda = await dal.findProsedurAktifByKode(kunjunganId, input.kode);
    if (sudahAda) {
      throw Errors.validation(`Kode ${input.kode} sudah tercatat pada kunjungan ini`);
    }

    const pemeriksa = await resolveActorNama(actor);
    const row = await dal.createProsedur({
      kunjunganId,
      kode: input.kode,
      nama: input.nama,
      kategori: input.kategori,
      catatan: input.catatan ?? null,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toProsedurDTO(row);
  }

  async function deleteProsedur(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    const item = await dal.findProsedurById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Prosedur tidak ditemukan");
    }
    await dal.softDeleteProsedur(itemId);
  }

  return { get, addDiagnosa, updateDiagnosa, deleteDiagnosa, addProsedur, deleteProsedur };
}

export const diagnosaService = makeDiagnosaService();
