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
import { makeBpjsService, toSepDTO, toRujukanDTO } from "@/lib/services/bpjsService";
import { makeBedAllocationService } from "@/lib/services/bedAllocationService";
import { systemClock, type Clock } from "@/lib/core/clock";
import { decryptPii, encryptPii, hashPii } from "@/lib/crypto/pii";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import { unitScopeBypassed, type CareUnit } from "@/lib/auth/careUnit";
import { assertUnitInScope } from "@/lib/services/clinicalScope";
import type { RegisterKunjunganInput, WorklistQuery, KunjunganDTO, KunjunganListItemDTO, KunjunganActionName } from "@/lib/schemas/kunjungan";
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
 *  · `receive` (Terima Pasien) = aksi bedside KLINIS (perawat/dokter, marker clinical.rekammedis:update)
 *    ATAU admisi loket (registration.kunjungan:update) → IGD bisa diterima oleh perawat/dokter jaga.
 *  · transisi administratif lain (checkIn/call/recall/complete/cancel/reopen) = wewenang loket.
 *  Superuser bypass. ABAC unit-scope (IGD nurse hanya pasien IGD) ditegakkan terpisah di route
 *  via scopeKunjungan. */
function assertTransitionAllowed(actor: Actor, action: KunjunganActionName): void {
  if (actor.isSuperuser || actor.permissions.has("*")) return;
  const can = (r: string, a: string): boolean => actor.permissions.has(`${r}:${a}`);
  if (action === "receive") {
    if (can("clinical.rekammedis", "update") || can("registration.kunjungan", "update")) return;
    throw Errors.forbidden("Tidak punya izin menerima pasien (perlu clinical.rekammedis:update atau registration.kunjungan:update)");
  }
  if (!can("registration.kunjungan", "update")) {
    throw Errors.forbidden("Tidak punya izin registration.kunjungan:update");
  }
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
  async function registerKunjungan(input: RegisterKunjunganInput, _actor: Actor): Promise<KunjunganDTO> {
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
        await bpjs.issueSep(
          {
            kunjunganId: k.id,
            rujukanId,
            noKartu: noKartu!,
            klsRawatHak: penjamin?.kelas ?? undefined,
            tglSep: waktu,
            input: input.sep,
          },
          tx,
        );
      }
      // RI: reserve bed terpilih saat daftar (Reserved). Bed sudah dipakai → P2002 → CONFLICT.
      if (input.unit === "RawatInap" && input.bedId) {
        await bedAlloc.reserve(input.bedId, k.id, tx);
      }

      const fresh = await dal.findById(k.id, tx);
      if (!fresh) throw Errors.internal("Gagal memuat kunjungan setelah dibuat");
      return fresh;
    });

    return toDTO(created);
  }

  /** Detail kunjungan (incl. rujukan + SEP utk cetak). Unit-scope: anti-IDOR lintas unit. */
  async function getKunjungan(id: string, actor: Actor): Promise<KunjunganDTO> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Kunjungan tidak ditemukan");
    assertUnitInScope(actor, found);
    return toDTO(found);
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
      case "complete": // pelayanan selesai → kunci waktu selesai (immutable)
        if (s !== "InService") throw bad();
        return { status: "Completed", callState: "Idle", selesaiAt: clock.now(), lockedAt: clock.now() };
      case "cancel": // batal — dikembalikan ke admisi
        if (s !== "Registered" && s !== "Queued" && s !== "InService") throw bad();
        return { status: "Cancelled", callState: "Idle" };
      case "reopen": // buka kembali Selesai → Dilayani (selesaiAt DIPERTAHANKAN)
        if (s !== "Completed") throw bad();
        return { status: "InService", callState: "Idle" };
      default:
        throw Errors.validation("Aksi tidak dikenal");
    }
  }

  /**
   * Transisi status kunjungan (worklist). Version guard 2-lapis: bila `expectedVersion`
   * dikirim, ditolak saat sudah berubah; lalu updateStatus by version (count 0 = ter-race).
   */
  async function transition(
    id: string,
    action: KunjunganActionName,
    expectedVersion: number | undefined,
    actor: Actor,
    bedId?: string,
  ): Promise<KunjunganDTO> {
    assertTransitionAllowed(actor, action); // authz per-aksi (receive boleh klinis)
    const updated = await transaction(async (tx) => {
      const k = await dal.findById(id, tx);
      if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
      if (expectedVersion !== undefined && k.version !== expectedVersion) throw Errors.conflictVersion();
      const patch = buildTransition(action, k);

      // Efek samping alokasi bed (dalam tx yang sama):
      //  · receive + bedId → tempati bed (Occupied) + simpan pointer Kunjungan.bedId
      //  · complete/cancel → lepas alokasi aktif kunjungan (bed bebas kembali)
      if (action === "receive" && bedId) {
        await bedAlloc.occupy(bedId, id, tx); // P2002 → CONFLICT "Bed sudah dipakai"
        patch.bedId = bedId;
      }
      if (action === "complete" || action === "cancel") {
        await bedAlloc.release(id, tx);
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

    const { items, nextCursor } = await dal.listByUnitStatus({
      unit: units ? undefined : query.unit,
      units,
      status,
      patientId: query.patientId,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toListDTO), cursor: nextCursor };
  }

  return { registerKunjungan, getKunjungan, getWorklist, transition };
}

export const kunjunganService = makeKunjunganService();
