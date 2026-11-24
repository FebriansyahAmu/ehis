"use client";

// Tab Rujukan masuk: kiri = form cari (satu kolom No. rujukan / No. kartu), kanan = hasil + detail.
// FKTP dan FKRTL dipanggil PARALEL (dua endpoint V-Claim terpisah) lalu digabung; "tidak
// ditemukan" (201) di satu asal itu normal, galat lain dicatat per asal tanpa menyembunyikan hasil
// asal lainnya. Respons basi diabaikan; ringkasan diumumkan lewat role="status".

import { useCallback, useId, useRef, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRujukan, listRujukanByPeserta } from "@/lib/bpjs/vClaimRujukan";
import type { BPJSError, RujukanRecord } from "@/lib/bpjs/bpjsShared";
import CariRujukanMasukForm from "./CariRujukanMasukForm";
import RujukanMasukHasil from "./RujukanMasukHasil";
import { KARTU } from "./rujukanUi";
import { GALAT_KONEKSI, labelGalat, modeDari, urutTerbaru, type Asal, type HasilMasuk, type ModeCari } from "./rujukanShared";

type HasilAsal = { asal: Asal; list: RujukanRecord[] } | { asal: Asal; error: BPJSError };

async function cariDiAsal(q: string, mode: ModeCari, asal: Asal): Promise<HasilAsal> {
  try {
    const res = mode === "rujukan" ? await getRujukan(q, asal) : await listRujukanByPeserta(q, asal);
    if (res.ok) {
      const v = res.value.response;
      return { asal, list: Array.isArray(v) ? v : v ? [v] : [] };
    }
    if (res.error.type === "BPJSMetaError" && res.error.code === "201") return { asal, list: [] };
    return { asal, error: res.error };
  } catch {
    return { asal, error: GALAT_KONEKSI };
  }
}

function ringkas(h: HasilMasuk): string {
  if (h.status !== "done") return "";
  if (h.list.length > 0) return `${h.list.length} rujukan ditemukan`;
  if (h.gagal.length > 0) return labelGalat(h.gagal[0].error).title;
  return "Rujukan tidak ditemukan";
}

export default function RujukanMasukTab() {
  const judulId = useId();
  const [q, setQ] = useState("");
  const [hasil, setHasil] = useState<HasilMasuk>({ status: "idle" });
  const [terpilih, setTerpilih] = useState<string | null>(null);
  const [nomor, setNomor] = useState(0);
  const req = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const cari = useCallback(async (kata: string) => {
    const rid = ++req.current;
    const mode = modeDari(kata);
    setHasil({ status: "loading", q: kata, mode });
    setTerpilih(null);
    setNomor((n) => n + 1);
    const semua = await Promise.all((["FKTP", "FKRTL"] as const).map((a) => cariDiAsal(kata, mode, a)));
    if (rid !== req.current) return; // sudah disusul pencarian lain
    const list = urutTerbaru(semua.flatMap((h) => ("list" in h ? h.list : [])));
    const gagal = semua.flatMap((h) => ("error" in h ? [{ asal: h.asal, error: h.error }] : []));
    setHasil({ status: "done", q: kata, mode, list, gagal });
  }, []);

  return (
    <div className="grid h-full content-start gap-4 p-4 sm:p-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
      <Card className={KARTU}>
        <CardHeader className="gap-0.5 px-4 pt-4">
          <CardTitle id={judulId} role="heading" aria-level={2} className="text-sm">
            Cari rujukan masuk
          </CardTitle>
          <CardDescription className="text-xs">Rujukan dari FKTP atau rumah sakit lain ke RS ini</CardDescription>
        </CardHeader>
        <div className="p-4">
          <CariRujukanMasukForm
            judulId={judulId}
            value={q}
            onChange={setQ}
            onSubmit={(kata) => void cari(kata)}
            busy={hasil.status === "loading"}
            inputRef={inputRef}
          />
        </div>
      </Card>

      <section aria-label="Hasil rujukan masuk" className="min-w-0">
        <RujukanMasukHasil
          key={nomor}
          hasil={hasil}
          terpilih={terpilih}
          onPilih={setTerpilih}
          onUlang={() => {
            if (hasil.status !== "idle") void cari(hasil.q);
          }}
        />
      </section>

      <p role="status" className="sr-only">
        {ringkas(hasil)}
      </p>
    </div>
  );
}
