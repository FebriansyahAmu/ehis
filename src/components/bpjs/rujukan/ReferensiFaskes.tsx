"use client";

// Referensi faskes (V-Claim GET /referensi/faskes/{nama}/{jenis}): pilih jenis FKTP/FKRTL lalu
// ketik nama — pencarian berjalan OTOMATIS 300 ms setelah berhenti mengetik (dulu klik Cari).
// Kosong = semua faskes jenis itu. Tiap baris: nama, alamat, kode (bisa disalin); rumah sakit
// (FKRTL) punya tombol "Kapasitas" (aria-expanded/aria-controls) yang membuka kapasitas rujukan
// per spesialistik hari ini. Status memuat diturunkan dari kunci data.
// Komponen shadcn: RadioGroup · Label · Item · Button · Input · Skeleton · Empty.

import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { Building2, ChevronDown, Hospital, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { listSarana, type SaranaRefRecord } from "@/lib/bpjs/vClaimRujukan";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import KapasitasSpesialistik from "./KapasitasSpesialistik";
import { GalatRujukan, KolomSaring } from "./rujukanUi";
import { ASAL_LABEL, GALAT_KONEKSI, type Asal } from "./rujukanShared";

type Hasil = { kunci: string; ok: true; list: SaranaRefRecord[] } | { kunci: string; ok: false; error: BPJSError };

const SEGMEN =
  "flex-1 cursor-pointer justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground has-data-[state=checked]:bg-white has-data-[state=checked]:text-foreground has-data-[state=checked]:shadow-xs has-focus-visible:ring-2 has-focus-visible:ring-emerald-500/40";

function Baris({ f, index }: { f: SaranaRefRecord; index: number }) {
  const panelId = useId();
  const [buka, setBuka] = useState(false);
  const rs = f.jenis === "FKRTL";
  const Ikon = rs ? Hospital : Building2;
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.025 }}>
      <Item size="sm" className="flex-nowrap items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 sm:items-center">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Ikon className="size-4" />
        </span>
        <ItemContent className="min-w-0 gap-0.5">
          <ItemTitle className="w-full min-w-0 text-xs">
            <span className="truncate font-semibold">{f.nmFaskes}</span>
          </ItemTitle>
          <ItemDescription className="flex min-w-0 flex-wrap items-center gap-x-1 text-[11px] text-wrap">
            <span className="inline-flex items-center gap-0.5 tabular-nums">
              {f.kdFaskes}
              <CopyButton value={f.kdFaskes} label={`kode faskes ${f.kdFaskes}`} />
            </span>
            {f.alamat && <span>· {f.alamat}</span>}
          </ItemDescription>
        </ItemContent>
        {rs && (
          <ItemActions className="shrink-0">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              aria-expanded={buka}
              aria-controls={panelId}
              onClick={() => setBuka((b) => !b)}
              className="group text-emerald-700 hover:text-emerald-800"
            >
              Kapasitas<span className="sr-only"> rujukan {f.nmFaskes}</span>
              <ChevronDown aria-hidden="true" className="transition-transform group-aria-expanded:rotate-180" />
            </Button>
          </ItemActions>
        )}
      </Item>
      {rs && buka && (
        <div className="px-3 pb-2">
          <KapasitasSpesialistik id={panelId} kodePpk={f.kdFaskes} namaPpk={f.nmFaskes} />
        </div>
      )}
    </motion.li>
  );
}

export default function ReferensiFaskes() {
  const id = useId();
  const [jenis, setJenis] = useState<Asal>("FKRTL");
  const [kata, setKata] = useState("");
  const [kataTunda, setKataTunda] = useState("");
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);

  // Tunda 300 ms setelah berhenti mengetik (setState di callback timer, bukan sinkron di effect).
  useEffect(() => {
    const t = setTimeout(() => setKataTunda(kata.trim()), 300);
    return () => clearTimeout(t);
  }, [kata]);

  const kunci = `${jenis}|${kataTunda}#${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  useEffect(() => {
    let batal = false;
    listSarana(kataTunda, jenis)
      .then((res) => {
        if (batal) return;
        setHasil(res.ok ? { kunci, ok: true, list: res.value.response ?? [] } : { kunci, ok: false, error: res.error });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, jenis, kataTunda]);

  const list = hasil && hasil.ok && !memuat ? hasil.list : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <RadioGroup
          value={jenis}
          onValueChange={(v) => setJenis(v as Asal)}
          aria-label="Jenis faskes"
          className="flex gap-0.5 rounded-xl bg-slate-100 p-1 sm:w-80"
        >
          {(["FKRTL", "FKTP"] as const).map((j) => (
            <Label key={j} htmlFor={`${id}-${j}`} className={SEGMEN}>
              <RadioGroupItem id={`${id}-${j}`} value={j} className="sr-only" />
              {j === "FKRTL" ? <Hospital className="size-3.5" aria-hidden="true" /> : <Building2 className="size-3.5" aria-hidden="true" />}
              {j}
            </Label>
          ))}
        </RadioGroup>
        <KolomSaring id={`${id}-q`} value={kata} onChange={setKata} label={`Cari nama faskes ${jenis}`} placeholder="Cari nama faskes" />
      </div>
      <p className="px-4 text-[11px] text-muted-foreground">
        {ASAL_LABEL[jenis]} · {memuat ? "memuat…" : `${list.length} faskes${kataTunda ? ` cocok dengan “${kataTunda}”` : ""}`}
      </p>

      <div className="px-2">
        {memuat ? (
          <div className="flex flex-col gap-1.5 px-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : hasil && !hasil.ok ? (
          <div className="px-2">
            <GalatRujukan error={hasil.error} objek="Faskes" onUlang={() => setUlang((n) => n + 1)} />
          </div>
        ) : list.length === 0 ? (
          <Empty className="gap-3 p-6 md:p-8">
            <EmptyHeader className="gap-1">
              <EmptyMedia variant="icon" className="mb-2 size-10 rounded-xl bg-slate-100 text-slate-500">
                <SearchX className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-semibold tracking-normal">Faskes tidak ditemukan</EmptyTitle>
              <EmptyDescription className="text-xs">
                Tidak ada {jenis} bernama “{kataTunda}”. Coba nama lain atau ganti jenis faskes.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul aria-label={`Faskes ${jenis}`} className="flex flex-col gap-0.5">
            {list.map((f, i) => (
              <Baris key={f.kdFaskes} f={f} index={i} />
            ))}
          </ul>
        )}
      </div>

      <p role="status" className="sr-only">
        {memuat ? "" : hasil && !hasil.ok ? "Faskes gagal dimuat" : `${list.length} faskes ${jenis}`}
      </p>
    </div>
  );
}
