/**
 * V-Claim Adapter — Kepesertaan (BP0.4).
 *
 * Methods:
 * - `getPesertaByKartu` — `/Peserta/nokartu/{noKartu}/tglSEP/{tgl}`
 * - `getPesertaByNik`   — `/Peserta/nik/{nik}/tglSEP/{tgl}`
 *
 * Mock lookup di `PESERTA_MOCK`. Auto-audit via `wrapWithAudit`.
 */

import {
  Err,
  type BPJSConfig,
  type BPJSEnvelope,
  type BPJSError,
  type PesertaRecord,
  type Result,
} from "./bpjsShared";
import { errEnvelope, okEnvelope, preflightMock, wrapWithAudit } from "./vClaimShared";
import { VCLAIM_ENDPOINTS } from "./bpjsEndpoints";
import { PESERTA_MOCK } from "./mock/pesertaMock";

// ── getPesertaByKartu ──────────────────────────────────

export function getPesertaByKartu(
  noKartu: string,
  tglSEP: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<PesertaRecord>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.peserta.byNoKartu(noKartu, tglSEP);
  return wrapWithAudit<PesertaRecord>({ endpoint, method: "GET" }, async () => {
    const err = await preflightMock(config);
    if (err) return Err(err);

    if (!/^\d{13}$/.test(noKartu)) {
      return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
    }

    const peserta = PESERTA_MOCK.find((p) => p.noKartu === noKartu);
    if (!peserta) return errEnvelope("201", endpoint, "Peserta tidak ditemukan");

    if (peserta.statusPeserta.kode === "1") {
      return errEnvelope("203", endpoint, "Status peserta Non-Aktif");
    }
    return okEnvelope(peserta);
  })();
}

// ── getPesertaByNik ────────────────────────────────────

export function getPesertaByNik(
  nik: string,
  tglSEP: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<PesertaRecord>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.peserta.byNik(nik, tglSEP);
  return wrapWithAudit<PesertaRecord>({ endpoint, method: "GET" }, async () => {
    const err = await preflightMock(config);
    if (err) return Err(err);

    if (!/^\d{16}$/.test(nik)) {
      return errEnvelope("204", endpoint, "NIK harus 16 digit");
    }

    const peserta = PESERTA_MOCK.find((p) => p.nik === nik);
    if (!peserta) return errEnvelope("201", endpoint, "Peserta tidak ditemukan");
    if (peserta.statusPeserta.kode === "1") {
      return errEnvelope("203", endpoint, "Status peserta Non-Aktif");
    }
    return okEnvelope(peserta);
  })();
}
