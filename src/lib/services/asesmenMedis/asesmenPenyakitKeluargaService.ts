// asesmenPenyakitKeluargaService — Asesmen·Riwayat·Penyakit Keluarga. Append-only "latest wins".

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenPenyakitKeluargaDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import * as katalogDal from "@/lib/dal/master/asesmenKatalogDal";
import { indeksKode, kodeSejajar, type KategoriRiwayat } from "@/lib/services/asesmenMedis/katalogKode";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenPenyakitKeluargaInput, AsesmenPenyakitKeluargaDTO } from "@/lib/schemas/asesmenMedis/asesmenPenyakitKeluarga";
import type { AsesmenPenyakitKeluargaEntity } from "@/lib/dal/asesmenMedis/asesmenPenyakitKeluargaDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AsesmenPenyakitKeluargaEntity>;

function toDTO(r: NonNullEntity): AsesmenPenyakitKeluargaDTO {
  return {
    id: r.id,
    kunjunganId: r.kunjunganId,
    riwayatLain: r.riwayatLain,
    items: r.items.map((i) => ({
      id: i.id,
      anggota: i.anggota,
      penyakit: i.penyakit,
      keterangan: i.keterangan,
      urutan: i.urutan,
    })),
    pemeriksa: r.pemeriksa,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeAsesmenPenyakitKeluargaService(deps: { dal?: Dal; katalog?: Pick<typeof katalogDal, "listKodeNama"> } = {}) {
  const dal = deps.dal ?? defaultDal;
  const katalog = deps.katalog ?? katalogDal;
  const muatIndeks = async (k: KategoriRiwayat) => indeksKode(await katalog.listKodeNama(k));

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function save(
    kunjunganId: string,
    input: AsesmenPenyakitKeluargaInput,
    actor: Actor,
  ): Promise<AsesmenPenyakitKeluargaDTO> {
    await assertKunjungan(kunjunganId);
    const [pemeriksa, idxAnggota, idxPenyakit] = await Promise.all([
      resolveActorNama(actor), muatIndeks("AnggotaKeluarga"), muatIndeks("PenyakitKeluarga"),
    ]);
    const row = await dal.create({
      kunjunganId,
      riwayatLain: input.riwayatLain ?? null,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      items: input.items.map((it, i) => ({
        anggota: it.anggota,
        anggotaKode: kodeSejajar([it.anggota], idxAnggota)[0] || null, // D7: kode diturunkan server
        penyakit: it.penyakit,
        penyakitKode: kodeSejajar(it.penyakit, idxPenyakit),
        keterangan: it.keterangan ?? null,
        urutan: i,
      })),
    });
    return toDTO(row);
  }

  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AsesmenPenyakitKeluargaDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const asesmenPenyakitKeluargaService = makeAsesmenPenyakitKeluargaService();
