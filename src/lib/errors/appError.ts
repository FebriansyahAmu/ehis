// AppError + katalog kode (FLOWS §4). Service melempar AppError; SATU handleError di
// boundary Route memetakan ke envelope + HTTP status. Prisma/SQL error TAK BOLEH bocor.

export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT" // unik dilanggar (P2002)
  | "CONFLICT_VERSION" // optimistic concurrency stale
  | "FORBIDDEN_STATE" // transisi state ilegal
  | "IDEMPOTENCY_REPLAY"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "INTERNAL";

const HTTP: Record<ErrorCode, number> = {
  VALIDATION: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  CONFLICT_VERSION: 409,
  FORBIDDEN_STATE: 409,
  IDEMPOTENCY_REPLAY: 409,
  RATE_LIMITED: 429,
  UPSTREAM_ERROR: 502,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = HTTP[code];
    this.details = details;
  }
}

// ── Factory helpers (ringkas & konsisten) ──────────────────────────────────────
export const Errors = {
  validation: (msg = "Input tidak valid", details?: unknown) => new AppError("VALIDATION", msg, details),
  unauthenticated: (msg = "Sesi tidak valid") => new AppError("UNAUTHENTICATED", msg),
  forbidden: (msg = "Akses ditolak") => new AppError("FORBIDDEN", msg),
  /** Resource tak ada ATAU di luar scope (hide existence → anti-IDOR, FLOWS §6). */
  notFound: (msg = "Data tidak ditemukan") => new AppError("NOT_FOUND", msg),
  conflict: (msg = "Data sudah ada") => new AppError("CONFLICT", msg),
  conflictVersion: (msg = "Data telah diubah pihak lain, muat ulang") =>
    new AppError("CONFLICT_VERSION", msg),
  forbiddenState: (msg = "Transisi status tidak diperbolehkan") => new AppError("FORBIDDEN_STATE", msg),
  internal: (msg = "Terjadi kesalahan internal") => new AppError("INTERNAL", msg),
} as const;

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
