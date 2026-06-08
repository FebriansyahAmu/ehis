// anamnesisService — domain Anamnesis (Asesmen Medis, rekam medis shared IGD/RI/RJ).
// Append-only "latest wins": `save` menulis baris baru; `getLatest` = baris terbaru.
// Tak import prisma langsung (FLOWS §2 — pakai DAL). Tanpa cache spine → tanpa transaksi
// (single insert). Pemeriksa = user login (actor→pegawai), bukan free-text.
//
// RBAC `clinical.igd` di Route; ABAC unit-scope menyusul (TODO-CLINICAL §keputusan 4).

import * as defaultDal from "@/lib/dal/asesmenMedis/anamnesisDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import * as pegawaiDal from "@/lib/dal/pegawaiDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AnamnesisInput, AnamnesisDTO, SumberAnamnesis } from "@/lib/schemas/asesmenMedis/anamnesis";
import type { AnamnesisEntity } from "@/lib/dal/asesmenMedis/anamnesisDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AnamnesisEntity>;

/** Nama tampil pegawai (gelar depan + nama + gelar belakang) — mirror authService. */
function namaTampil(p: { gelarDepan: string | null; namaLengkap: string; gelarBelakang: string | null }): string {
  const depan = p.gelarDepan ? `${p.gelarDepan} ` : "";
  const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : "";
  return `${depan}${p.namaLengkap}${belakang}`;
}

/** Pemeriksa = pegawai dari actor (user login terverifikasi), BUKAN free-text. Fallback
 *  "—" hanya bila pegawai tak ditemukan (mis. dev actor) — integritas medico-legal. */
async function resolvePemeriksa(actor: Actor): Promise<string> {
  const p = actor.pegawaiId ? await pegawaiDal.findById(actor.pegawaiId) : null;
  return p ? namaTampil(p) : "—";
}

function toDTO(a: NonNullEntity): AnamnesisDTO {
  return {
    id: a.id,
    kunjunganId: a.kunjunganId,
    sumberAnamnesis: a.sumberAnamnesis as SumberAnamnesis,
    keluhanUtama: a.keluhanUtama,
    rps: a.rps,
    onsetDurasi: a.onsetDurasi,
    mekanismeCedera: a.mekanismeCedera,
    faktorPemberat: a.faktorPemberat,
    faktorPeringan: a.faktorPeringan,
    statusGeneralis: a.statusGeneralis,
    obatSaatIni: a.obatSaatIni,
    pemeriksa: a.pemeriksa,
    authorUserId: a.authorUserId,
    createdAt: a.createdAt.toISOString(),
  };
}

export function makeAnamnesisService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Validasi kunjungan ada & belum dihapus (asesmen shared → tanpa batasan unit). */
  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Simpan asesmen anamnesis (append baris baru). */
  async function save(kunjunganId: string, input: AnamnesisInput, actor: Actor): Promise<AnamnesisDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolvePemeriksa(actor);

    const row = await dal.create({
      kunjunganId,
      sumberAnamnesis: input.sumberAnamnesis,
      keluhanUtama: input.keluhanUtama,
      rps: input.rps,
      onsetDurasi: input.onsetDurasi ?? null,
      mekanismeCedera: input.mekanismeCedera ?? null,
      faktorPemberat: input.faktorPemberat ?? null,
      faktorPeringan: input.faktorPeringan ?? null,
      statusGeneralis: input.statusGeneralis,
      obatSaatIni: input.obatSaatIni ?? null,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });

    return toDTO(row);
  }

  /** Asesmen anamnesis terbaru kunjungan (null bila belum ada). */
  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AnamnesisDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const anamnesisService = makeAnamnesisService();
