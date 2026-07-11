// spriService — SPRI (Surat Perintah Rawat Inap) sebagai artefak admisi BPJS dgn lifecycle sendiri.
// PENERBITAN awal terjadi atomik di kunjunganService.transition("complete") (jenis Rawat_Inap).
// Di sini: worklist admisi (registrasi) + REVISI No. Referensi (retry BPJS, boleh setelah kunjungan
// IGD terkunci — SPRI bukan clinical.*) + KONSUMSI (tautkan kunjungan Rawat Inap hasil admisi).
//
// RBAC di Route: registration.kunjungan (petugas loket/admisi). Tanpa permission baru.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/spri/spriDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import * as patientDal from "@/lib/dal/patientDal";
import * as diagnosaDal from "@/lib/dal/diagnosa/diagnosaDal";
import { issueSpriRef, updateSpriRef, cancelSpriRef } from "@/lib/services/spri/spriBpjsMock";
import { resolveActorNama } from "@/lib/services/actorName";
import { decryptPii } from "@/lib/crypto/pii";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { SpriEntity } from "@/lib/dal/spri/spriDal";
import type { SpriDTO, SpriQuery, SpriStatus, ConsumeSpriInput, EditSpriInput, CreateSpriInput } from "@/lib/schemas/disposisi/disposisi";

type Dal = typeof defaultDal;

/** Diagnosa utama IGD asal (sumber diagAwal SEP RI). */
interface DiagAwal { kode: string; nama: string }

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDTO(e: SpriEntity, diag?: DiagAwal): SpriDTO {
  return {
    id: e.id,
    kunjunganId: e.kunjunganId,
    noKunjungan: e.kunjungan.noKunjungan,
    noRM: e.kunjungan.pasien.noRm,
    namaPasien: e.kunjungan.pasien.nama,
    noKartu: e.noKartu,
    dpjpNama: e.dpjpNama,
    dpjpPegawaiId: e.dpjpPegawaiId ?? null,
    smfSpesialistik: e.smfSpesialistik ?? null,
    poliKode: e.poliKode ?? null,
    poliNama: e.poliNama ?? null,
    tglRencanaRawat: fmtDate(e.tglRencanaRawat),
    jenisPerawatan: e.jenisPerawatan,
    indikasi: e.indikasi,
    keterangan: e.keterangan ?? null,
    diagAwalKode: diag?.kode ?? null,
    diagAwalNama: diag?.nama ?? null,
    noReferensi: e.noReferensi ?? null,
    status: e.status as SpriStatus,
    riKunjunganId: e.riKunjunganId ?? null,
    user: e.user,
    createdAt: e.createdAt.toISOString(),
    version: e.version,
  };
}

/** Map kunjungan IGD → diagnosa utama (batched, first-per-kunjungan = terbaru). */
async function resolveDiagAwal(kunjunganIds: string[]): Promise<Map<string, DiagAwal>> {
  const rows = await diagnosaDal.listUtamaByKunjunganIds([...new Set(kunjunganIds)]);
  const map = new Map<string, DiagAwal>();
  for (const d of rows) {
    if (!map.has(d.kunjunganId)) map.set(d.kunjunganId, { kode: d.kodeIcd10, nama: d.namaDiagnosis });
  }
  return map;
}

export function makeSpriService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Buat SPRI mandiri dari worklist Admisi Registrasi (rawat inap terencana, bukan dari IGD).
   *  Ditautkan ke kunjungan sumber pasien. No. Kartu di-resolusi SERVER dari penjamin BPJS
   *  pasien (anti-spoof). Penerbitan No. Referensi = mock BPJS (di luar tx — insert tunggal). */
  async function create(input: CreateSpriInput, actor: Actor): Promise<SpriDTO> {
    const k = await kunjunganDal.findById(input.kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan sumber tidak ditemukan");

    // No. Kartu PENUH dari penjamin BPJS pasien (server-authoritative; FE tak dipercaya).
    let noKartu = input.noKartu ?? "";
    const pt = await patientDal.findById(k.patientId);
    const enc = pt?.penjamin.find(
      (p) => (p.tipe === "BPJS_Non_PBI" || p.tipe === "BPJS_PBI") && p.nomorEnc,
    )?.nomorEnc;
    if (enc) noKartu = decryptPii(enc);

    const user = await resolveActorNama(actor);
    const noReferensi = await issueSpriRef({
      noKartu,
      dpjpPegawaiId: input.dpjpPegawaiId ?? null,
      poliKontrol: input.poliKode ?? undefined,
      tglRencanaKontrol: input.tglRencanaRawat,
      user,
      actor: actor.userId,
      actorRole: actor.roles[0] ?? "registration",
    });

    const created = await dal.create({
      kunjunganId: input.kunjunganId,
      noKartu,
      dpjpNama: input.dpjpNama,
      dpjpPegawaiId: input.dpjpPegawaiId ?? null,
      smfSpesialistik: input.smfSpesialistik ?? null,
      poliKode: input.poliKode ?? null,
      poliNama: input.poliNama ?? null,
      tglRencanaRawat: new Date(input.tglRencanaRawat),
      jenisPerawatan: input.jenisPerawatan,
      indikasi: input.indikasi.trim(),
      keterangan: input.keterangan?.trim() || null,
      noReferensi,
      status: noReferensi ? "Terbit" : "MenungguRef",
      user,
      createdByUserId: actor.userId,
    });

    const fresh = await dal.findByIdWithKunjungan(created.id);
    const diagMap = await resolveDiagAwal([input.kunjunganId]);
    return toDTO(fresh!, diagMap.get(input.kunjunganId));
  }

  /** Worklist admisi. Default = belum dikonsumsi (MenungguRef + Terbit). */
  async function listWorklist(query: SpriQuery, _actor: Actor): Promise<SpriDTO[]> {
    const rows = await dal.listWorklist({ status: query.status });
    const diagMap = await resolveDiagAwal(rows.map((r) => r.kunjunganId));
    return rows.map((r) => toDTO(r, diagMap.get(r.kunjunganId)));
  }

  /** Riwayat SPRI pasien — dari kunjungan konteks (resolve patientId → semua SPRI pasien, semua
   *  status, terbaru dulu). Konsumsi KLINIS (tab Disposisi RJ panel kanan). */
  async function listRiwayatByKunjungan(kunjunganId: string, _actor: Actor): Promise<SpriDTO[]> {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    const rows = await dal.listByPatientId(k.patientId);
    const diagMap = await resolveDiagAwal(rows.map((r) => r.kunjunganId));
    return rows.map((r) => toDTO(r, diagMap.get(r.kunjunganId)));
  }

  /** Revisi & kirim ulang → retry penerbitan No. Referensi ke BPJS. Hanya saat MenungguRef.
   *  Tidak kena lock kunjungan (resource administratif sendiri). */
  async function revise(id: string, actor: Actor): Promise<SpriDTO> {
    const row = await dal.findById(id);
    if (!row) throw Errors.notFound("SPRI tidak ditemukan");
    if (row.status !== "MenungguRef") {
      throw Errors.conflict("SPRI sudah terbit referensi / dikonsumsi — revisi tidak berlaku");
    }
    const noReferensi = await issueSpriRef({
      noKartu: row.noKartu,
      dpjpPegawaiId: row.dpjpPegawaiId ?? null,
      poliKontrol: row.poliKode ?? undefined,
      tglRencanaKontrol: fmtDate(row.tglRencanaRawat),
      user: row.user,
      actor: actor.userId,
      actorRole: actor.roles[0] ?? "registration",
    });
    if (!noReferensi) {
      // BPJS masih bermasalah → tetap MenungguRef (idempoten), kembalikan apa adanya.
      const fresh = await dal.findByIdWithKunjungan(id);
      return toDTO(fresh!);
    }
    const n = await dal.updateRevisi(id, row.version, { noReferensi, status: "Terbit" });
    if (n === 0) throw Errors.conflict("Status SPRI berubah — muat ulang");
    const fresh = await dal.findByIdWithKunjungan(id);
    return toDTO(fresh!);
  }

  /** Konsumsi → tautkan kunjungan Rawat Inap hasil admisi + status Dikonsumsi (keluar worklist). */
  async function consume(id: string, input: ConsumeSpriInput, _actor: Actor): Promise<SpriDTO> {
    const row = await dal.findById(id);
    if (!row) throw Errors.notFound("SPRI tidak ditemukan");
    if (row.status === "Dikonsumsi") throw Errors.conflict("SPRI sudah dikonsumsi (admisi sudah dibuat)");
    const ri = await kunjunganDal.findById(input.riKunjunganId);
    if (!ri) throw Errors.notFound("Kunjungan Rawat Inap tidak ditemukan");
    // Atomik: konsumsi SPRI ini + TUTUP SPRI saudara pasien (Tergantikan) → anti-admisi ganda.
    await transaction(async (tx) => {
      const n = await dal.consume(id, input.riKunjunganId, tx);
      if (n === 0) throw Errors.conflict("Status SPRI berubah — muat ulang");
      await dal.supersedeSiblings(id, ri.patientId, tx);
    });
    const fresh = await dal.findByIdWithKunjungan(id);
    return toDTO(fresh!);
  }

  /** Revisi SPRI → UpdateSPRI ke BPJS (bila sudah ada No. Referensi) lalu perbarui field lokal.
   *  WS gagal → tolak (jangan ubah lokal). Hanya SPRI aktif (MenungguRef/Terbit). */
  async function editSpri(id: string, input: EditSpriInput, actor: Actor): Promise<SpriDTO> {
    const row = await dal.findById(id);
    if (!row) throw Errors.notFound("SPRI tidak ditemukan");
    if (row.status === "Dikonsumsi") throw Errors.conflict("SPRI sudah dikonsumsi (admisi dibuat) — tak bisa diubah");
    if (row.status !== "MenungguRef" && row.status !== "Terbit") throw Errors.conflict("SPRI sudah tidak aktif");

    // BPJS: SPRI yang sudah punya No. Referensi → sinkronkan ke BPJS (UpdateSPRI) lebih dulu.
    if (row.noReferensi) {
      const ws = await updateSpriRef({
        noReferensi: row.noReferensi,
        dpjpPegawaiId: input.dpjpPegawaiId ?? null,
        poliKontrol: input.poliKode ?? undefined,
        tglRencanaKontrol: input.tglRencanaRawat,
        user: row.user,
        actor: actor.userId,
        actorRole: actor.roles[0] ?? "registration",
      });
      if (!ws.ok) throw Errors.validation(ws.error.message, { spriReject: ws.error });
    }

    const n = await dal.updateFields(id, input.version, {
      dpjpNama: input.dpjpNama,
      dpjpPegawaiId: input.dpjpPegawaiId ?? null,
      smfSpesialistik: input.smfSpesialistik ?? null,
      poliKode: input.poliKode ?? null,
      poliNama: input.poliNama ?? null,
      tglRencanaRawat: new Date(input.tglRencanaRawat),
      jenisPerawatan: input.jenisPerawatan,
      indikasi: input.indikasi,
      keterangan: input.keterangan ?? null,
    });
    if (n === 0) throw Errors.conflict("SPRI berubah / tidak aktif — muat ulang");
    const fresh = await dal.findByIdWithKunjungan(id);
    return toDTO(fresh!);
  }

  /** Batalkan SPRI → DeleteSPRI ke BPJS (bila ada No. Referensi) lalu status Batal.
   *  Tak berlaku utk SPRI yang sudah dikonsumsi (admisi sudah dibuat → batalkan via batal order RI). */
  async function cancelSpri(id: string, actor: Actor): Promise<SpriDTO> {
    const row = await dal.findById(id);
    if (!row) throw Errors.notFound("SPRI tidak ditemukan");
    if (row.status === "Dikonsumsi") throw Errors.conflict("SPRI sudah dikonsumsi (admisi dibuat) — batalkan lewat Batalkan Order Rawat Inap");
    if (row.status !== "MenungguRef" && row.status !== "Terbit") throw Errors.conflict("SPRI sudah tidak aktif");

    if (row.noReferensi) {
      const ws = await cancelSpriRef({
        noReferensi: row.noReferensi,
        user: row.user,
        actor: actor.userId,
        actorRole: actor.roles[0] ?? "registration",
      });
      if (!ws.ok) throw Errors.validation(ws.error.message, { spriReject: ws.error });
    }
    const n = await dal.cancel(id);
    if (n === 0) throw Errors.conflict("SPRI sudah tidak aktif — muat ulang");
    const fresh = await dal.findByIdWithKunjungan(id);
    return toDTO(fresh!);
  }

  return { create, listWorklist, listRiwayatByKunjungan, revise, consume, editSpri, cancelSpri };
}

export const spriService = makeSpriService();
