// Kirim SATU resource milik 1 kunjungan (kartu di konsol Kunjungan) — pelengkap "Kirim semua" (Bundle).
//
// 1) Pratinjau (tanpa jaringan, builder yang sama): resource harus ada di rencana kunjungan; rujukannya
//    ke resource kunjungan ini yang BELUM terkirim (`Type/urn:uuid:…`) = prasyarat → ditolak dengan
//    petunjuk "kirim X dulu". Pengecualian: Encounter yang belum ada boleh dikirim walau diagnosisnya
//    belum (dibuat in-progress — Condition butuh Encounter lebih dulu).
// 2) Kirim nyata lewat alur builder yang SAMA dengan job (runEncounterWithSink) + TargetedSink: hanya
//    resource target yang di-POST/PUT; resource lain tak disentuh. Pasien di-resolve by NIK bila perlu.
// Dikunci per kunjungan → tak bersamaan dengan job Bundle / kirim per item lain untuk kunjungan sama.

import "server-only";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import type { OperationOutcomeIssue } from "@/lib/fhir/fhirShared";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { EncounterItemSyncDTO, EncounterItemSyncInput } from "@/lib/schemas/fhir/resources";
import { auditActorOf } from "./audit";
import { previewEncounter, runEncounterWithSink } from "./encounterSyncService";
import { makeTargetedSink, type PreviewItem } from "./resourceSink";
import { tryLockKunjungan, unlockKunjungan } from "./kunjunganSendLock";

const PENDING_REF = /"reference":"([A-Za-z]+)\/urn:uuid:[^"]+"/g;

/**
 * Jenis resource kunjungan ini yang dirujuk item tapi belum terkirim (id sementara `urn:uuid:` di
 * pratinjau). Referensi master yang belum terpetakan (Patient/Practitioner/Location) bukan bagian dari
 * ini — Patient di-resolve saat kirim, Practitioner/Location = `blockers` rencana.
 */
export function pendingDependencies(item: Pick<PreviewItem, "localType" | "ihsId" | "resource">): string[] {
  // Encounter yang belum ada dibuat in-progress dulu — diagnosis (Condition) menyusul.
  if (item.localType === "Encounter" && !item.ihsId) return [];
  const types = new Set<string>();
  for (const m of JSON.stringify(item.resource).matchAll(PENDING_REF)) types.add(m[1]);
  return [...types];
}

const issueTexts = (issues: OperationOutcomeIssue[] | undefined): string[] =>
  (issues ?? []).slice(0, 5).map((i) => i.diagnostics || i.details?.text || i.code).filter((x): x is string => !!x);

export async function sendEncounterItem(
  kunjunganId: string,
  input: EncounterItemSyncInput,
  actor: Actor,
): Promise<EncounterItemSyncDTO> {
  const audit = auditActorOf(actor);
  const base = { localType: input.localType, localId: input.localId, resourceType: null, ihsId: null, dependsOn: [], issues: [] };

  if (!tryLockKunjungan(kunjunganId)) {
    throw Errors.conflict("Kunjungan ini sedang dikirim (Kirim semua / resource lain) — tunggu sampai selesai");
  }
  try {
    // ── 1. Pratinjau & prasyarat (tanpa jaringan) ──
    const plan = await previewEncounter(kunjunganId, audit);
    if (plan.skipReason) return { ...base, outcome: "skipped", message: plan.skipReason };
    if (plan.blockers.length) return { ...base, outcome: "blocked", message: plan.blockers.join("; ") };

    const item = plan.items.find((i) => i.localType === input.localType && i.localId === input.localId);
    if (!item) {
      return { ...base, outcome: "skipped", message: "Resource ini tidak lagi dibangun dari data terkini (sumber dihapus, diganti, atau dilewati)" };
    }
    const found = { ...base, resourceType: item.resourceType, ihsId: item.ihsId };
    const deps = pendingDependencies(item);
    if (deps.length) {
      return { ...found, outcome: "blocked", dependsOn: deps, message: `Kirim dulu: ${deps.join(", ")} — resource ini merujuknya, tapi belum terkirim` };
    }
    if (item.status === "synced") {
      return { ...found, outcome: "unchanged", message: "Sudah sama dengan yang diterima SatuSehat — tidak dikirim" };
    }

    // ── 2. Kirim nyata (hanya target) ──
    const sink = makeTargetedSink(getSatuSehatConfig().mode, audit, kunjunganId, input);
    const run = await runEncounterWithSink(kunjunganId, audit, sink);
    const r = sink.result();
    const jobMsg = run.result.kind === "failed" ? run.result.message : run.result.kind === "skipped" ? run.result.reason : null;
    const finishBlocked = item.localType === "Encounter" && run.target === "finished" && /Diagnosis \(Condition\)/.test(jobMsg ?? "");

    if (r === undefined) {
      if (finishBlocked) {
        return { ...found, outcome: "blocked", dependsOn: ["Condition"], message: "Encounter belum bisa diselesaikan — kirim semua diagnosa (Condition) dulu" };
      }
      return { ...found, outcome: "failed", message: jobMsg ?? "Resource tidak terkirim — alur kirim berhenti sebelum resource ini" };
    }
    if (r === null) return { ...found, outcome: "skipped", message: "Data sudah dihapus dan belum pernah terkirim — tidak ada yang dikirim" };
    if (!r.ok) {
      return { ...found, outcome: "failed", message: `SatuSehat menolak: ${r.error.message}`, issues: issueTexts(r.error.issues) };
    }
    if (r.op === "noop") return { ...found, ihsId: r.ihsId, outcome: "unchanged", message: "Sudah sama dengan yang diterima SatuSehat — tidak dikirim" };

    const verb = r.op === "create" ? "Terkirim" : "Diperbarui";
    const note = finishBlocked
      ? " · Encounter masih in-progress: kirim semua diagnosa (Condition), lalu kirim Encounter lagi untuk status selesai"
      : "";
    return {
      ...found,
      ihsId: r.ihsId,
      outcome: r.op === "create" ? "created" : "updated",
      message: `${verb} — ${item.resourceType}/${r.ihsId}${note}`,
    };
  } finally {
    unlockKunjungan(kunjunganId);
  }
}
