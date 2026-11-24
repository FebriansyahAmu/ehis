"use client";

// ANT7 — Panggilan sebelumnya: baris tenang dipisah garis tipis, nomor besar di kiri,
// loket + poli di kanan. Panggilan ulang ditandai teks amber (bukan warna saja).

import { AnimatePresence, motion } from "framer-motion";
import type { DisplayCall } from "./displayShared";

const EASE = [0.22, 1, 0.36, 1] as const;

export function RecentCallsList({ calls }: { calls: DisplayCall[] }) {
  return (
    <section
      aria-labelledby="sebelumnya-judul"
      className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-(--d-panel) ring-1 ring-(--d-line)"
    >
      <h2 id="sebelumnya-judul" className="shrink-0 px-8 pt-6 text-xl font-medium text-(--d-text-2)">
        Panggilan sebelumnya
      </h2>

      {calls.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-8 py-10 text-center text-xl text-(--d-muted)">
          Belum ada panggilan sebelumnya
        </p>
      ) : (
        <ul className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden px-8 pb-4">
          <AnimatePresence initial={false}>
            {calls.map((c) => (
              <motion.li
                key={c.kodebooking}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="flex items-center justify-between gap-6 border-b border-(--d-line) py-4 last:border-b-0"
              >
                <span className="text-5xl leading-none font-semibold tabular-nums text-(--d-text)">{c.nomorAntrean}</span>
                <span className="min-w-0 text-right">
                  <span className="block truncate text-xl text-(--d-text)">{c.loket}</span>
                  <span className="block truncate text-base text-(--d-muted)">
                    {c.poli}
                    {c.recalls > 0 && <span className="text-(--d-recall)"> · dipanggil {c.recalls + 1}×</span>}
                  </span>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
