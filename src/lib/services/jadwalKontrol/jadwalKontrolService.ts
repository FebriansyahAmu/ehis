// jadwalKontrolService — Jadwal Kontrol Poliklinik pasca-pulang (tab Pasien Pulang RI).
// create: nomor auto sistem (counter JK-<YYMM><NNN>, tx) + pasien BPJS → panggil V-Claim
// RencanaKontrol/insert (konektor; mock always-success, audited) SEBELUM tx (R4 — panggilan
// eksternal di luar DB tx) → noReferensi = noSuratKontrol. kodeDokter di-resolve SERVER dari
// bpjs.DpjpMapping via dokterId (anti-spoof; client tak pernah kirim kode). remove: soft-delete
// + RencanaKontrol/Delete ke BPJS bila ber-referensi (closed-loop). pencatat/user = actor login.
// RBAC clinical.rekammedis di Route; ABAC careUnit di route() choke-point.

import * as defaultDal from "@/lib/dal/jadwalKontrol/jadwalKontrolDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import * as bpjsDal from "@/lib/dal/bpjsDal";
import { transaction } from "@/lib/db/prisma";
import { resolveActorNama } from "@/lib/services/actorName";
import { resolveKodeDpjpBpjs } from "@/lib/services/bpjs/referensiDpjp";
import { insertRencanaKontrol, deleteSPRI } from "@/lib/services/bpjs/rencanaKontrol";
import { InsertRencanaKontrolRequestSchema } from "@/lib/schemas/bpjs/rencanaKontrol";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import type { JadwalKontrolEntity } from "@/lib/dal/jadwalKontrol/jadwalKontrolDal";
import {
  type JadwalKontrolInput, type JadwalKontrolDTO, type SepTerbitDTO,
} from "@/lib/schemas/jadwalKontrol/jadwalKontrol";

type Dal = typeof defaultDal;

function toDTO(e: JadwalKontrolEntity): JadwalKontrolDTO {
  return {
    id: e.id,
    nomor: e.nomor,
    tanggal: e.tanggal,
    poliNama: e.poliNama,
    poliKontrol: e.poliKontrol,
    dokterNama: e.dokterNama,
    kodeDokter: e.kodeDokter,
    catatan: e.catatan,
    noSep: e.noSep,
    noReferensi: e.noReferensi ?? null,
    pencatat: e.pencatat,
    createdAt: e.createdAt.toISOString(),
  };
}

/** Normalisasi BPJSError → pesan toast "BPJS <code>: <message>" (pola SEP/SPRI reject). */
function bpjsErrMsg(e: BPJSError): string {
  const code = "code" in e && typeof e.code === "string" ? e.code : "500";
  const message = "message" in e && typeof e.message === "string" ? e.message : "Permintaan BPJS gagal";
  return `BPJS ${code}: ${message}`;
}

export function makeJadwalKontrolService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<JadwalKontrolEntity> {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Jadwal kontrol tidak ditemukan");
    }
    return item;
  }

  /** GET — jadwal kontrol aktif per kunjungan (terbaru dulu). */
  async function list(kunjunganId: string, _actor: Actor): Promise<JadwalKontrolDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  /** GET — SEP TERBIT milik pasien kunjungan ini (lintas kunjungan, terbaru dulu) utk picker No. SEP. */
  async function listSepTerbit(kunjunganId: string, _actor: Actor): Promise<SepTerbitDTO[]> {
    const k = await assertKunjungan(kunjunganId);
    const rows = await bpjsDal.listSepTerbitByPatient(k.patientId);
    return rows.map((s) => ({
      noSep: s.noSep ?? "", // where-filter menjamin non-null
      tglSep: s.tglSep.toISOString().slice(0, 10),
      jenis: s.jnsPelayanan === "RawatInap" ? "Rawat Inap" : "Rawat Jalan",
      poliTujuan: s.poliTujuan ?? "",
      kunjunganIni: s.kunjunganId === kunjunganId,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  /** POST — terbitkan jadwal kontrol (nomor auto; BPJS → insert RencanaKontrol → noReferensi). */
  async function create(
    kunjunganId: string, input: JadwalKontrolInput, actor: Actor,
  ): Promise<JadwalKontrolDTO> {
    await assertKunjungan(kunjunganId);
    const pencatat = await resolveActorNama(actor);

    // ── BPJS flow: validasi + resolve kode + panggil WS (SEBELUM tx — R4) ──
    let kodeDokter = "";
    let noReferensi: string | null = null;
    if (input.bpjs) {
      if (!input.noSep.trim()) throw Errors.validation("No. SEP wajib untuk jadwal kontrol BPJS");
      if (!input.poliKontrol.trim()) throw Errors.validation("Kode poli BPJS wajib untuk jadwal kontrol BPJS");
      kodeDokter = await resolveKodeDpjpBpjs(input.dokterId);
      if (!kodeDokter) {
        throw Errors.validation(
          "Dokter belum memiliki kode DPJP BPJS — lengkapi di Mapping Hub → DPJP BPJS",
        );
      }
      // Kontrak wire ditegakkan SEBELUM connector (mock selalu sukses, tapi payload harus
      // sudah valid → swap sandbox/prod zero-refactor).
      const payload = InsertRencanaKontrolRequestSchema.parse({
        noSEP: input.noSep.trim(),
        kodeDokter,
        poliKontrol: input.poliKontrol.trim(),
        tglRencanaKontrol: input.tanggal,
        user: pencatat,
      });
      const res = await insertRencanaKontrol(
        payload,
        { actor: actor.userId, actorRole: actor.roles[0] ?? "clinical" },
      );
      if (!res.ok) throw Errors.validation(bpjsErrMsg(res.error));
      noReferensi = res.value.response?.noSuratKontrol ?? null;
    }

    // ── Persist: nomor auto (counter per-bulan) + baris jadwal, atomik ──
    const row = await transaction(async (tx) => {
      const now = new Date();
      const yymm = `${String(now.getFullYear() % 100).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const seq = await dal.nextSeq(`JK-${yymm}`, tx);
      return dal.create({
        kunjunganId,
        nomor: `JK-${yymm}${String(seq).padStart(3, "0")}`,
        tanggal: input.tanggal,
        poliNama: input.poliNama,
        poliKontrol: input.poliKontrol,
        dokterNama: input.dokterNama,
        dokterId: input.dokterId ?? null,
        kodeDokter,
        catatan: input.catatan,
        noSep: input.noSep,
        noReferensi,
        pencatat,
        authorUserId: actor.userId,
        authorPegawaiId: actor.pegawaiId,
      }, tx);
    });
    return toDTO(row);
  }

  /** DELETE — batalkan jadwal (soft-delete; ber-referensi → RencanaKontrol/Delete ke BPJS dulu). */
  async function remove(kunjunganId: string, itemId: string, actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    const item = await assertMilik(kunjunganId, itemId);
    if (item.noReferensi) {
      const user = await resolveActorNama(actor);
      const res = await deleteSPRI(
        { noSuratKontrol: item.noReferensi, user },
        { actor: actor.userId, actorRole: actor.roles[0] ?? "clinical" },
      );
      if (!res.ok) throw Errors.validation(bpjsErrMsg(res.error));
    }
    await dal.softDelete(itemId);
  }

  return { list, listSepTerbit, create, remove };
}

export const jadwalKontrolService = makeJadwalKontrolService();
