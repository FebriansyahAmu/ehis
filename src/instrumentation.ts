// Next.js instrumentation — dijalankan sekali saat server start.
// Runner outbox SatuSehat (FH3): AKTIF hanya bila SATUSEHAT_OUTBOX_INTERVAL_MS > 0 (default mati —
// job tetap tercatat di fhir.sync_log dan bisa dikirim manual via POST /api/v1/fhir/outbox/run).

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // SG-03: production selalu menegakkan auth (lib/auth/enforce.ts). Ingatkan bila flag tak eksplisit.
  if (process.env.NODE_ENV === "production" && process.env.AUTH_ENFORCE !== "true") {
    console.warn(
      '[auth] AUTH_ENFORCE bukan "true" di production — autentikasi TETAP ditegakkan. Set AUTH_ENFORCE=true agar konfigurasi eksplisit.',
    );
  }

  const interval = Number(process.env.SATUSEHAT_OUTBOX_INTERVAL_MS ?? 0);
  if (!Number.isFinite(interval) || interval <= 0) return;

  const g = globalThis as unknown as { __ehisFhirOutboxTimer?: ReturnType<typeof setInterval> };
  if (g.__ehisFhirOutboxTimer) return; // HMR dev: jangan dobel

  const { processDue } = await import("@/lib/services/fhir/outboxWorker");
  g.__ehisFhirOutboxTimer = setInterval(() => {
    processDue(10).catch((e) => console.error("[fhir-outbox] tick gagal:", (e as Error).message));
  }, Math.max(5_000, interval));
}
