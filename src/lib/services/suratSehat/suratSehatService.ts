// suratSehatService — Surat Keterangan Sehat / Berbadan Sehat (tab Surat & Dokumen; PMK 269/2008).
// create: nomor auto sistem (counter SKH-<YYMM><NNN>, tx) + TTE Dokter Pemeriksa auto-stamp saat
// terbit bila actor Dokter (signer server-otoritatif, anti-spoof; non-Dokter → tanpa TTE). remove:
// soft-delete (batal = koreksi administratif). pencatat = actor login. RBAC clinical.rekammedis di
// Route; ABAC careUnit di route() choke-point. Unit-agnostic — reusable IGD/RI/RJ. Selaras suratSakit.

import { randomUUID } from "crypto";
import * as defaultDal from "@/lib/dal/suratSehat/suratSehatDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { transaction } from "@/lib/db/prisma";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { SuratSehatEntity } from "@/lib/dal/suratSehat/suratSehatDal";
import { type SuratSehatInput, type SuratSehatDTO } from "@/lib/schemas/suratSehat/suratSehat";

type Dal = typeof defaultDal;

function toDTO(e: SuratSehatEntity): SuratSehatDTO {
  return {
    id: e.id,
    nomor: e.nomor,
    tglPeriksa: e.tglPeriksa,
    tinggiBadan: e.tinggiBadan ?? null,
    beratBadan: e.beratBadan ?? null,
    tekananDarah: e.tekananDarah,
    nadi: e.nadi ?? null,
    golonganDarah: e.golonganDarah,
    penglihatan: e.penglihatan,
    butaWarna: e.butaWarna,
    pendengaran: e.pendengaran,
    riwayatPenyakit: e.riwayatPenyakit,
    kesimpulan: e.kesimpulan,
    keperluan: e.keperluan,
    instansi: e.instansi,
    berlakuHingga: e.berlakuHingga,
    catatan: e.catatan,
    pekerjaan: e.pekerjaan,
    dokterId: e.dokterId ?? null,
    dokterNama: e.dokterNama,
    pencatat: e.pencatat,
    tteToken: e.tteToken ?? null,
    tteSignedBy: e.tteSignedBy ?? null,
    tteSignedAt: e.tteSignedAt ? e.tteSignedAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  };
}

/** Serial TTE surat sehat (di-encode jadi QR di cetakan). Format: TTE-SKH-<YYMMDD>-<8 heks>. */
function makeTteToken(now: Date): string {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `TTE-SKH-${ymd}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/** TTE surat = tanda tangan DOKTER PEMERIKSA — hanya Dokter (atau superuser/global) yang menandatangani. */
function actorIsDokter(actor: Actor): boolean {
  return actor.isSuperuser || actor.isGlobal || actor.roles.includes("Dokter");
}

export function makeSuratSehatService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<SuratSehatEntity> {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Surat keterangan sehat tidak ditemukan");
    }
    return item;
  }

  /** GET — surat keterangan sehat aktif per kunjungan (terbaru dulu). */
  async function list(kunjunganId: string, _actor: Actor): Promise<SuratSehatDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  /** POST — terbitkan surat (nomor auto; TTE auto-stamp bila actor Dokter). */
  async function create(
    kunjunganId: string, input: SuratSehatInput, actor: Actor,
  ): Promise<SuratSehatDTO> {
    await assertKunjungan(kunjunganId);
    const pencatat = await resolveActorNama(actor);

    // TTE auto-stamp saat terbit — HANYA bila actor Dokter (signer server-otoritatif, anti-spoof).
    const now = new Date();
    const isDokter = actorIsDokter(actor);
    const tteToken = isDokter ? makeTteToken(now) : null;
    const tteSignedBy = isDokter ? pencatat : null;
    const tteSignedAt = isDokter ? now : null;

    const row = await transaction(async (tx) => {
      const yymm = `${String(now.getFullYear() % 100).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const seq = await dal.nextSeq(`SKH-${yymm}`, tx);
      return dal.create({
        kunjunganId,
        nomor: `SKH-${yymm}${String(seq).padStart(3, "0")}`,
        tglPeriksa: input.tglPeriksa,
        tinggiBadan: input.tinggiBadan,
        beratBadan: input.beratBadan,
        tekananDarah: input.tekananDarah,
        nadi: input.nadi,
        golonganDarah: input.golonganDarah,
        penglihatan: input.penglihatan,
        butaWarna: input.butaWarna,
        pendengaran: input.pendengaran,
        riwayatPenyakit: input.riwayatPenyakit,
        kesimpulan: input.kesimpulan,
        keperluan: input.keperluan,
        instansi: input.instansi,
        berlakuHingga: input.berlakuHingga,
        catatan: input.catatan,
        pekerjaan: input.pekerjaan,
        dokterNama: input.dokterNama,
        dokterId: input.dokterId ?? null,
        pencatat,
        authorUserId: actor.userId,
        authorPegawaiId: actor.pegawaiId,
        tteToken,
        tteSignedBy,
        tteSignedAt,
      }, tx);
    });
    return toDTO(row);
  }

  /** DELETE — batalkan surat (soft-delete; baris dipertahankan + stamp deleted_at). */
  async function remove(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    await dal.softDelete(itemId);
  }

  return { list, create, remove };
}

export const suratSehatService = makeSuratSehatService();
