// SATU titik map error → envelope + status (FLOWS §4). Dipakai oleh route() wrapper.
// Urutan: AppError → ZodError → Prisma known error → fallback INTERNAL (message generik).
// Prisma/SQL/stack TAK PERNAH bocor ke client; hanya di-log server-side.

import { ZodError } from "zod";
import { AppError, isAppError, type ErrorCode } from "@/lib/errors/appError";
import { failure, type Envelope } from "@/lib/http/envelope";

interface Mapped {
  status: number;
  body: Envelope<never>;
}

/** Map kode error Prisma (string) → AppError. Tak meng-import tipe Prisma (loose). */
function fromPrisma(code: string, meta?: unknown): { code: ErrorCode; message: string } | null {
  switch (code) {
    case "P2025":
      return { code: "NOT_FOUND", message: "Data tidak ditemukan" };
    case "P2002": {
      const target = (meta as { target?: string[] } | undefined)?.target?.join(", ");
      return { code: "CONFLICT", message: target ? `Nilai duplikat: ${target}` : "Data sudah ada" };
    }
    case "P2003":
      return { code: "VALIDATION", message: "Referensi data tidak valid" };
    default:
      return null;
  }
}

export function handleError(err: unknown): Mapped {
  // 1) AppError — sudah berformat.
  if (isAppError(err)) {
    return { status: err.httpStatus, body: failure(err.code, err.message, err.details) };
  }

  // 2) ZodError — gagal validasi input.
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return { status: 422, body: failure("VALIDATION", "Input tidak valid", details) };
  }

  // 3) Prisma known error (punya `code` "P2xxx") — map tanpa membocorkan detail.
  if (typeof err === "object" && err !== null && "code" in err && typeof (err as { code: unknown }).code === "string") {
    const mapped = fromPrisma((err as { code: string }).code, (err as { meta?: unknown }).meta);
    if (mapped) {
      const ae = new AppError(mapped.code, mapped.message);
      return { status: ae.httpStatus, body: failure(ae.code, ae.message) };
    }
  }

  // 4) Tak terduga — log penuh server-side, balas generik.
  console.error("[unhandled]", err);
  return { status: 500, body: failure("INTERNAL", "Terjadi kesalahan internal") };
}
