"use client";

// Satu live region sopan (aria-live="polite") untuk mengumumkan galat yang MUNCUL saat field
// ditinggal (blur). Ditunda ±500 ms agar tidak menimpa pengumuman field yang menerima fokus
// berikutnya. Galat yang tampil karena submit gagal tidak perlu diumumkan: fokus dipindah ke field
// itu dan pesannya dibacakan lewat aria-describedby.
//
// Pakai: render `<p aria-live="polite" className="sr-only">{teks}</p>` sekali per form.

import { useCallback, useEffect, useRef, useState } from "react";

export function useUmumkanGalat() {
  const [teks, setTeks] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const sudah = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** Umumkan sekali per kemunculan galat (blur berulang tidak mengulang pengumuman). */
  const umumkan = useCallback((pesan: string) => {
    if (sudah.current) return;
    sudah.current = true;
    window.clearTimeout(timer.current);
    setTeks("");
    timer.current = window.setTimeout(() => setTeks(pesan), 500);
  }, []);

  /** Galat sudah dibacakan lewat fokus (submit gagal) — jangan umumkan lagi. */
  const tandaiDibacakan = useCallback(() => {
    sudah.current = true;
  }, []);

  /** Galat sudah diperbaiki — kosongkan agar tidak tertinggal saat membaca halaman. */
  const bersihkan = useCallback(() => {
    sudah.current = false;
    window.clearTimeout(timer.current);
    setTeks("");
  }, []);

  return { teks, umumkan, tandaiDibacakan, bersihkan };
}
