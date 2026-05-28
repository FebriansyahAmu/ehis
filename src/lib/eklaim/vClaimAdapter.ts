/**
 * V-Claim Adapter — Backward-Compat Shim.
 *
 * File asli sudah pindah ke `@/lib/bpjs/vClaimAdapter` per Phase BP0.1
 * scope-split modul `/ehis-bpjs` (lihat TODO-BPJS.md).
 *
 * Re-export di sini sementara untuk hindari breaking change pada
 * consumer eklaim existing (`eligibilityChecker.ts`, `SubmissionTab.tsx`).
 *
 * **TODO Cleanup:** Setelah eklaim refactor selesai, ubah consumer
 * langsung import dari `@/lib/bpjs/vClaimAdapter` lalu hapus shim ini.
 * Tercatat di [TECH_DEBT.md](../../../TECH_DEBT.md).
 */

export * from "@/lib/bpjs/vClaimAdapter";
