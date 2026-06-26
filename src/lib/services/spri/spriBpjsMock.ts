// Penerbitan No. Referensi SPRI (= noSuratKontrol) via kontrak V-Claim RencanaKontrol/InsertSPRI.
//
// Sekarang BPJS_MODE=mock (belum ada cons-id) → insertSPRI SELALU sukses → ref SELALU terbit
// (status SPRI selalu "Terbit"; jalur MenungguRef/revise tak terpicu di mock). ⚠️ removable —
// ganti BPJS_MODE / wire real. Lihat TECH_DEBT.
//
// ⚠️ R4: dipanggil DI DALAM transaksi kunjungan (complete). Aman untuk mock (tanpa HTTP). Saat
// BPJS_MODE!=mock, panggilan HTTP nyata TIDAK boleh di dalam tx → pindahkan ke OUTBOX (post-commit).
// Lihat TECH_DEBT.

import { insertSPRI } from "@/lib/services/bpjs/rencanaKontrol";
import { resolveKodeDpjpBpjsByPegawai } from "@/lib/services/bpjs/referensiDpjp";
import type { InsertSPRIPayload } from "@/lib/bpjs/bpjsContracts";

export interface IssueSpriInput {
  noKartu: string;
  /** Kode dokter DPJP BPJS (eksplisit). Bila kosong → di-resolve dari `dpjpPegawaiId` via mapping. */
  kodeDokter?: string;
  /** PegawaiId DPJP — dipakai resolve kode DPJP BPJS (Pegawai→Dokter→DpjpMapping). */
  dpjpPegawaiId?: string | null;
  /** Kode poli kontrol BPJS. */
  poliKontrol?: string;
  /** yyyy-MM-dd. */
  tglRencanaKontrol: string;
  /** User pembuat SPRI. */
  user: string;
  /** Audit (R9) — default sistem bila tak diberi. */
  actor?: string;
  actorRole?: string;
}

/**
 * Terbitkan No. Referensi SPRI via InsertSPRI.
 * @returns noSuratKontrol bila sukses; `null` bila BPJS gagal (mock SELALU sukses → tak null).
 */
export async function issueSpriRef(input: IssueSpriInput): Promise<string | null> {
  // Kode DPJP BPJS: eksplisit > resolve dari mapping (Pegawai→Dokter→DpjpMapping). "" bila belum ter-map.
  const kodeDokter = input.kodeDokter?.trim() || (await resolveKodeDpjpBpjsByPegawai(input.dpjpPegawaiId));
  const payload: InsertSPRIPayload = {
    noKartu: input.noKartu.trim(),
    kodeDokter,
    poliKontrol: input.poliKontrol?.trim() || "",
    tglRencanaKontrol: input.tglRencanaKontrol,
    user: input.user,
  };
  const res = await insertSPRI(payload, {
    actor: input.actor ?? "system@spri",
    actorRole: input.actorRole ?? "registration",
  });
  return res.ok ? res.value.response?.noSuratKontrol ?? null : null;
}
