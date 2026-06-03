// patientService — business rules domain pendaftaran (FLOWS §2). Tak import prisma
// langsung (pakai `transaction` + DAL). PII di-enkripsi/hash di sini (boundary), DTO
// mapping di sini (mask NIK/noKartu). Non-determinisme via `clock` yang di-inject (FLOWS §14).

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/patientDal";
import { systemClock, type Clock } from "@/lib/core/clock";
import { encryptPii, hashPii, decryptPii, maskPii } from "@/lib/crypto/pii";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  RegisterPatientInput,
  CompletePatientInput,
  SearchQuery,
  AddressInput,
  PatientDTO,
  UpdatePenjaminInput,
} from "@/lib/schemas/patient";
import type {
  PatientEntity,
  AddressData,
  PenjaminData,
  UpdatePatientData,
} from "@/lib/dal/patientDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<PatientEntity>;

// Dukung dua format: baru YYMMNNNN (8+ digit) & lama RM-YYYY-NNNNN (transisi non-destruktif).
// NIK (16 digit) di-intercept lebih dulu di searchPatient → tak bentrok dgn cabang ≥8 digit.
const RM_PATTERN = /^(?:RM-\d{4}-\d+|\d{8,})$/i;
const NIK_PATTERN = /^\d{16}$/;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // Indonesia WIB (tanpa DST) — periode RM ikut kalender lokal, bukan UTC

export function makePatientService(deps: { clock?: Clock; dal?: Dal } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;

  // ── Helpers ─────────────────────────────────────────────────────────────---
  function toDate(iso?: string): Date | undefined {
    if (!iso) return undefined;
    const d = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw Errors.validation("Tanggal tidak valid");
    if (d.getTime() > clock.now().getTime()) throw Errors.validation("Tanggal lahir tidak boleh di masa depan");
    return d;
  }

  function buildAddresses(ktp?: AddressInput, domisili?: AddressInput): AddressData[] {
    const out: AddressData[] = [];
    if (ktp) out.push({ ...ktp, jenis: "KTP" });
    if (domisili) out.push({ ...domisili, jenis: "Domisili" });
    return out;
  }

  function buildPenjamin(list?: RegisterPatientInput["penjamin"]): PenjaminData[] {
    const items = list && list.length ? list : [{ tipe: "Umum" as const, nama: "Umum / Mandiri", isPrimer: true }];
    return items.map((p) => ({
      tipe: p.tipe,
      nama: p.nama,
      kelas: p.kelas,
      noPolis: p.noPolis,
      isPrimer: p.isPrimer,
      berlakuSampai: p.berlakuSampai ? toDate(p.berlakuSampai) : undefined,
      ...(p.nomor ? { nomorEnc: encryptPii(p.nomor), nomorHash: hashPii(p.nomor) } : {}),
    }));
  }

  /** Kelengkapan minimal untuk dianggap `dataLengkap` (bukan draft). */
  function isComplete(input: RegisterPatientInput): boolean {
    return (
      !input.isAnonim &&
      !!input.tanggalLahir &&
      !!input.tempatLahir &&
      !!input.statusPerkawinan &&
      !!input.alamatKtp?.alamat
    );
  }

  /** Periode "YYMM" zona WIB (mis. "2602") — penanda bulan reset sequence noRM. */
  function rmPeriode(): string {
    const wib = new Date(clock.now().getTime() + WIB_OFFSET_MS);
    const yy = String(wib.getUTCFullYear() % 100).padStart(2, "0");
    const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
    return `${yy}${mm}`;
  }

  /** noRM YYMMNNNN. Pad min 4 digit; bila >9999/bulan lebar tumbuh (tak pernah error). */
  function formatNoRm(periode: string, seq: number): string {
    return `${periode}${String(seq).padStart(4, "0")}`;
  }

  // ── DTO mapping (mask PII; entity Prisma TIDAK bocor) ─────────────────────---
  function umur(tgl: Date | null): number | null {
    if (!tgl) return null;
    const now = clock.now();
    let age = now.getUTCFullYear() - tgl.getUTCFullYear();
    const m = now.getUTCMonth() - tgl.getUTCMonth();
    if (m < 0 || (m === 0 && now.getUTCDate() < tgl.getUTCDate())) age--;
    return Math.max(0, age);
  }

  function toDTO(p: NonNullEntity): PatientDTO {
    const nik = p.nikEnc ? decryptPii(p.nikEnc) : null;
    return {
      id: p.id,
      noRm: p.noRm,
      nikMasked: nik ? maskPii(nik) : null,
      nama: p.nama,
      gender: p.gender,
      tempatLahir: p.tempatLahir,
      tanggalLahir: p.tanggalLahir ? p.tanggalLahir.toISOString().slice(0, 10) : null,
      umur: umur(p.tanggalLahir),
      golonganDarah: p.golonganDarah,
      rhesus: p.rhesus,
      statusPerkawinan: p.statusPerkawinan,
      agama: p.agama,
      pendidikan: p.pendidikan,
      pekerjaan: p.pekerjaan,
      suku: p.suku,
      kewarganegaraan: p.kewarganegaraan,
      isWna: p.isWna,
      isAnonim: p.isAnonim,
      dataLengkap: p.dataLengkap,
      noHp: p.noHp,
      email: p.email,
      idSatusehat: p.idSatusehat,
      sumberDaftar: p.sumberDaftar,
      version: p.version,
      createdAt: p.createdAt.toISOString(),
      alamat: p.alamat.map((a) => ({
        jenis: a.jenis,
        alamat: a.alamat,
        rtRw: a.rtRw,
        kodePos: a.kodePos,
        provinsiNama: a.provinsiNama,
        kotaNama: a.kotaNama,
        kecamatanNama: a.kecamatanNama,
        kelurahanNama: a.kelurahanNama,
      })),
      penjamin: p.penjamin.map((pj) => ({
        id: pj.id,
        tipe: pj.tipe,
        nama: pj.nama,
        nomorMasked: pj.nomorEnc ? maskPii(decryptPii(pj.nomorEnc)) : null,
        kelas: pj.kelas,
        noPolis: pj.noPolis,
        isPrimer: pj.isPrimer,
      })),
      alergiAwal: p.alergiAwal.map((a) => ({ nama: a.nama, reaksi: a.reaksi, tingkat: a.tingkat })),
      kontakDarurat: p.kontakDarurat.map((k) => ({
        nama: k.nama,
        hubungan: k.hubungan,
        noHp: k.noHp,
        alamat: k.alamat,
      })),
    };
  }

  // ── Operasi domain ─────────────────────────────────────────────────────────
  /**
   * Daftar pasien — DEDUP-FIRST (BACKEND-PATIENT §4.2): bila NIK/paspor sudah ada →
   * kembalikan pasien existing (cegah double-MRN, bukan error). Else buat baru.
   */
  async function registerPatient(
    input: RegisterPatientInput,
    _actor: Actor,
  ): Promise<{ patient: PatientDTO; created: boolean }> {
    // 1) Dedup (non-anonim) → kembalikan existing (created:false).
    if (!input.isAnonim) {
      if (input.isWna && input.noPaspor) {
        const ex = await dal.findByPasporHash(hashPii(input.noPaspor));
        if (ex) return { patient: toDTO(ex), created: false };
      } else if (input.nik) {
        const ex = await dal.findByNikHash(hashPii(input.nik));
        if (ex) return { patient: toDTO(ex), created: false };
      }
    }

    // 2) Susun data create (enkripsi PII).
    const tanggalLahir = toDate(input.tanggalLahir);
    const data = {
      ...(input.nik ? { nikEnc: encryptPii(input.nik), nikHash: hashPii(input.nik) } : {}),
      ...(input.noKK ? { noKkEnc: encryptPii(input.noKK), noKkHash: hashPii(input.noKK) } : {}),
      ...(input.noPaspor ? { noPasporEnc: encryptPii(input.noPaspor), noPasporHash: hashPii(input.noPaspor) } : {}),
      isWna: input.isWna,
      isAnonim: input.isAnonim,
      nama: input.nama,
      gender: input.gender,
      tempatLahir: input.tempatLahir,
      tanggalLahir,
      golonganDarah: input.golonganDarah,
      rhesus: input.rhesus,
      statusPerkawinan: input.statusPerkawinan,
      agama: input.agama,
      pendidikan: input.pendidikan,
      pekerjaan: input.pekerjaan,
      suku: input.suku,
      kewarganegaraan: input.kewarganegaraan,
      noHp: input.noHp,
      email: input.email,
      dataLengkap: isComplete(input),
      sumberDaftar: input.sumberDaftar,
      alamat: buildAddresses(input.alamatKtp, input.alamatDomisili),
      penjamin: buildPenjamin(input.penjamin),
      alergiAwal: input.alergiAwal ?? [],
      kontakDarurat: input.kontakDarurat ?? [],
    };

    // 3) noRM atomik + create dalam 1 transaksi (seq tak terbuang bila gagal).
    try {
      const created = await transaction(async (tx) => {
        const periode = rmPeriode();
        const seq = await dal.nextNoRmSeq(periode, tx);
        return dal.create({ ...data, noRm: formatNoRm(periode, seq) }, tx);
      });
      return { patient: toDTO(created), created: true };
    } catch (e) {
      // Race: unique nikHash dilanggar → ambil existing (tetap dedup, bukan error).
      if (isUniqueViolation(e) && !input.isAnonim && input.nik) {
        const ex = await dal.findByNikHash(hashPii(input.nik));
        if (ex) return { patient: toDTO(ex), created: false };
      }
      throw e;
    }
  }

  /** Lengkapi pasien draft → dataLengkap=true. Version guard (optimistic concurrency). */
  async function completePatient(id: string, input: CompletePatientInput, _actor: Actor): Promise<PatientDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Pasien tidak ditemukan");

    const patch: UpdatePatientData = {
      nama: input.nama,
      gender: input.gender,
      tempatLahir: input.tempatLahir,
      tanggalLahir: toDate(input.tanggalLahir),
      golonganDarah: input.golonganDarah,
      rhesus: input.rhesus,
      statusPerkawinan: input.statusPerkawinan,
      agama: input.agama,
      pendidikan: input.pendidikan,
      pekerjaan: input.pekerjaan,
      suku: input.suku,
      kewarganegaraan: input.kewarganegaraan,
      noHp: input.noHp,
      email: input.email,
      dataLengkap: true,
      ...(input.nik ? { nikEnc: encryptPii(input.nik), nikHash: hashPii(input.nik) } : {}),
      ...(input.noKK ? { noKkEnc: encryptPii(input.noKK), noKkHash: hashPii(input.noKK) } : {}),
      ...(input.noPaspor ? { noPasporEnc: encryptPii(input.noPaspor), noPasporHash: hashPii(input.noPaspor) } : {}),
    };

    const updated = await transaction(async (tx) => {
      const count = await dal.updateWithVersion(id, input.expectedVersion, patch, tx);
      if (count === 0) throw Errors.conflictVersion();
      if (input.alamatKtp) await dal.upsertAddress(id, { ...input.alamatKtp, jenis: "KTP" }, tx);
      if (input.alamatDomisili) await dal.upsertAddress(id, { ...input.alamatDomisili, jenis: "Domisili" }, tx);
      const fresh = await dal.findById(id, tx);
      if (!fresh) throw Errors.notFound("Pasien tidak ditemukan");
      return fresh;
    });
    return toDTO(updated);
  }

  /**
   * Ubah penjamin (jaminan aktif). Upsert by tipe + jadikan primer (single-primary
   * invariant di DAL). No. Kartu di-enc/hash di sini (boundary PII).
   */
  async function updatePenjamin(id: string, input: UpdatePenjaminInput, _actor: Actor): Promise<PatientDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Pasien tidak ditemukan");

    const updated = await transaction(async (tx) => {
      await dal.upsertPenjaminByTipe(
        id,
        {
          tipe: input.tipe,
          nama: input.nama ?? penjaminNama(input.tipe),
          // nomor absen = SKIP (jangan timpa No. Kartu existing dgn nilai masked dari UI).
          nomorEnc: input.nomor ? encryptPii(input.nomor) : undefined,
          nomorHash: input.nomor ? hashPii(input.nomor) : undefined,
          kelas: input.kelas ?? null,
          noPolis: input.noPolis ?? null,
        },
        { setPrimary: true },
        tx,
      );
      const fresh = await dal.findById(id, tx);
      if (!fresh) throw Errors.notFound("Pasien tidak ditemukan");
      return fresh;
    });
    return toDTO(updated);
  }

  /** Cari/list pasien. NIK/RM = exact (1 hasil); nama/umum = trigram + cursor. */
  async function searchPatient(query: SearchQuery): Promise<{ items: PatientDTO[]; cursor: string | null }> {
    const q = query.q?.trim();

    const byNik = query.by === "nik" || (!query.by && !!q && NIK_PATTERN.test(q));
    if (byNik && q) {
      const found = await dal.findByNikHash(hashPii(q));
      return { items: found ? [toDTO(found)] : [], cursor: null };
    }

    const byRm = query.by === "rm" || (!query.by && !!q && RM_PATTERN.test(q));
    if (byRm && q) {
      const found = await dal.findByNoRm(q);
      return { items: found ? [toDTO(found)] : [], cursor: null };
    }

    const { items, nextCursor } = await dal.searchByNama({ q, cursor: query.cursor, limit: query.limit });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /** Ambil 1 pasien (redirect bila merged = fase later). */
  async function getPatient(id: string, _actor: Actor): Promise<PatientDTO> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Pasien tidak ditemukan");
    return toDTO(found);
  }

  return { registerPatient, completePatient, searchPatient, getPatient, updatePenjamin };
}

/** Nama penjamin default bila operator tak isi nama. */
function penjaminNama(tipe: string): string {
  switch (tipe) {
    case "BPJS_Non_PBI": return "BPJS Kesehatan Non-PBI";
    case "BPJS_PBI": return "BPJS Kesehatan PBI";
    case "Asuransi": return "Asuransi";
    case "Jamkesda": return "Jamkesda";
    default: return "Umum / Mandiri";
  }
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === "P2002";
}

export const patientService = makePatientService();
