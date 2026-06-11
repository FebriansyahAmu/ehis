// cpptService — tab CPPT (catatan perkembangan terintegrasi per kunjungan).
// Daftar per-item lintas profesi. Penulis/verifikator = user login (actor→pegawai),
// BUKAN free-text. Mengedit isi catatan membatalkan co-sign sebelumnya (verified reset).
// needsVerify = tab requiresVerification (RI) ATAU jenis TBAK (SKP 2, wajib co-sign DPJP).
// RBAC `clinical.cppt` di Route; ABAC unit-scope menyusul (TODO-CLINICAL keputusan #4).

import * as defaultDal from "@/lib/dal/cppt/cpptDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { systemClock, type Clock } from "@/lib/core/clock";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { Tx } from "@/lib/db/prisma";
import type {
  CpptItemInput,
  CpptItemUpdate,
  CpptEntryDTO,
  CpptDTO,
  CpptProfesi,
  CpptJenis,
  TbakMetode,
} from "@/lib/schemas/cppt/cppt";
import type { CpptEntity } from "@/lib/dal/cppt/cpptDal";

type Dal = typeof defaultDal;

const TZ = "Asia/Jakarta";
const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function jakartaParts(d: Date) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), mi: get("minute") };
}

function fmtVerifiedAt(d: Date): string {
  const { y, mo, d: day, h, mi } = jakartaParts(d);
  return `${parseInt(day, 10)} ${MONTHS_ID[parseInt(mo, 10) - 1]} ${y}, ${h}:${mi}`;
}

// Sumber isi catatan (input add / merge update) — semua opsional.
interface ContentSrc {
  subjektif?: string;
  objektif?: string;
  asesmen?: string;
  planning?: string;
  instruksi?: string;
  tbakPemberi?: string;
  tbakMetode?: TbakMetode;
  tbakTulis?: boolean;
  tbakBaca?: boolean;
  tbakKonfirmasi?: boolean;
}

// Kolom isi sesuai jenis: TBAK pakai instruksi + Tulis-Baca-Konfirmasi (narasi S/O/A/P
// dikosongkan); SOAP/SBAR pakai narasi (field TBAK dikosongkan). instruksi dipakai
// SOAP (langkah I) & TBAK.
function contentColumns(jenis: CpptJenis, s: ContentSrc) {
  const isTbak = jenis === "TBAK";
  return {
    subjektif: isTbak ? null : s.subjektif ?? null,
    objektif: isTbak ? null : s.objektif ?? null,
    asesmen: isTbak ? null : s.asesmen ?? null,
    planning: isTbak ? null : s.planning ?? null,
    instruksi: s.instruksi ?? null,
    tbakPemberi: isTbak ? s.tbakPemberi ?? null : null,
    tbakMetode: isTbak ? s.tbakMetode ?? null : null,
    tbakTulis: isTbak ? s.tbakTulis ?? false : null,
    tbakBaca: isTbak ? s.tbakBaca ?? false : null,
    tbakKonfirmasi: isTbak ? s.tbakKonfirmasi ?? false : null,
  };
}

function assertContentValid(jenis: CpptJenis, s: ContentSrc) {
  if (jenis === "TBAK") {
    const lengkap = s.tbakPemberi && s.instruksi && s.tbakTulis && s.tbakBaca && s.tbakKonfirmasi;
    if (!lengkap) {
      throw Errors.validation(
        "TBAK wajib: pemberi instruksi, isi instruksi, dan ketiga langkah Tulis–Baca–Konfirmasi",
      );
    }
    return;
  }
  const adaNarasi = !!(s.subjektif || s.objektif || s.asesmen || s.planning || s.instruksi);
  if (!adaNarasi) throw Errors.validation("Catatan tidak boleh kosong");
}

const needsVerify = (jenis: CpptJenis, perluVerifikasi: boolean) =>
  perluVerifikasi || jenis === "TBAK";

function toDTO(c: CpptEntity): CpptEntryDTO {
  const { y, mo, d, h, mi } = jakartaParts(c.waktuCatatan);
  return {
    id: c.id,
    waktu: `${h}:${mi}`,
    tanggal: `${y}-${mo}-${d}`,
    profesi: c.profesi as CpptProfesi,
    penulis: c.penulis,
    jenisCatatan: c.jenisCatatan as CpptJenis,
    subjektif: c.subjektif ?? undefined,
    objektif: c.objektif ?? undefined,
    asesmen: c.asesmen ?? undefined,
    planning: c.planning ?? undefined,
    instruksi: c.instruksi ?? undefined,
    tbakPemberi: c.tbakPemberi ?? undefined,
    tbakMetode: (c.tbakMetode as TbakMetode | null) ?? undefined,
    tbakTulis: c.tbakTulis ?? undefined,
    tbakBaca: c.tbakBaca ?? undefined,
    tbakKonfirmasi: c.tbakKonfirmasi ?? undefined,
    verified: c.verified ?? undefined,
    verifiedBy: c.verifiedBy ?? undefined,
    verifiedAt: c.verifiedAt ? fmtVerifiedAt(c.verifiedAt) : undefined,
    flagged: c.flagged,
    authorUserId: c.authorUserId ?? undefined,
  };
}

export function makeCpptService(deps: { clock?: Clock; dal?: Dal } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilikKunjungan(kunjunganId: string, itemId: string, tx?: Tx) {
    const item = await dal.findById(itemId, tx);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Catatan CPPT tidak ditemukan");
    }
    return item;
  }

  async function reload(itemId: string): Promise<CpptEntryDTO> {
    const fresh = await dal.findById(itemId);
    if (!fresh) throw Errors.internal("Gagal memuat catatan CPPT");
    return toDTO(fresh);
  }

  async function get(kunjunganId: string, _actor: Actor): Promise<CpptDTO> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return { kunjunganId, entries: rows.map(toDTO) };
  }

  async function add(
    kunjunganId: string,
    input: CpptItemInput,
    actor: Actor,
  ): Promise<CpptEntryDTO> {
    await assertKunjungan(kunjunganId);
    assertContentValid(input.jenisCatatan, input);

    const penulis = await resolveActorNama(actor);
    const nv = needsVerify(input.jenisCatatan, input.perluVerifikasi);

    const row = await dal.create({
      kunjunganId,
      profesi: input.profesi,
      penulis,
      jenisCatatan: input.jenisCatatan,
      ...contentColumns(input.jenisCatatan, input),
      verified: nv ? false : null,
      flagged: false,
      waktuCatatan: clock.now(),
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  async function update(
    kunjunganId: string,
    itemId: string,
    input: CpptItemUpdate,
    _actor: Actor,
  ): Promise<CpptEntryDTO> {
    await assertKunjungan(kunjunganId);
    const existing = await assertMilikKunjungan(kunjunganId, itemId);

    const jenis = input.jenisCatatan ?? (existing.jenisCatatan as CpptJenis);
    const merged: ContentSrc = {
      subjektif: input.subjektif ?? existing.subjektif ?? undefined,
      objektif: input.objektif ?? existing.objektif ?? undefined,
      asesmen: input.asesmen ?? existing.asesmen ?? undefined,
      planning: input.planning ?? existing.planning ?? undefined,
      instruksi: input.instruksi ?? existing.instruksi ?? undefined,
      tbakPemberi: input.tbakPemberi ?? existing.tbakPemberi ?? undefined,
      tbakMetode: input.tbakMetode ?? (existing.tbakMetode as TbakMetode | null) ?? undefined,
      tbakTulis: input.tbakTulis ?? existing.tbakTulis ?? undefined,
      tbakBaca: input.tbakBaca ?? existing.tbakBaca ?? undefined,
      tbakKonfirmasi: input.tbakKonfirmasi ?? existing.tbakKonfirmasi ?? undefined,
    };
    assertContentValid(jenis, merged);

    const perlu = input.perluVerifikasi ?? existing.verified !== null;
    const nv = needsVerify(jenis, perlu);

    await dal.update(itemId, {
      profesi: input.profesi ?? existing.profesi,
      jenisCatatan: jenis,
      ...contentColumns(jenis, merged),
      verified: nv ? false : null, // edit membatalkan co-sign sebelumnya
      verifiedBy: null,
      verifiedAt: null,
    });
    return reload(itemId);
  }

  async function verify(
    kunjunganId: string,
    itemId: string,
    actor: Actor,
  ): Promise<CpptEntryDTO> {
    await assertKunjungan(kunjunganId);
    const existing = await assertMilikKunjungan(kunjunganId, itemId);
    if (existing.verified === null) {
      throw Errors.validation("Catatan ini tidak memerlukan verifikasi DPJP");
    }

    await dal.update(itemId, {
      verified: true,
      verifiedBy: await resolveActorNama(actor),
      verifiedAt: clock.now(),
    });
    return reload(itemId);
  }

  async function flag(
    kunjunganId: string,
    itemId: string,
    flagged: boolean,
    _actor: Actor,
  ): Promise<CpptEntryDTO> {
    await assertKunjungan(kunjunganId);
    await assertMilikKunjungan(kunjunganId, itemId);
    await dal.update(itemId, { flagged });
    return reload(itemId);
  }

  // Hapus = HANYA pembuat catatan (authorUserId) atau Admin (superuser) — medico-legal:
  // petugas lain tak boleh menghapus catatan orang lain walau punya izin clinical.cppt:delete.
  async function remove(kunjunganId: string, itemId: string, actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    const existing = await assertMilikKunjungan(kunjunganId, itemId);
    if (!actor.isSuperuser && existing.authorUserId !== actor.userId) {
      throw Errors.forbidden("Hanya pembuat catatan yang dapat menghapus catatan ini");
    }
    await dal.softDelete(itemId);
  }

  return { get, add, update, verify, flag, remove };
}

export const cpptService = makeCpptService();
