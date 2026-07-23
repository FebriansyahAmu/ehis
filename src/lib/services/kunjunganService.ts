// kunjunganService — domain Kunjungan (spine) + use-case "Pendaftaran Kunjungan Baru"
// (BACKEND-ENCOUNTER §4.2). Tak import prisma langsung (pakai `transaction` + DAL).
//
// CATATAN ORKESTRASI (§4.2b): `registerKunjungan` saat ini ber-peran sbg use-case admisi
// RJ — ia memuat pasien (patientDal), buat Kunjungan, lalu terbitkan SEP (bpjsService)
// dalam 1 transaksi. Saat domain Patient-completion/Billing/Antrean lengkap, orkestrasi
// penuh dipindah ke `registrationService` khusus; operasi domain di sini tetap.
//
// UNIT DIDUKUNG: Rawat Jalan + IGD (Rawat Inap ditolak di Zod). IGD = kegawatdaruratan:
// triase wajib, rujukan opsional, boleh atas pasien draft (dataLengkap=false). Efek
// lintas-domain yang belum ada (Invoice draft saat Queued, Antrean T3/T4/T5) DITUNDA —
// kunjungan dibuat pada status `Registered` (lihat TODO di bawah).

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/kunjunganDal";
import * as patientDal from "@/lib/dal/patientDal";
import * as bpjsDal from "@/lib/dal/bpjsDal";
import * as diagnosaDal from "@/lib/dal/diagnosa/diagnosaDal";
import * as disposisiDal from "@/lib/dal/disposisi/disposisiDal";
import * as spriDal from "@/lib/dal/spri/spriDal";
import { issueSpriRef } from "@/lib/services/spri/spriBpjsMock";
import { resolveKodeDpjpBpjs, resolveKodeDpjpBpjsByPegawai } from "@/lib/services/bpjs/referensiDpjp";
import { makeBpjsService, toSepDTO, toRujukanDTO } from "@/lib/services/bpjsService";
import { makeBedAllocationService } from "@/lib/services/bedAllocationService";
import { resolveActorNama } from "@/lib/services/actorName";
import { systemClock, type Clock } from "@/lib/core/clock";
import { decryptPii, encryptPii, hashPii } from "@/lib/crypto/pii";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import { unitScopeBypassed, type CareUnit } from "@/lib/auth/careUnit";
import { assertUnitInScope } from "@/lib/services/clinicalScope";
import type { RegisterKunjunganInput, ChangePenjaminInput, WorklistQuery, KunjunganDTO, KunjunganListItemDTO, KunjunganActionName } from "@/lib/schemas/kunjungan";
import type { DisposisiInput } from "@/lib/schemas/disposisi/disposisi";
import type { KunjunganEntity, KunjunganListEntity, UpdateStatusPatch } from "@/lib/dal/kunjunganDal";

type Dal = typeof defaultDal;
type Bpjs = ReturnType<typeof makeBpjsService>;
type BedAlloc = ReturnType<typeof makeBedAllocationService>;
type NonNullEntity = NonNullable<KunjunganEntity>;

const KNOWN_STATUS = new Set([
  "Registered", "Queued", "InService", "Completed", "Closed", "Billed", "Claimed", "Cancelled",
]);
const ACTIVE_STATUS = ["Registered", "Queued", "InService"] as const;

// Label manusiawi untuk pesan guard kunjungan-ganda.
const UNIT_LABEL: Record<string, string> = { IGD: "IGD", RawatJalan: "Rawat Jalan", RawatInap: "Rawat Inap" };
const STATUS_LABEL: Record<string, string> = {
  Registered: "Terdaftar", Queued: "Antre", InService: "Dalam Pelayanan",
};

const isBpjs = (t: string): boolean => t === "BPJS_Non_PBI" || t === "BPJS_PBI";

/** Authz per-aksi transisi (action-dependent → tak bisa di route() statis, FLOWS §6).
 *  · `receive`/`complete`/`reopen` = aksi bedside KLINIS (Dokter/Perawat, marker clinical.rekammedis:update)
 *    ATAU loket (registration.kunjungan:update). "Selesaikan/Batal Selesai" = keputusan disposisi DPJP/perawat.
 *  · transisi administratif lain (checkIn/call/recall/cancel) = wewenang loket.
 *  Superuser bypass. ABAC unit-scope (IGD nurse hanya pasien IGD) ditegakkan terpisah di route
 *  via scopeKunjungan. */
function assertTransitionAllowed(actor: Actor, action: KunjunganActionName, status: string): void {
  if (actor.isSuperuser || actor.permissions.has("*")) return;
  const can = (r: string, a: string): boolean => actor.permissions.has(`${r}:${a}`);
  const clinicalOrLoket = can("clinical.rekammedis", "update") || can("registration.kunjungan", "update");
  if (action === "receive" || action === "complete" || action === "reopen") {
    if (clinicalOrLoket) return;
    throw Errors.forbidden("Tidak punya izin transisi klinis (perlu clinical.rekammedis:update atau registration.kunjungan:update)");
  }
  // Batalkan ORDER yang BELUM dilayani (status Registered — mis. "Tolak Order" di bangsal RI/IGD)
  // = keputusan unit penerima → boleh klinis. Pembatalan setelah pelayanan dimulai
  // (Queued/InService) tetap wewenang loket/admisi.
  if (action === "cancel" && status === "Registered") {
    if (clinicalOrLoket) return;
    throw Errors.forbidden("Tidak punya izin membatalkan order (perlu clinical.rekammedis:update atau registration.kunjungan:update)");
  }
  if (!can("registration.kunjungan", "update")) {
    throw Errors.forbidden("Tidak punya izin registration.kunjungan:update");
  }
}

/** "YYYY-MM-DDTHH:mm" (DateTimePicker) → Date UTC wall-clock (samakan combineDateTime). */
function parseWaktuSelesai(s?: string): Date | undefined {
  if (!s) return undefined;
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? `${s}:00.000Z` : s;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw Errors.validation("Waktu selesai tidak valid");
  return d;
}

/** Nama penjamin default bila pasien belum punya record penjamin tipe tsb. */
function defaultPenjaminNama(tipe: string): string {
  switch (tipe) {
    case "BPJS_Non_PBI": return "BPJS Kesehatan Non-PBI";
    case "BPJS_PBI": return "BPJS Kesehatan PBI";
    case "Asuransi": return "Asuransi";
    case "Jamkesda": return "Jamkesda";
    default: return "Umum / Mandiri";
  }
}

export function makeKunjunganService(deps: { clock?: Clock; dal?: Dal; bpjs?: Bpjs; bedAlloc?: BedAlloc } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;
  const bpjs = deps.bpjs ?? makeBpjsService({ clock });
  const bedAlloc = deps.bedAlloc ?? makeBedAllocationService({ clock });

  // ── Helpers ─────────────────────────────────────────────────────────────---
  function combineDateTime(tanggal: string, jam?: string): Date {
    // Gabung tanggal + jam modal → timestamptz. UTC eksplisit (deterministik; samakan
    // dgn pola patientService.toDate). Penyesuaian zona klinis = fase later.
    const d = new Date(`${tanggal}T${jam ?? "00:00"}:00.000Z`);
    if (Number.isNaN(d.getTime())) throw Errors.validation("Tanggal/jam kunjungan tidak valid");
    return d;
  }

  function formatNoKunjungan(unit: string, seq: number): string {
    const prefix = unit === "RawatJalan" ? "RJ" : unit === "RawatInap" ? "RI" : "IGD";
    return `${prefix}/${clock.now().getUTCFullYear()}/${String(seq).padStart(5, "0")}`;
  }

  function parseStatuses(raw?: string): NonNullEntity["status"][] | undefined {
    if (!raw) return undefined;
    const list = raw.split(",").map((s) => s.trim()).filter((s) => KNOWN_STATUS.has(s));
    return list.length ? (list as NonNullEntity["status"][]) : undefined;
  }

  // ── DTO mapping (entity Prisma TIDAK bocor) ───────────────────────────────--
  function toDTO(k: NonNullEntity): KunjunganDTO {
    return {
      id: k.id,
      noKunjungan: k.noKunjungan,
      noPendaftaran: k.noPendaftaran,
      unit: k.unit,
      status: k.status,
      waktuKunjungan: k.waktuKunjungan.toISOString(),
      poli: k.poli,
      dpjpId: k.dpjpId,
      ruanganId: k.ruanganId,
      kelas: k.kelas,
      kelasHak: k.kelasHak,
      titipan: k.titipan,
      titipanAlasan: k.titipanAlasan,
      triaseLevel: k.triaseLevel,
      caraMasuk: k.caraMasuk,
      caraDatang: k.caraDatang,
      asalMasuk: k.asalMasuk,
      callState: k.callState,
      recallCount: k.recallCount,
      keluhan: k.keluhan,
      diagnosaMasuk: k.diagnosaMasuk,
      kodeIcdMasuk: k.kodeIcdMasuk,
      penjaminTipe: k.penjaminTipe,
      penjaminId: k.penjaminId,
      pasien: { id: k.pasien.id, noRm: k.pasien.noRm, nama: k.pasien.nama },
      rujukan: k.rujukan ? toRujukanDTO(k.rujukan) : null,
      sep: k.sep ? toSepDTO(k.sep) : null,
      sepError: null, // di-set use-case bila SEP ditolak BPJS tapi kunjungan tetap didaftarkan
      lockedAt: k.lockedAt ? k.lockedAt.toISOString() : null,
      selesaiAt: k.selesaiAt ? k.selesaiAt.toISOString() : null,
      selesaiPertamaAt: k.selesaiPertamaAt ? k.selesaiPertamaAt.toISOString() : null,
      disposisi: k.disposisi,
      alasanReopen: k.alasanReopen,
      version: k.version,
      createdAt: k.createdAt.toISOString(),
    };
  }

  function toListDTO(k: KunjunganListEntity): KunjunganListItemDTO {
    return {
      id: k.id,
      noKunjungan: k.noKunjungan,
      unit: k.unit,
      status: k.status,
      waktuKunjungan: k.waktuKunjungan.toISOString(),
      poli: k.poli,
      dpjpId: k.dpjpId,
      ruanganId: k.ruanganId,
      kelas: k.kelas,
      kelasHak: k.kelasHak,
      titipan: k.titipan,
      triaseLevel: k.triaseLevel,
      callState: k.callState,
      recallCount: k.recallCount,
      penjaminTipe: k.penjaminTipe,
      penjaminId: k.penjaminId,
      keluhan: k.keluhan,
      diagnosaMasuk: k.diagnosaMasuk,
      kodeIcdMasuk: k.kodeIcdMasuk,
      pasien: {
        id: k.pasien.id,
        noRm: k.pasien.noRm,
        nama: k.pasien.nama,
        gender: k.pasien.gender,
        tanggalLahir: k.pasien.tanggalLahir ? k.pasien.tanggalLahir.toISOString().slice(0, 10) : null,
      },
      sep: k.sep ? { id: k.sep.id, noSep: k.sep.noSep, status: k.sep.status } : null,
      selesaiAt: k.selesaiAt ? k.selesaiAt.toISOString() : null,
      version: k.version,
      createdAt: k.createdAt.toISOString(),
    };
  }

  // ── Operasi ─────────────────────────────────────────────────────────────---
  /**
   * Pendaftaran Kunjungan Baru (RJ). Kontrak Patient↔Kunjungan (BACKEND-ENCOUNTER §10):
   * RJ wajib pasien `dataLengkap`. Pasien BPJS → buat Rujukan + terbitkan SEP (mock) di
   * transaksi yang sama; semua-atau-tidak (rollback bila salah satu gagal).
   */
  async function registerKunjungan(input: RegisterKunjunganInput, actor: Actor): Promise<KunjunganDTO> {
    const patient = await patientDal.findById(input.patientId);
    if (!patient) throw Errors.notFound("Pasien tidak ditemukan");
    // Kontrak Patient↔Kunjungan (BACKEND-ENCOUNTER §10): RJ/RI terjadwal wajib `dataLengkap`;
    // IGD (kegawatdaruratan / Mr.X) boleh atas pasien draft — dilengkapi kemudian saat admisi.
    if (input.unit !== "IGD" && !patient.dataLengkap) {
      throw Errors.validation("Pasien belum lengkap datanya — lengkapi sebelum pendaftaran Rawat Jalan");
    }

    const bpjsFlow = isBpjs(input.penjaminTipe);

    // Penjamin yang TIPE-nya cocok (atau by id). Bila tak ada record cocok — mis. pasien
    // Umum didaftarkan BPJS via verifikasi loket — penjaminId null; identitas BPJS tetap
    // terbawa via snapshot `penjaminTipe` + No. Kartu hasil verifikasi.
    const penjamin = input.penjaminId
      ? patient.penjamin.find((p) => p.id === input.penjaminId)
      : patient.penjamin.find((p) => p.tipe === input.penjaminTipe)
        ?? (bpjsFlow ? undefined : patient.penjamin.find((p) => p.isPrimer) ?? patient.penjamin[0]);
    if (input.penjaminId && !penjamin) throw Errors.validation("Penjamin tidak ditemukan pada pasien");

    // No. Kartu SEP: utamakan hasil verifikasi kepesertaan di loket (input.sep.noKartu),
    // fallback ke nomor tersimpan di penjamin pasien (enc).
    let noKartu: string | undefined;
    if (bpjsFlow) {
      noKartu = input.sep?.noKartu?.trim() || input.noKartu?.trim() || (penjamin?.nomorEnc ? decryptPii(penjamin.nomorEnc) : undefined);
      if (!noKartu) throw Errors.validation("No. Kartu BPJS belum ada — verifikasi kepesertaan dulu");
    }

    const waktu = combineDateTime(input.tanggal, input.jam);

    // SEP turunan: No. Telepon dari data pasien (input override) — BPJS menolak SEP tanpa kontak.
    // Diagnosa awal efektif = yang dikirim form (RI = diagnosa utama IGD, ter-prefill dari SPRI).
    const noTelpEff = (input.sep?.noTelp?.trim() || patient.noHp?.trim() || "");
    const diagAwalEff = (input.sep?.diagAwal?.trim() || "");

    // skdp.kodeDPJP SEP = kode DPJP BPJS (referensi dokter, bukan id internal). Rantai authoritative:
    // No. Referensi SPRI → SPRI.dpjpPegawaiId → mapping Dokter↔kodeDpjpBpjs (Mapping Hub DPJP BPJS).
    // Fallback: DPJP kunjungan (input.dpjpId via Dokter) → kode dari form (legacy). "" bila belum di-map.
    let skdpKodeDpjpEff = "";
    if (bpjsFlow && input.sep) {
      if (input.sep.skdpNoSurat?.trim()) {
        const spri = await spriDal.findByNoReferensi(input.sep.skdpNoSurat.trim());
        if (spri?.dpjpPegawaiId) skdpKodeDpjpEff = await resolveKodeDpjpBpjsByPegawai(spri.dpjpPegawaiId);
      }
      if (!skdpKodeDpjpEff && input.dpjpId) skdpKodeDpjpEff = await resolveKodeDpjpBpjs(input.dpjpId);
      if (!skdpKodeDpjpEff) skdpKodeDpjpEff = input.sep.skdpKodeDpjp?.trim() ?? "";
    }
    // Blok rujukan t_sep: RJ pakai RujukanInput; RI = rujukan INTERNAL RS (asal Faskes 2, tgl =
    // tgl SEP, PPK = faskes RS sendiri; No. rujukan internal belum di-generate → kosong).
    const sepRujukan = input.rujukan
      ? {
          asalRujukan: (input.rujukan.asalRujukan === "Faskes2" ? "2" : "1") as "1" | "2",
          tglRujukan: input.rujukan.tglRujukan,
          noRujukan: input.rujukan.noRujukan,
          ppkRujukan: input.rujukan.ppkRujukan,
        }
      : {
          asalRujukan: "2" as const,
          tglRujukan: input.tanggal,
          ppkRujukan: input.sep?.ppkPelayanan,
        };

    // SEP ditolak BPJS tapi forceSep → kunjungan tetap dibuat, SEP ditangguhkan (transient → DTO).
    let sepError: { code: string; message: string; field?: string } | null = null;

    const created = await transaction(async (tx) => {
      // Guard kunjungan ganda: pasien tak boleh punya >1 kunjungan berjalan. Kunjungan
      // aktif (Registered/Queued/InService) harus Diselesaikan/Dibatalkan dulu sebelum
      // daftar lagi. Dicek dalam tx (early) sebelum men-konsumsi nomor urut.
      const active = await dal.findActiveByPatient(patient.id, tx);
      if (active) {
        throw Errors.conflict(
          `Pasien masih memiliki kunjungan aktif (${active.noKunjungan} · ${UNIT_LABEL[active.unit] ?? active.unit} · ${STATUS_LABEL[active.status] ?? active.status}). Selesaikan atau batalkan kunjungan tersebut dulu sebelum mendaftarkan kunjungan baru.`,
        );
      }

      const seq = await dal.nextNoKunjunganSeq(tx);

      // Jaminan aktif ikut kunjungan terakhir: persist penjamin BPJS terverifikasi
      // (No. Kartu enc + kelas hak) ke pasien & jadikan primer; FK ke kunjungan.
      let penjaminId = penjamin?.id;
      if (bpjsFlow) {
        penjaminId = await patientDal.upsertPenjaminByTipe(
          patient.id,
          {
            tipe: input.penjaminTipe,
            nama: penjamin?.nama ?? defaultPenjaminNama(input.penjaminTipe),
            nomorEnc: encryptPii(noKartu!),
            nomorHash: hashPii(noKartu!),
            kelas: input.sep?.klsRawatHak ?? penjamin?.kelas ?? null,
          },
          { setPrimary: true },
          tx,
        );
      }

      const k = await dal.create(
        {
          patientId: patient.id,
          unit: input.unit,
          // TODO(BILLING/ANTREAN): saat check-in (Registered→Queued) buat Invoice draft + emit T3.
          status: "Registered",
          noKunjungan: formatNoKunjungan(input.unit, seq),
          waktuKunjungan: waktu,
          poli: input.unit === "RawatJalan" ? input.poli : undefined,
          triaseLevel: input.unit === "IGD" ? input.triaseLevel : undefined,
          kelas: input.unit === "RawatInap" ? input.kelas : undefined,
          // TITIPAN: simpan apa adanya dari FE (kelas hak = basis tagihan; tidak auto-sync kelas
          // kamar — keputusan mismatch via konfirmasi di modal admisi).
          kelasHak: input.unit === "RawatInap" ? input.kelasHak : undefined,
          titipan: input.unit === "RawatInap" ? (input.titipan ?? false) : undefined,
          titipanAlasan: input.unit === "RawatInap" ? input.titipanAlasan : undefined,
          bedId: input.unit === "RawatInap" ? input.bedId : undefined, // pointer; alokasi di bawah
          dpjpId: input.dpjpId,
          ruanganId: input.ruanganId,
          keluhan: input.keluhan,
          caraMasuk: input.caraMasuk,
          penjaminTipe: input.penjaminTipe,
          penjaminId,
          // Denormalisasi diagnosa masuk dari rujukan (tampilan cepat).
          diagnosaMasuk: input.rujukan?.diagnosaNama,
          kodeIcdMasuk: input.rujukan?.diagnosaKode,
        },
        tx,
      );

      let rujukanId: string | undefined;
      if (bpjsFlow && input.rujukan) {
        const r = await bpjs.createRujukan(k.id, input.rujukan, tx);
        rujukanId = r.id;
      }
      if (bpjsFlow && input.sep) {
        const res = await bpjs.issueSep(
          {
            kunjunganId: k.id,
            rujukanId,
            noKartu: noKartu!,
            klsRawatHak: penjamin?.kelas ?? undefined,
            tglSep: waktu,
            diagAwal: diagAwalEff,
            noTelp: noTelpEff,
            skdpKodeDpjp: skdpKodeDpjpEff,
            rujukan: sepRujukan,
            // user SEP = nama actor login (server-otoritatif, anti-spoof) — override nilai client.
            input: { ...input.sep, user: await resolveActorNama(actor) },
          },
          tx,
        );
        if (!res.ok) {
          // SEP DITOLAK BPJS. Default → batalkan pendaftaran (rollback tx) + lempar error
          // terstruktur (FE arahkan operator ke field & tawarkan "Tetap daftarkan" / "Revisi").
          if (!input.forceSep) {
            throw Errors.validation(res.error.message, { sepReject: res.error });
          }
          // forceSep → kunjungan TETAP dibuat, SEP DITANGGUHKAN (tak persist; terbitkan ulang nanti).
          sepError = res.error;
        }
      }
      // RI: reserve bed terpilih saat daftar (Reserved). Bed sudah dipakai → P2002 → CONFLICT.
      if (input.unit === "RawatInap" && input.bedId) {
        await bedAlloc.reserve(input.bedId, k.id, tx);
      }

      const fresh = await dal.findById(k.id, tx);
      if (!fresh) throw Errors.internal("Gagal memuat kunjungan setelah dibuat");
      return fresh;
    });

    return { ...toDTO(created), sepError };
  }

  /**
   * Ubah Penjamin pada kunjungan yang SUDAH ada (tab Ubah Penjamin registrasi). Ganti
   * `penjaminTipe` kunjungan + jaminan pasien; BPJS → (opsional) terbitkan SEP baru dengan
   * SUPERSEDE SEP aktif lama (satu SEP aktif per kunjungan). Field turunan (unit/tanggal/
   * dpjp/poli/kelasHak/diagAwal) DIRESOLUSI dari kunjungan — bukan dari FE (inti "auto per-unit").
   * Reuse penuh mesin issueSep pendaftaran (payload t_sep, PII, skdp, blok rujukan per-unit).
   */
  async function changePenjamin(kunjunganId: string, input: ChangePenjaminInput, actor: Actor): Promise<KunjunganDTO> {
    const k = await dal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    assertUnitInScope(actor, k);
    if (k.status === "Cancelled") throw Errors.validation("Kunjungan dibatalkan — penjamin tidak dapat diubah");

    const patient = await patientDal.findById(k.pasien.id);
    if (!patient) throw Errors.notFound("Pasien tidak ditemukan");

    const bpjsFlow = isBpjs(input.penjaminTipe);
    const willIssue = bpjsFlow && input.issueSep;

    // Penjamin pasien yang tipe-nya cocok (sumber No. Kartu tersimpan bila FE tak kirim).
    const penjamin = patient.penjamin.find((p) => p.tipe === input.penjaminTipe);

    // No. Kartu SEP: hasil verifikasi (FE) → nomor tersimpan (enc). Wajib bila menerbitkan SEP.
    let noKartu: string | undefined;
    if (bpjsFlow) {
      noKartu = input.sep?.noKartu?.trim() || input.noKartu?.trim() || (penjamin?.nomorEnc ? decryptPii(penjamin.nomorEnc) : undefined);
      if (willIssue && !noKartu) throw Errors.validation("No. Kartu BPJS belum ada — verifikasi kepesertaan dulu");
    }

    // Turunan SEP dari kunjungan yang ada (bukan dari FE).
    const noTelpEff = (input.sep?.noTelp?.trim() || patient.noHp?.trim() || "");
    let diagAwalEff = input.sep?.diagAwal?.trim() || input.rujukan?.diagnosaKode?.trim() || "";
    if (willIssue && !diagAwalEff && k.unit === "RawatInap") {
      // RI: diagnosa awal SEP = diagnosa utama kunjungan (ter-koding di rekam medis).
      const rows = await diagnosaDal.listUtamaByKunjunganIds([kunjunganId]);
      diagAwalEff = rows[0]?.kodeIcd10 ?? "";
    }

    // skdp.kodeDPJP: rantai No.Ref SPRI → pegawai → mapping; fallback dpjpId kunjungan → form.
    let skdpKodeDpjpEff = "";
    if (willIssue && input.sep) {
      if (input.sep.skdpNoSurat?.trim()) {
        const spri = await spriDal.findByNoReferensi(input.sep.skdpNoSurat.trim());
        if (spri?.dpjpPegawaiId) skdpKodeDpjpEff = await resolveKodeDpjpBpjsByPegawai(spri.dpjpPegawaiId);
      }
      if (!skdpKodeDpjpEff && k.dpjpId) skdpKodeDpjpEff = await resolveKodeDpjpBpjs(k.dpjpId);
      if (!skdpKodeDpjpEff) skdpKodeDpjpEff = input.sep.skdpKodeDpjp?.trim() ?? "";
    }

    // Blok rujukan t_sep: RJ pakai input.rujukan; IGD/RI = rujukan INTERNAL RS (asal Faskes 2).
    const sepRujukan = input.rujukan
      ? {
          asalRujukan: (input.rujukan.asalRujukan === "Faskes2" ? "2" : "1") as "1" | "2",
          tglRujukan: input.rujukan.tglRujukan,
          noRujukan: input.rujukan.noRujukan,
          ppkRujukan: input.rujukan.ppkRujukan,
        }
      : {
          asalRujukan: "2" as const,
          tglRujukan: k.waktuKunjungan.toISOString().slice(0, 10),
          ppkRujukan: input.sep?.ppkPelayanan,
        };

    let sepError: { code: string; message: string; field?: string } | null = null;

    const updated = await transaction(async (tx) => {
      // Persist penjamin: BPJS → simpan jaminan pasien (No. Kartu enc) & jadikan primer.
      let penjaminId = penjamin?.id;
      if (bpjsFlow && noKartu) {
        penjaminId = await patientDal.upsertPenjaminByTipe(
          patient.id,
          {
            tipe: input.penjaminTipe,
            nama: penjamin?.nama ?? defaultPenjaminNama(input.penjaminTipe),
            nomorEnc: encryptPii(noKartu),
            nomorHash: hashPii(noKartu),
            kelas: input.sep?.klsRawatHak ?? penjamin?.kelas ?? null,
          },
          { setPrimary: true },
          tx,
        );
      } else if (input.penjaminTipe === "Asuransi" || input.penjaminTipe === "Jamkesda") {
        // Non-BPJS: persist detail penjamin bila dikirim (nama/nomor/polis).
        penjaminId = await patientDal.upsertPenjaminByTipe(
          patient.id,
          {
            tipe: input.penjaminTipe,
            nama: input.penjaminNama?.trim() || penjamin?.nama || defaultPenjaminNama(input.penjaminTipe),
            noPolis: input.noPolis?.trim() || null,
          },
          { setPrimary: true },
          tx,
        );
      } else {
        penjaminId = undefined; // Umum → tak ada record penjamin
      }

      await dal.updatePenjamin(kunjunganId, { penjaminTipe: input.penjaminTipe, penjaminId: penjaminId ?? null }, tx);

      if (willIssue && input.sep) {
        // Poli tujuan SEP (RJ) = poli kunjungan (server-otoritatif "auto per-unit").
        const poliEff = k.unit === "RawatJalan" ? (k.poli ?? input.sep.poliTujuan) : undefined;
        // Supersede SEP aktif lama → satu SEP aktif per kunjungan.
        await bpjsDal.supersedeSepByKunjungan(kunjunganId, clock.now(), tx);
        let rujukanId: string | undefined;
        if (input.rujukan) {
          const r = await bpjs.upsertRujukan(kunjunganId, { ...input.rujukan, poliTujuan: poliEff ?? input.rujukan.poliTujuan }, tx);
          rujukanId = r.id;
        }
        const res = await bpjs.issueSep(
          {
            kunjunganId,
            rujukanId,
            noKartu: noKartu!,
            klsRawatHak: input.sep.klsRawatHak ?? penjamin?.kelas ?? undefined,
            tglSep: k.waktuKunjungan,
            diagAwal: diagAwalEff,
            noTelp: noTelpEff,
            skdpKodeDpjp: skdpKodeDpjpEff,
            rujukan: sepRujukan,
            input: { ...input.sep, poliTujuan: poliEff ?? input.sep.poliTujuan, user: await resolveActorNama(actor) },
          },
          tx,
        );
        if (!res.ok) {
          if (!input.forceSep) throw Errors.validation(res.error.message, { sepReject: res.error });
          sepError = res.error; // tetap ubah penjamin; SEP ditangguhkan
        }
      }

      const fresh = await dal.findById(kunjunganId, tx);
      if (!fresh) throw Errors.internal("Gagal memuat kunjungan setelah ubah penjamin");
      return fresh;
    });

    return { ...toDTO(updated), sepError };
  }

  /** Detail kunjungan (incl. rujukan + SEP utk cetak). Unit-scope: anti-IDOR lintas unit. */
  async function getKunjungan(id: string, actor: Actor): Promise<KunjunganDTO> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Kunjungan tidak ditemukan");
    assertUnitInScope(actor, found);
    return toDTO(found);
  }

  /**
   * Diagnosa UTAMA (primary) satu kunjungan — untuk pra-isi rujukan "Kontrol Pasca Ranap"
   * (SEP ranap terakhir → diagnosa primer episode ranap). Gate registration.kunjungan:read;
   * Registrasi/Kasir = role global (bypass unit-scope). Null bila belum ada diagnosa utama.
   */
  async function getDiagnosaUtama(id: string, actor: Actor): Promise<{ kode: string | null; nama: string | null }> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Kunjungan tidak ditemukan");
    assertUnitInScope(actor, found);
    const rows = await diagnosaDal.listUtamaByKunjunganIds([id]);
    const d = rows[0]; // urut createdAt desc → Utama terbaru
    return { kode: d?.kodeIcd10 ?? null, nama: d?.namaDiagnosis ?? null };
  }

  // ── State machine worklist (BACKEND-ENCOUNTER §3) ──────────────────────────--
  // callState (Idle/Dipanggil) = sub-state panggilan; recallCount naik tiap panggil-ulang.
  // Transisi ilegal → 422 (validasi); status sudah berubah saat optimistic → 409 (conflict).
  function buildTransition(action: KunjunganActionName, k: NonNullEntity): UpdateStatusPatch {
    const s = k.status;
    const cs = k.callState;
    const bad = () => Errors.validation(`Aksi "${action}" tidak sah dari status ${s}${cs ? `/${cs}` : ""}`);
    switch (action) {
      case "checkIn": // Registered → Queued (masuk antrean poli)
        if (s !== "Registered") throw bad();
        return { status: "Queued", callState: "Idle" };
      case "call": // panggil ke poli (auto check-in bila masih Registered)
        if (s !== "Registered" && s !== "Queued") throw bad();
        return { status: "Queued", callState: "Dipanggil", recallCount: 0 };
      case "recall": // panggil ulang — naikkan counter, status tetap
        if (s !== "Queued" || cs !== "Dipanggil") throw bad();
        return { status: "Queued", recallCount: (k.recallCount ?? 0) + 1 };
      case "receive": // pasien hadir → mulai pelayanan
        // RJ: setelah dipanggil. IGD/RI: gawat darurat / admisi langsung → terima dari Registered
        // (pasien fisik sudah hadir, tak ada alur panggil-antrean).
        if (s === "Queued" && cs === "Dipanggil") return { status: "InService", callState: "Idle" };
        if (s === "Registered" && (k.unit === "IGD" || k.unit === "RawatInap"))
          return { status: "InService", callState: "Idle" };
        throw bad();
      case "complete": // pelayanan selesai → disposisi + kunci (di-set di transition() dgn opts)
        if (s !== "InService") throw bad();
        return { status: "Completed", callState: "Idle" };
      case "cancel": // batal — dikembalikan ke admisi
        if (s !== "Registered" && s !== "Queued" && s !== "InService") throw bad();
        return { status: "Cancelled", callState: "Idle" };
      case "reopen": // batal selesai → Dilayani (selesaiAt/selesaiPertamaAt DIPERTAHANKAN; lockedAt dibuka di transition())
        if (s !== "Completed") throw bad();
        return { status: "InService", callState: "Idle" };
      default:
        throw Errors.validation("Aksi tidak dikenal");
    }
  }

  interface TransitionOpts {
    bedId?: string;
    waktuSelesai?: string; // "YYYY-MM-DDTHH:mm" (DateTimePicker)
    disposisi?: DisposisiInput; // wajib saat complete (Zod refine)
    alasanReopen?: string;
    resetSelesai?: boolean; // reopen "perbaikan menyeluruh": kosongkan selesaiAt (tgl keluar baru)
  }

  /**
   * Transisi status kunjungan (worklist). Version guard 2-lapis: bila `expectedVersion`
   * dikirim, ditolak saat sudah berubah; lalu updateStatus by version (count 0 = ter-race).
   * `complete` = atomik: gate Diagnosa Utama → tulis Disposisi → set selesai/lock + lepas bed.
   * `reopen` = batal selesai: buka kunci + simpan alasan (timestamp selesai dipertahankan).
   */
  async function transition(
    id: string,
    action: KunjunganActionName,
    expectedVersion: number | undefined,
    actor: Actor,
    opts: TransitionOpts = {},
  ): Promise<KunjunganDTO> {
    const updated = await transaction(async (tx) => {
      const k = await dal.findById(id, tx);
      if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
      assertTransitionAllowed(actor, action, k.status); // authz per-aksi (status-aware: cancel order Registered boleh klinis)
      if (expectedVersion !== undefined && k.version !== expectedVersion) throw Errors.conflictVersion();
      const patch = buildTransition(action, k);

      // Efek samping alokasi bed (dalam tx yang sama):
      //  · receive + bedId → tempati bed (Occupied) + simpan pointer Kunjungan.bedId
      //  · complete/cancel → lepas alokasi aktif kunjungan (bed bebas kembali)
      if (action === "receive") {
        // RI ("Terima Order"): admisi sudah reservasi bed → tempati bed yang SAMA
        // (Reserved→Occupied), hindari create ganda (P2002). IGD: belum ada reservasi →
        // tempati bed yang dipilih petugas saat menerima.
        const reservedBedId = await bedAlloc.occupyReserved(id, tx);
        if (reservedBedId) {
          patch.bedId = reservedBedId;
        } else if (opts.bedId) {
          await bedAlloc.occupy(opts.bedId, id, tx); // P2002 → CONFLICT "Bed sudah dipakai"
          patch.bedId = opts.bedId;
        }
      }
      if (action === "cancel") {
        await bedAlloc.release(id, tx);
        // Admisi RI dibatalkan → PULIHKAN SPRI yang dikonsumsi kunjungan ini (order tetap valid):
        // status balik Terbit (sudah ada No. Ref) / MenungguRef + lepas riKunjunganId →
        // muncul lagi di worklist admisi & dashboard pasien untuk re-admisi.
        const spri = await spriDal.findConsumedByRiKunjungan(id, tx);
        if (spri) {
          await spriDal.revertConsumed(spri.id, spri.noReferensi ? "Terbit" : "MenungguRef", tx);
        }
      }

      // Selesaikan Kunjungan: gate klinis → disposisi atomik → kunci.
      if (action === "complete") {
        const diagnosa = await diagnosaDal.listDiagnosa(id, tx);
        if (!diagnosa.some((d) => d.tipe === "Utama" && d.status === "Pasti")) {
          throw Errors.forbiddenState("Minimal 1 Diagnosa Utama (Pasti) wajib sebelum menyelesaikan kunjungan");
        }

        if (opts.disposisi) {
          // ── Penyelesaian DENGAN disposisi baru (pertama / "perbaikan menyeluruh") ──
          const disp = opts.disposisi;
          const waktuSelesai = parseWaktuSelesai(opts.waktuSelesai) ?? clock.now();
          const pemeriksa = await resolveActorNama(actor);
          await disposisiDal.create({
            kunjunganId: id,
            jenis: disp.jenis,
            waktuKeluar: waktuSelesai,
            dokter: disp.dokter?.trim() || pemeriksa,
            kondisiUmum: disp.kondisiUmum.trim(),
            diagnosaKeluar: (disp.diagnosaKeluar ?? []).map((s) => s.trim()).filter(Boolean),
            instruksi: disp.instruksi?.trim() ?? "",
            rujukTujuan: disp.rujukTujuan?.trim() || null,
            rujukAlasan: disp.rujukAlasan?.trim() || null,
            meninggalWaktu: disp.meninggalWaktu?.trim() || null,
            meninggalSebab: disp.meninggalSebab?.trim() || null,
            apsAlasan: disp.apsAlasan?.trim() || null,
            rawatInapRuangan: disp.rawatInapRuangan?.trim() || null,
            rawatInapKelas: disp.rawatInapKelas?.trim() || null,
            catatan: disp.catatan?.trim() || null,
            obatPulang: disp.obatPulang?.trim() || null,
            edukasiRisiko: disp.edukasiRisiko?.trim() || null,
            penandatangan: disp.penandatangan?.trim() || null,
            hubunganPenandatangan: disp.hubunganPenandatangan?.trim() || null,
            pemeriksa,
            authorUserId: actor.userId,
            authorPegawaiId: actor.pegawaiId,
          }, tx);

          // SPRI (Surat Perintah Rawat Inap) — terbit atomik bersama disposisi Rawat_Inap.
          // No. Referensi diterbitkan server (mock BPJS); null bila kepesertaan bermasalah →
          // status MenungguRef (surat tetap terbit, ref diisi via revisi di worklist admisi).
          if (disp.jenis === "Rawat_Inap" && disp.spri) {
            const s = disp.spri;
            // No. Kartu PENUH dari penjamin BPJS pasien (FE mengirim nilai ter-mask "0001•••••7890").
            // Server-authoritative → SPRI joinable di worklist + InsertSPRI nyata kirim kartu valid.
            let noKartuSpri = s.noKartu;
            const pt = await patientDal.findById(k.patientId, tx);
            const enc = pt?.penjamin.find(
              (p) => (p.tipe === "BPJS_Non_PBI" || p.tipe === "BPJS_PBI") && p.nomorEnc,
            )?.nomorEnc;
            if (enc) noKartuSpri = decryptPii(enc);

            const noReferensi = await issueSpriRef({
              noKartu: noKartuSpri,
              dpjpPegawaiId: s.dpjpPegawaiId ?? null,
              poliKontrol: s.poliKode ?? undefined,
              tglRencanaKontrol: s.tglRencanaRawat,
              user: pemeriksa,
              actor: actor.userId,
              actorRole: actor.roles[0] ?? "registration",
            });
            await spriDal.create({
              kunjunganId: id,
              noKartu: noKartuSpri,
              dpjpNama: s.dpjpNama,
              dpjpPegawaiId: s.dpjpPegawaiId ?? null,
              smfSpesialistik: s.smfSpesialistik ?? null,
              poliKode: s.poliKode ?? null,
              poliNama: s.poliNama ?? null,
              tglRencanaRawat: new Date(s.tglRencanaRawat),
              jenisPerawatan: s.jenisPerawatan,
              indikasi: s.indikasi.trim(),
              keterangan: s.keterangan?.trim() || null,
              noReferensi,
              status: noReferensi ? "Terbit" : "MenungguRef",
              user: pemeriksa,
              createdByUserId: actor.userId,
            }, tx);
          }
          patch.selesaiAt = waktuSelesai;
          if (!k.selesaiPertamaAt) patch.selesaiPertamaAt = waktuSelesai; // immutable, sekali
          patch.lockedAt = clock.now();
          patch.disposisi = disp.jenis;
          await bedAlloc.release(id, tx);
        } else {
          // ── Selesaikan KEMBALI tanpa disposisi baru ("perbaikan pengimputan") ──
          // Disposisi terakhir TETAP berlaku, tgl keluar DIPERTAHANKAN → cukup kunci ulang
          // (langsung, tanpa form). Wajib pernah didisposisikan sebelumnya.
          if (!k.disposisi) throw Errors.validation("Disposisi wajib saat menyelesaikan kunjungan");
          const waktuSelesai = parseWaktuSelesai(opts.waktuSelesai) ?? k.selesaiAt ?? clock.now();
          patch.selesaiAt = waktuSelesai;
          if (!k.selesaiPertamaAt) patch.selesaiPertamaAt = waktuSelesai;
          patch.lockedAt = clock.now();
          await bedAlloc.release(id, tx);
        }
      }

      // Batal Selesai: buka kunci + simpan alasan.
      //  · "perbaikan pengimputan" (default): selesaiAt DIPERTAHANKAN → tgl keluar frozen; koreksi
      //    input lalu selesaikan ulang dgn tanggal yang sama.
      //  · "perbaikan menyeluruh" (resetSelesai): kosongkan selesaiAt → tgl keluar BARU dipilih saat
      //    penyelesaian ulang. selesaiPertamaAt (jejak selesai pertama) TETAP sebagai audit.
      if (action === "reopen") {
        patch.lockedAt = null;
        patch.alasanReopen = opts.alasanReopen?.trim() || null;
        if (opts.resetSelesai) patch.selesaiAt = null;
      }

      const count = await dal.updateStatus(id, k.version, patch, tx);
      if (count === 0) throw Errors.conflictVersion();
      const fresh = await dal.findById(id, tx);
      if (!fresh) throw Errors.internal("Gagal memuat kunjungan setelah transisi");
      return fresh;
    });
    return toDTO(updated);
  }

  /** Worklist lintas unit (cursor). Default: status aktif bila filter kosong. */
  async function getWorklist(query: WorklistQuery, actor: Actor): Promise<{ items: KunjunganListItemDTO[]; cursor: string | null }> {
    // Query per-pasien = timeline/Riwayat → semua status. Query unit = worklist → aktif saja.
    const status = parseStatuses(query.status) ?? (query.patientId ? undefined : [...ACTIVE_STATUS]);

    // ABAC unit-scope: batasi ke unit kerja actor (kecuali superuser/global). Irisan dengan
    // filter unit yang diminta; bila kosong → tak ada yang boleh dilihat.
    let units: CareUnit[] | undefined;
    if (!unitScopeBypassed(actor)) {
      const allowed = actor.careUnits as CareUnit[];
      const scoped = query.unit ? allowed.filter((u) => u === query.unit) : allowed;
      if (scoped.length === 0) return { items: [], cursor: null };
      units = scoped;
    }

    // Periode by waktuKunjungan (tanggal-saja, inklusif). Wall-clock UTC (konvensi repo) →
    // dari = awal hari (00:00:00.000Z), sampai = akhir hari (23:59:59.999Z).
    const dari = query.dari ? new Date(`${query.dari}T00:00:00.000Z`) : undefined;
    const sampai = query.sampai ? new Date(`${query.sampai}T23:59:59.999Z`) : undefined;

    const { items, nextCursor } = await dal.listByUnitStatus({
      unit: units ? undefined : query.unit,
      units,
      status,
      patientId: query.patientId,
      dari,
      sampai,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toListDTO), cursor: nextCursor };
  }

  return { registerKunjungan, changePenjamin, getKunjungan, getDiagnosaUtama, getWorklist, transition };
}

export const kunjunganService = makeKunjunganService();
