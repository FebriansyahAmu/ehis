// asesmenAlergiService — Asesmen Medis · Alergi (MODEL PER-ITEM, daftar hidup).
// Tulis hanya delta: addItem = 1 insert, deleteItem = 1 soft-delete, setNka = upsert header.
// BUKAN snapshot seluruh daftar tiap simpan (hindari resource membengkak). Pemeriksa =
// user login (actor→pegawai). NKA & daftar alergi aktif saling eksklusif.
//
// RBAC `clinical.igd` di Route; ABAC unit-scope menyusul (TODO-CLINICAL §keputusan 4).

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenAlergiDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  AlergiItemInput,
  AlergiItemDTO,
  AlergiDTO,
  AlergiKategori,
  AlergiSeverity,
  AlergiStatus,
} from "@/lib/schemas/asesmenMedis/asesmenAlergi";
import type { AlergiEntity } from "@/lib/dal/asesmenMedis/asesmenAlergiDal";

type Dal = typeof defaultDal;
type NonNullAlergi = NonNullable<AlergiEntity>;

function toItemDTO(a: NonNullAlergi): AlergiItemDTO {
  return {
    id: a.id,
    category: a.category as AlergiKategori,
    allergen: a.allergen,
    reactions: a.reactions,
    severity: a.severity as AlergiSeverity,
    status: a.status as AlergiStatus,
    keterangan: a.keterangan,
    snomedCode: a.snomedCode,
    pemeriksa: a.pemeriksa,
    createdAt: a.createdAt.toISOString(),
  };
}

export function makeAsesmenAlergiService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Validasi kunjungan ada & belum dihapus (asesmen shared → tanpa batasan unit). */
  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Agregat: daftar alergi aktif + assertion NKA (tanpa header → nka false). */
  async function get(kunjunganId: string, _actor: Actor): Promise<AlergiDTO> {
    await assertKunjungan(kunjunganId);
    const [header, items] = await Promise.all([
      dal.getHeader(kunjunganId),
      dal.listByKunjungan(kunjunganId),
    ]);
    return { kunjunganId, nka: header?.nka ?? false, items: items.map(toItemDTO) };
  }

  /** Tambah 1 alergen (INSERT tunggal). Menambah alergen ⇒ NKA tak lagi benar → bersihkan. */
  async function addItem(kunjunganId: string, input: AlergiItemInput, actor: Actor): Promise<AlergiItemDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolveActorNama(actor);

    const row = await dal.createItem({
      kunjunganId,
      category: input.category,
      allergen: input.allergen,
      reactions: input.reactions,
      severity: input.severity,
      status: input.status,
      keterangan: input.keterangan ?? null,
      snomedCode: input.snomedCode ?? null,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });

    const header = await dal.getHeader(kunjunganId);
    if (header?.nka) {
      await dal.upsertHeader(kunjunganId, {
        nka: false, pemeriksa, authorUserId: actor.userId, authorPegawaiId: actor.pegawaiId,
      });
    }

    return toItemDTO(row);
  }

  /** Soft-delete 1 alergen (jejak medico-legal terjaga). Guard kepemilikan kunjungan. */
  async function deleteItem(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    const item = await dal.findItemById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Alergi tidak ditemukan");
    }
    await dal.softDeleteItem(itemId);
  }

  /** Set assertion NKA. NKA=true menolak bila masih ada alergi aktif (saling eksklusif). */
  async function setNka(kunjunganId: string, nka: boolean, actor: Actor): Promise<AlergiDTO> {
    await assertKunjungan(kunjunganId);
    if (nka) {
      const items = await dal.listByKunjungan(kunjunganId);
      if (items.length > 0) {
        throw Errors.validation("Tidak dapat menetapkan NKA: masih ada alergi tercatat. Hapus dulu daftar alergi.");
      }
    }
    const pemeriksa = await resolveActorNama(actor);
    await dal.upsertHeader(kunjunganId, {
      nka, pemeriksa, authorUserId: actor.userId, authorPegawaiId: actor.pegawaiId,
    });
    return get(kunjunganId, actor);
  }

  return { get, addItem, deleteItem, setNka };
}

export const asesmenAlergiService = makeAsesmenAlergiService();
