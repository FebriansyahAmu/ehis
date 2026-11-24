"use client";

// Satu live region sopan (aria-live="polite") untuk mengumumkan galat yang MUNCUL saat field
// ditinggal (blur) atau dipilih (DatePicker). Ditunda ±500 ms agar tidak menimpa pengumuman field
// yang menerima fokus berikutnya. Galat yang tampil karena submit gagal tidak perlu diumumkan:
// fokus dipindah ke field itu dan pesannya dibacakan lewat aria-describedby.
//
// Satu form boleh punya beberapa field: tiap field diberi `kunci` sendiri (default "utama") agar
// status "sudah diumumkan" tidak saling menimpa.
//
// Pakai: render `<p aria-live="polite" className="sr-only">{teks}</p>` sekali per form.

import { useCallback, useEffect, useRef, useState } from "react";

export function useUmumkanGalat() {
  const [teks, setTeks] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const sudah = useRef(new Set<string>());
  const kunciTerakhir = useRef<string | null>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** Umumkan sekali per kemunculan galat (blur berulang tidak mengulang pengumuman). */
  const umumkan = useCallback((pesan: string, kunci = "utama") => {
    if (sudah.current.has(kunci)) return;
    sudah.current.add(kunci);
    kunciTerakhir.current = kunci;
    window.clearTimeout(timer.current);
    setTeks("");
    timer.current = window.setTimeout(() => setTeks(pesan), 500);
  }, []);

  /** Galat sudah dibacakan lewat fokus (submit gagal) — jangan umumkan lagi. */
  const tandaiDibacakan = useCallback((kunci = "utama") => {
    sudah.current.add(kunci);
  }, []);

  /** Galat sudah diperbaiki — kosongkan agar tidak tertinggal saat membaca halaman. */
  const bersihkan = useCallback((kunci = "utama") => {
    sudah.current.delete(kunci);
    if (kunciTerakhir.current === kunci) {
      window.clearTimeout(timer.current);
      setTeks("");
      kunciTerakhir.current = null;
    }
  }, []);

  return { teks, umumkan, tandaiDibacakan, bersihkan };
}
