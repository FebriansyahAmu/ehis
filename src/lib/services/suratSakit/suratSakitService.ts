// suratSakitService — Surat Keterangan Sakit (tab Surat & Dokumen; PMK 269/2008).
// create: nomor auto sistem (counter SKS-<YYMM><NNN>, tx) + tglSelesai di-hitung SERVER dari
// tglMulai + lamaHari (anti-drift, client tak dipercaya). remove: soft-delete (batal = koreksi
// administratif). pencatat = actor login (server-otoritatif). RBAC clinical.rekammedis di Route;
// ABAC careUnit di route() choke-point. Unit-agnostic — reusable IGD/RI/RJ.

import { randomUUID } from "crypto";
import * as defaultDal from "@/lib/dal/suratSakit/suratSakitDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { transaction } from "@/lib/db/prisma";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { SuratSakitEntity } from "@/lib/dal/suratSakit/suratSakitDal";
import { type SuratSakitInput, type SuratSakitDTO } from "@/lib/schemas/suratSakit/suratSakit";

type Dal = typeof defaultDal;

function toDTO(e: SuratSakitEntity): SuratSakitDTO {
  return {
    id: e.id,
    nomor: e.nomor,
    tglPeriksa: e.tglPeriksa,
    tglMulai: e.tglMulai,
    tglSelesai: e.tglSelesai,
    lamaHari: e.lamaHari,
    keperluan: e.keperluan,
    diagnosa: e.diagnosa,
    cantumkanDiagnosa: e.cantumkanDiagnosa,
    pekerjaan: e.pekerjaan,
    instansi: e.instansi,
    catatan: e.catatan,
    dokterId: e.dokterId ?? null,
    dokterNama: e.dokterNama,
    pencatat: e.pencatat,
    tteToken: e.tteToken ?? null,
    tteSignedBy: e.tteSignedBy ?? null,
    tteSignedAt: e.tteSignedAt ? e.tteSignedAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  };
}

/** tglMulai ("YYYY-MM-DD") + (lama-1) hari → "YYYY-MM-DD" (timezone-safe, UTC arithmetic). */
function addRestDays(tglMulai: string, lamaHari: number): string {
  const [y, m, d] = tglMulai.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  const end = new Date(base + (lamaHari - 1) * 86400000);
  return `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`;
}

/** Serial TTE surat sakit (di-encode jadi QR di cetakan). Format: TTE-SKS-<YYMMDD>-<8 heks>. */
function makeTteToken(now: Date): string {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `TTE-SKS-${ymd}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/** TTE surat = tanda tangan DOKTER PEMERIKSA — hanya Dokter (atau superuser/global) yang menandatangani. */
function actorIsDokter(actor: Actor): boolean {
  return actor.isSuperuser || actor.isGlobal || actor.roles.includes("Dokter");
}

export function makeSuratSakitService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<SuratSakitEntity> {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Surat keterangan sakit tidak ditemukan");
    }
    return item;
  }

  /** GET — surat keterangan sakit aktif per kunjungan (terbaru dulu). */
  async function list(kunjunganId: string, _actor: Actor): Promise<SuratSakitDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  /** POST — terbitkan surat (nomor auto; tglSelesai di-hitung server). */
  async function create(
    kunjunganId: string, input: SuratSakitInput, actor: Actor,
  ): Promise<SuratSakitDTO> {
    await assertKunjungan(kunjunganId);
    const pencatat = await resolveActorNama(actor);
    const tglSelesai = addRestDays(input.tglMulai, input.lamaHari);

    // TTE auto-stamp saat terbit — HANYA bila actor Dokter (signer server-otoritatif, anti-spoof).
    // Non-Dokter (mis. Perawat) → surat terbit tanpa TTE (cetak pakai TTD manual).
    const now = new Date();
    const isDokter = actorIsDokter(actor);
    const tteToken = isDokter ? makeTteToken(now) : null;
    const tteSignedBy = isDokter ? pencatat : null;
    const tteSignedAt = isDokter ? now : null;

    const row = await transaction(async (tx) => {
      const yymm = `${String(now.getFullYear() % 100).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const seq = await dal.nextSeq(`SKS-${yymm}`, tx);
      return dal.create({
        kunjunganId,
        nomor: `SKS-${yymm}${String(seq).padStart(3, "0")}`,
        tglPeriksa: input.tglPeriksa,
        tglMulai: input.tglMulai,
        tglSelesai,
        lamaHari: input.lamaHari,
        keperluan: input.keperluan,
        diagnosa: input.diagnosa,
        cantumkanDiagnosa: input.cantumkanDiagnosa,
        pekerjaan: input.pekerjaan,
        instansi: input.instansi,
        catatan: input.catatan,
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

export const suratSakitService = makeSuratSakitService();
