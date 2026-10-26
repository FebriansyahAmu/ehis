// FH0 — Status kesehatan integrasi SatuSehat + uji token. Read-only kecuali probe (yang hanya
// mengambil token, tanpa menulis resource). Dipakai konsol /ehis-fhir (FH9) & verifikasi sandbox.

import "server-only";
import { describeSatuSehatConfig, getSatuSehatConfig } from "@/lib/fhir/server/config";
import { describeToken, getSatuSehatToken } from "@/lib/fhir/server/token";
import { describeCircuits } from "@/lib/fhir/server/circuit";
import { Ok } from "@/lib/fhir/fhirShared";
import * as syncLogDal from "@/lib/dal/fhir/syncLogDal";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as auditDal from "@/lib/dal/fhir/auditDal";
import { auditedFhirCall, auditActorOf } from "./audit";
import type { Actor } from "@/lib/auth/actor";
import type { FhirStatusDTO, FhirTokenProbeDTO } from "@/lib/schemas/fhir/status";

export async function getStatus(): Promise<FhirStatusDTO> {
  const config = describeSatuSehatConfig();
  const [outbox, resourceMap, recent] = await Promise.all([
    syncLogDal.countByStatus(),
    config.mode === "invalid" ? Promise.resolve({}) : resourceMapDal.countByType(config.mode),
    auditDal.listRecent(20),
  ]);
  return {
    config,
    token: describeToken(),
    circuits: describeCircuits(),
    outbox,
    resourceMap,
    recentCalls: recent.map((r) => ({ ...r, startedAt: r.startedAt.toISOString() })),
  };
}

/**
 * Uji ambil token OAuth2 (DoD FH0: "token nyata ke sandbox OK"). Mode mock → tidak ada jaringan,
 * dilaporkan apa adanya. Config kurang → `FhirConfigError` (fail-loud → 500 via route()).
 */
export async function probeToken(actor: Actor): Promise<FhirTokenProbeDTO> {
  const cfg = getSatuSehatConfig();
  const t0 = Date.now();
  if (cfg.mode === "mock") {
    return { ok: true, mode: "mock", message: "Mode mock — tidak ada panggilan ke SatuSehat", durationMs: 0 };
  }

  const r = await auditedFhirCall<null>(
    { target: "oauth", endpoint: "oauth2/v1/accesstoken", method: "POST", ...auditActorOf(actor) },
    async () => {
      const tok = await getSatuSehatToken();
      return tok.ok ? Ok({ status: 200, body: null, retries: 0 }) : tok;
    },
  );

  const durationMs = Date.now() - t0;
  if (!r.ok) return { ok: false, mode: cfg.mode, message: r.error.message, durationMs };
  return { ok: true, mode: cfg.mode, message: "Token SatuSehat diperoleh", expiresInSec: describeToken().expiresInSec, durationMs };
}
