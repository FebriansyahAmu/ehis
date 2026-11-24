"use client";

// Tab SEP Internal — pola daftar–detail. Kiri: cari No. SEP + daftar SEP yang bisa disaring
// (baris terpilih ditandai). Kanan: rujukan internal SEP itu + hapus lewat dialog konfirmasi.
// Respons basi diabaikan; hasil diumumkan lewat role="status". Rujukan yang dihapus di sesi ini
// ditandai lokal (mock V-Claim tidak mengubah data).

import { useCallback, useId, useRef, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dataSepInternal } from "@/lib/bpjs/vClaimSEP";
import type { SEPInternalItem } from "@/lib/bpjs/bpjsShared";
import { errorLabel } from "./sepShared";
import SEPInternalForm from "./SEPInternalForm";
import SEPInternalList from "./SEPInternalList";
import SEPInternalDetail from "./SEPInternalDetail";
import HapusSEPInternalDialog from "./HapusSEPInternalDialog";
import { GALAT_KONEKSI, kunciRujukan, type HasilInternal } from "./sepInternalShared";

const KARTU = "min-w-0 gap-0 border-0 py-0";

export default function SEPInternalTab({ onBukaSEP }: { onBukaSEP?: (noSEP: string) => void }) {
  const judulId = useId();
  const [noInput, setNoInput] = useState("");
  const [hasil, setHasil] = useState<HasilInternal>({ status: "idle" });
  const [terhapus, setTerhapus] = useState<ReadonlySet<string>>(() => new Set());
  const [target, setTarget] = useState<{ noSep: string; item: SEPInternalItem } | null>(null);
  const req = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const judulDetailRef = useRef<HTMLHeadingElement>(null);

  const cari = useCallback(async (no: string) => {
    const rid = ++req.current;
    setHasil({ status: "loading", no });
    let next: HasilInternal;
    try {
      const res = await dataSepInternal(no);
      next = res.ok ? { status: "done", no, list: res.value.response?.list ?? [] } : { status: "error", no, error: res.error };
    } catch {
      next = { status: "error", no, error: GALAT_KONEKSI };
    }
    if (rid === req.current) setHasil(next);
  }, []);

  const pilih = useCallback(
    (no: string) => {
      setNoInput(no);
      void cari(no);
    },
    [cari],
  );

  const terpilih = hasil.status === "idle" ? null : hasil.no;
  const ringkas =
    hasil.status === "done"
      ? `SEP ${hasil.no}: ${hasil.list.length} rujukan internal`
      : hasil.status === "error"
        ? errorLabel(hasil.error).title
        : "";

  return (
    <div className="grid h-full content-start gap-4 p-4 sm:p-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:content-stretch">
      <aside className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
        <Card className={KARTU}>
          <CardHeader className="gap-0.5 px-4 pt-4">
            <CardTitle id={judulId} role="heading" aria-level={2} className="text-sm">
              SEP internal
            </CardTitle>
            <CardDescription className="text-xs">Rujukan antar poli dalam satu SEP</CardDescription>
          </CardHeader>
          <div className="p-4">
            <SEPInternalForm
              judulId={judulId}
              value={noInput}
              onChange={setNoInput}
              onSubmit={pilih}
              busy={hasil.status === "loading"}
              inputRef={inputRef}
            />
          </div>
        </Card>
        <Card className={KARTU}>
          <SEPInternalList terpilih={terpilih} onPilih={pilih} />
        </Card>
      </aside>

      <section aria-label="Rujukan internal" className="min-w-0 lg:min-h-0 lg:overflow-y-auto">
        <SEPInternalDetail
          hasil={hasil}
          terhapus={terhapus}
          judulRef={judulDetailRef}
          onUlang={() => {
            if (hasil.status !== "idle") void cari(hasil.no);
          }}
          onHapus={(item) => {
            if (hasil.status === "done") setTarget({ noSep: hasil.no, item });
          }}
          onBukaSEP={onBukaSEP}
        />
      </section>

      <p role="status" className="sr-only">
        {ringkas}
      </p>

      <HapusSEPInternalDialog
        target={target}
        onClose={() => setTarget(null)}
        onDeleted={(noSep, item) => setTerhapus((s) => new Set(s).add(kunciRujukan(noSep, item)))}
        fokusSesudah={() => judulDetailRef.current?.focus()}
      />
    </div>
  );
}
