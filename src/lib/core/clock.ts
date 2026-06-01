// Clock seam (FLOWS §14): DILARANG `Date.now()`/`new Date()` langsung di Service.
// Service terima `clock` yang di-inject → deterministik & testable (test bisa stub waktu).

export interface Clock {
  now(): Date;
}

/** Clock produksi — satu-satunya tempat `new Date()` boleh dipanggil. */
export const systemClock: Clock = {
  now: () => new Date(),
};

/** Clock tetap untuk test (deterministik). */
export function fixedClock(at: Date | string): Clock {
  const d = typeof at === "string" ? new Date(at) : at;
  return { now: () => new Date(d) };
}
