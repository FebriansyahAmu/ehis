// asesmenObatService — Asesmen·Riwayat·Pemberian Obat. Append-only "latest wins"
// (parent + item snapshot). Nested create atomik → tanpa transaction eksplisit.
//
// S5a (FHIR L07): item dapat ditautkan ke katalog master.Obat (`obatId`, dipilih dari rekomendasi formularium)
// + status masih diminum/berhenti. Kode KFA TIDAK diterima dari klien: id divalidasi ke master (id tak dikenal
// dilepas → item jadi ketik bebas) dan KFA diturunkan dari master.Obat.kfa (pola D7, anti-spoof).

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenObatDal";
import * as obatDal from "@/lib/dal/master/obatDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import { kfaRiwayatOf, type KfaProduk, type StatusRiwayatObat } from "@/lib/fhir/links/riwayatObat";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenObatInput, AsesmenObatDTO } from "@/lib/schemas/asesmenMedis/asesmenObat";
import type { AsesmenObatEntity } from "@/lib/dal/asesmenMedis/asesmenObatDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AsesmenObatEntity>;
type KfaByObat = Map<string, KfaProduk | null>;

const asStatus = (s: string | null): StatusRiwayatObat | null => (s === "aktif" || s === "berhenti" ? s : null);

function toDTO(r: NonNullEntity, kfaByObat: KfaByObat): AsesmenObatDTO {
  return {
    id: r.id,
    kunjunganId: r.kunjunganId,
    items: r.items.map((i) => ({
      id: i.id,
      nama: i.nama,
      obatId: i.obatId,
      status: asStatus(i.status),
      kfa: i.obatId ? kfaRiwayatOf(kfaByObat.get(i.obatId)) : null,
      dosis: i.dosis,
      frekuensi: i.frekuensi,
      rute: i.rute,
      sejak: i.sejak,
      indikasi: i.indikasi,
      urutan: i.urutan,
    })),
    pemeriksa: r.pemeriksa,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeAsesmenObatService(deps: { dal?: Dal; obat?: Pick<typeof obatDal, "findKfaByIds"> } = {}) {
  const dal = deps.dal ?? defaultDal;
  const obat = deps.obat ?? obatDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Blok KFA master per obatId yang MASIH ada (soft-deleted/tak dikenal tidak masuk peta). */
  async function kfaOf(ids: (string | null | undefined)[]): Promise<KfaByObat> {
    const uniq = [...new Set(ids.filter((x): x is string => !!x))];
    const rows = await obat.findKfaByIds(uniq);
    return new Map(rows.map((o) => [o.id, (o.kfa ?? null) as KfaProduk | null]));
  }

  async function save(kunjunganId: string, input: AsesmenObatInput, actor: Actor): Promise<AsesmenObatDTO> {
    await assertKunjungan(kunjunganId);
    const [pemeriksa, kfaByObat] = await Promise.all([resolveActorNama(actor), kfaOf(input.items.map((it) => it.obatId))]);
    const row = await dal.create({
      kunjunganId,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      items: input.items.map((it, i) => ({
        nama: it.nama,
        obatId: it.obatId && kfaByObat.has(it.obatId) ? it.obatId : null, // id tak dikenal → lepas tautan
        status: it.status ?? null,
        dosis: it.dosis ?? null,
        frekuensi: it.frekuensi ?? null,
        rute: it.rute ?? null,
        sejak: it.sejak ?? null,
        indikasi: it.indikasi ?? null,
        urutan: i,
      })),
    });
    return toDTO(row, kfaByObat);
  }

  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AsesmenObatDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    if (!row) return null;
    return toDTO(row, await kfaOf(row.items.map((i) => i.obatId)));
  }

  return { save, getLatest };
}

export const asesmenObatService = makeAsesmenObatService();
