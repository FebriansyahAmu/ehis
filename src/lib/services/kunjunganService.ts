// kunjunganService — domain Kunjungan (spine) + use-case "Pendaftaran Kunjungan Baru"
// (BACKEND-ENCOUNTER §4.2). Tak import prisma langsung (pakai `transaction` + DAL).
//
// CATATAN ORKESTRASI (§4.2b): `registerKunjungan` saat ini ber-peran sbg use-case admisi
// RJ — ia memuat pasien (patientDal), buat Kunjungan, lalu terbitkan SEP (bpjsService)
// dalam 1 transaksi. Saat domain Patient-completion/Billing/Antrean lengkap, orkestrasi
// penuh dipindah ke `registrationService` khusus; operasi domain di sini tetap.
//
// FOKUS RAWAT JALAN. Efek lintas-domain yang belum ada (Invoice draft saat Queued, Antrean
// T3/T4/T5) DITUNDA — kunjungan dibuat pada status `Registered` (lihat TODO di bawah).

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/kunjunganDal";
import * as patientDal from "@/lib/dal/patientDal";
import { makeBpjsService, toSepDTO, toRujukanDTO } from "@/lib/services/bpjsService";
import { systemClock, type Clock } from "@/lib/core/clock";
import { decryptPii } from "@/lib/crypto/pii";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { RegisterKunjunganInput, WorklistQuery, KunjunganDTO } from "@/lib/schemas/kunjungan";
import type { KunjunganEntity } from "@/lib/dal/kunjunganDal";

type Dal = typeof defaultDal;
type Bpjs = ReturnType<typeof makeBpjsService>;
type NonNullEntity = NonNullable<KunjunganEntity>;

const KNOWN_STATUS = new Set([
  "Registered", "Queued", "InService", "Completed", "Closed", "Billed", "Claimed", "Cancelled",
]);
const ACTIVE_STATUS = ["Registered", "Queued", "InService"] as const;

const isBpjs = (t: string): boolean => t === "BPJS_Non_PBI" || t === "BPJS_PBI";

export function makeKunjunganService(deps: { clock?: Clock; dal?: Dal; bpjs?: Bpjs } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;
  const bpjs = deps.bpjs ?? makeBpjsService({ clock });

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
      kelas: k.kelas,
      triaseLevel: k.triaseLevel,
      caraMasuk: k.caraMasuk,
      caraDatang: k.caraDatang,
      asalMasuk: k.asalMasuk,
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

  // ── Operasi ─────────────────────────────────────────────────────────────---
  /**
   * Pendaftaran Kunjungan Baru (RJ). Kontrak Patient↔Kunjungan (BACKEND-ENCOUNTER §10):
   * RJ wajib pasien `dataLengkap`. Pasien BPJS → buat Rujukan + terbitkan SEP (mock) di
   * transaksi yang sama; semua-atau-tidak (rollback bila salah satu gagal).
   */
  async function registerKunjungan(input: RegisterKunjunganInput, _actor: Actor): Promise<KunjunganDTO> {
    const patient = await patientDal.findById(input.patientId);
    if (!patient) throw Errors.notFound("Pasien tidak ditemukan");
    if (!patient.dataLengkap) {
      throw Errors.validation("Pasien belum lengkap datanya — lengkapi sebelum pendaftaran Rawat Jalan");
    }

    // Penjamin yang dipakai: by id, else primer, else pertama.
    const penjamin = input.penjaminId
      ? patient.penjamin.find((p) => p.id === input.penjaminId)
      : patient.penjamin.find((p) => p.isPrimer) ?? patient.penjamin[0];
    if (input.penjaminId && !penjamin) throw Errors.validation("Penjamin tidak ditemukan pada pasien");

    const bpjsFlow = isBpjs(input.penjaminTipe);
    let noKartu: string | undefined;
    if (bpjsFlow) {
      if (!penjamin?.nomorEnc) throw Errors.validation("Penjamin BPJS tidak memiliki nomor kartu");
      noKartu = decryptPii(penjamin.nomorEnc);
    }

    const waktu = combineDateTime(input.tanggal, input.jam);

    const created = await transaction(async (tx) => {
      const seq = await dal.nextNoKunjunganSeq(tx);
      const k = await dal.create(
        {
          patientId: patient.id,
          unit: "RawatJalan",
          // TODO(BILLING/ANTREAN): saat check-in (Registered→Queued) buat Invoice draft + emit T3.
          status: "Registered",
          noKunjungan: formatNoKunjungan(input.unit, seq),
          waktuKunjungan: waktu,
          poli: input.poli,
          dpjpId: input.dpjpId,
          keluhan: input.keluhan,
          caraMasuk: input.caraMasuk,
          penjaminTipe: input.penjaminTipe,
          penjaminId: penjamin?.id,
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

      const fresh = await dal.findById(k.id, tx);
      if (!fresh) throw Errors.internal("Gagal memuat kunjungan setelah dibuat");
      return fresh;
    });

    return toDTO(created);
  }

  /** Detail kunjungan (incl. rujukan + SEP utk cetak). */
  async function getKunjungan(id: string, _actor: Actor): Promise<KunjunganDTO> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Kunjungan tidak ditemukan");
    return toDTO(found);
  }

  /** Worklist lintas unit (cursor). Default: status aktif bila filter kosong. */
  async function getWorklist(query: WorklistQuery, _actor: Actor): Promise<{ items: KunjunganDTO[]; cursor: string | null }> {
    const status = parseStatuses(query.status) ?? [...ACTIVE_STATUS];
    const { items, nextCursor } = await dal.listByUnitStatus({
      unit: query.unit,
      status,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  return { registerKunjungan, getKunjungan, getWorklist };
}

export const kunjunganService = makeKunjunganService();
