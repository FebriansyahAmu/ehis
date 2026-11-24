"use client";

// Verifikasi alternatif bila sidik jari peserta tidak terbaca: V-Claim memberi 3 pilihan FKTP
// (Random Question); petugas MENANYAKAN ke peserta FKTP tempat ia terdaftar + tanggal lahirnya,
// lalu jawaban dikirim (Random Answer). Pilihan dimuat saat panel dibuka; status memuat diturunkan
// dari kunci data (tanpa setState sinkron di effect). Galat isian tampil sesudah kirim, fokus ke
// isian pertama yang salah. user = username sesi login. ppkPelSep (kode PPK RS) diisi BFF dari
// konfigurasi server saat backend BPJS nyata — klien tidak memegangnya.
// Komponen shadcn: Card · RadioGroup · Label · Button · Skeleton · Alert · Spinner.

import { useEffect, useId, useState, type FormEvent } from "react";
import { AlertCircle, MessageCircleQuestion, RotateCcw, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/shared/inputs";
import { useSessionOptional } from "@/contexts/SessionContext";
import { cn } from "@/lib/ui/utils";
import { postRandomAnswer, randomQuestion } from "@/lib/bpjs/vClaimSEP";
import type { BPJSError, JnsPelayananKode, RandomQuestionFaskes } from "@/lib/bpjs/bpjsShared";
import { hariIniISO } from "./sepShared";
import { GALAT_KONEKSI } from "./suplesiShared";
import { PesanGalat } from "./tglPulangUi";
import { pesanGalat } from "./fingerprintShared";

const KARTU = "gap-0 border-0 py-0";
const PILIHAN =
  "cursor-pointer gap-2.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs leading-snug font-medium transition-colors hover:bg-slate-200/70 has-data-[state=checked]:bg-emerald-50 has-data-[state=checked]:text-emerald-900";

type Soal = { kunci: number; ok: true; faskes: RandomQuestionFaskes[] } | { kunci: number; ok: false; error: BPJSError };

const JENIS: { value: JnsPelayananKode; label: string }[] = [
  { value: "2", label: "Rawat jalan" },
  { value: "1", label: "Rawat inap" },
];

export default function VerifikasiPertanyaan({
  id: panelId,
  kartu,
  tgl,
  onTerverifikasi,
}: {
  /** id panel — tujuan aria-controls tombol pembukanya. */
  id: string;
  kartu: string;
  tgl: string;
  onTerverifikasi: () => void;
}) {
  const id = useId();
  const sesi = useSessionOptional();
  const [ulang, setUlang] = useState(0);
  const [soal, setSoal] = useState<Soal | null>(null);
  const memuat = soal?.kunci !== ulang;

  const [ppkPst, setPpkPst] = useState("");
  const [tglLahir, setTglLahir] = useState("");
  const [jenPel, setJenPel] = useState<JnsPelayananKode>("2");
  const [dicoba, setDicoba] = useState(false);
  const [kirim, setKirim] = useState<{ status: "idle" } | { status: "loading" } | { status: "error"; pesan: string }>({
    status: "idle",
  });

  useEffect(() => {
    let batal = false;
    randomQuestion(kartu, tgl)
      .then((res) => {
        if (batal) return;
        setSoal(res.ok ? { kunci: ulang, ok: true, faskes: res.value.response?.faskes ?? [] } : { kunci: ulang, ok: false, error: res.error });
      })
      .catch(() => {
        if (!batal) setSoal({ kunci: ulang, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kartu, tgl, ulang]);

  const errFaskes = dicoba && !ppkPst ? "Pilih FKTP sesuai jawaban peserta" : null;
  const errLahir = !dicoba
    ? null
    : !tglLahir
      ? "Isi tanggal lahir sesuai jawaban peserta"
      : tglLahir > hariIniISO()
        ? "Tanggal lahir tidak boleh melewati hari ini"
        : null;
  const busy = kirim.status === "loading";
  const faskes = soal && soal.ok && !memuat ? soal.faskes : [];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setDicoba(true);
    if (!ppkPst) {
      document.getElementById(`${id}-fk-0`)?.focus();
      return;
    }
    if (!tglLahir || tglLahir > hariIniISO()) {
      document.getElementById(`${id}-lahir`)?.focus();
      return;
    }
    if (busy) return;
    setKirim({ status: "loading" });
    try {
      const res = await postRandomAnswer({
        noKartu: kartu,
        tglSep: tgl,
        jenPel,
        ppkPelSep: "",
        tglLahir,
        ppkPst,
        user: sesi?.session?.username ?? "tanpa-sesi",
      });
      if (res.ok) {
        setKirim({ status: "idle" });
        onTerverifikasi();
        return;
      }
      setKirim({ status: "error", pesan: pesanGalat(res.error) });
    } catch {
      setKirim({ status: "error", pesan: pesanGalat(GALAT_KONEKSI) });
    }
  }

  return (
    <Card id={panelId} className={KARTU}>
      <CardHeader className="gap-0.5 px-4 pt-4">
        <CardTitle id={`${id}-judul`} role="heading" aria-level={3} className="flex items-center gap-2 text-sm">
          <MessageCircleQuestion className="size-4 text-emerald-700" aria-hidden="true" />
          Verifikasi dengan pertanyaan
        </CardTitle>
        <CardDescription className="text-xs/relaxed">
          Tanyakan langsung ke peserta, lalu pilih sesuai jawabannya. Jangan membacakan pilihan dari kartu.
        </CardDescription>
      </CardHeader>

      <div className="p-4">
        {memuat ? (
          <div className="flex flex-col gap-2" aria-hidden="true">
            <Skeleton className="h-4 w-40 rounded" />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        ) : soal && !soal.ok ? (
          <Alert role="note" className="rounded-xl border-0 bg-rose-50 p-3 text-rose-900 [&>svg]:size-4">
            <AlertCircle aria-hidden="true" />
            <AlertTitle className="text-xs font-semibold">Pertanyaan tidak bisa dimuat</AlertTitle>
            <AlertDescription className="text-xs/relaxed text-current">
              <p>{pesanGalat(soal.error)}</p>
              <Button type="button" size="xs" variant="secondary" onClick={() => setUlang((n) => n + 1)} className="mt-1 bg-white">
                <RotateCcw aria-hidden="true" />
                Coba lagi
              </Button>
            </AlertDescription>
          </Alert>
        ) : faskes.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-xs text-muted-foreground">
            V-Claim tidak mengirim pilihan FKTP untuk peserta ini. Arahkan peserta ke petugas BPJS di rumah sakit.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate aria-labelledby={`${id}-judul`} className="flex flex-col gap-4">
            <p className="text-[11px] text-muted-foreground">Semua isian wajib.</p>

            {/* FKTP terdaftar */}
            <div className="flex flex-col gap-1.5">
              <Label id={`${id}-fk-label`} className="text-xs">
                Di FKTP mana peserta terdaftar?
              </Label>
              <RadioGroup
                value={ppkPst}
                onValueChange={(v) => {
                  setPpkPst(v);
                  if (kirim.status === "error") setKirim({ status: "idle" });
                }}
                name="ppkPst"
                required
                aria-labelledby={`${id}-fk-label`}
                aria-invalid={Boolean(errFaskes)}
                aria-describedby={errFaskes ? `${id}-fk-err` : undefined}
                className="grid gap-2"
              >
                {faskes.map((f, i) => (
                  <Label key={f.kode} htmlFor={`${id}-fk-${i}`} className={PILIHAN}>
                    <RadioGroupItem id={`${id}-fk-${i}`} value={f.kode} className="border-0 bg-white shadow-sm" />
                    <span className="flex min-w-0 flex-col">
                      <span>{f.nama}</span>
                      <span className="text-[11px] font-normal text-muted-foreground tabular-nums">{f.kode}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
              {errFaskes && <PesanGalat id={`${id}-fk-err`}>{errFaskes}</PesanGalat>}
            </div>

            {/* Tanggal lahir */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-lahir`} className="text-xs">
                Tanggal lahir peserta
              </Label>
              <DatePicker
                id={`${id}-lahir`}
                value={tglLahir}
                onChange={(v) => {
                  setTglLahir(v);
                  if (kirim.status === "error") setKirim({ status: "idle" });
                }}
                variant="filled"
                clearable={false}
                placeholder="Pilih tanggal lahir"
                invalid={Boolean(errLahir)}
                ariaDescribedBy={errLahir ? `${id}-lahir-err` : undefined}
              />
              {errLahir && <PesanGalat id={`${id}-lahir-err`}>{errLahir}</PesanGalat>}
            </div>

            {/* Jenis pelayanan */}
            <div className="flex flex-col gap-1.5">
              <Label id={`${id}-jp-label`} className="text-xs">
                Jenis pelayanan SEP
              </Label>
              <RadioGroup
                value={jenPel}
                onValueChange={(v) => setJenPel(v as JnsPelayananKode)}
                name="jenPel"
                aria-labelledby={`${id}-jp-label`}
                className="grid grid-cols-2 gap-2"
              >
                {JENIS.map((j) => (
                  <Label key={j.value} htmlFor={`${id}-jp-${j.value}`} className={cn(PILIHAN, "py-2")}>
                    <RadioGroupItem id={`${id}-jp-${j.value}`} value={j.value} className="border-0 bg-white shadow-sm" />
                    {j.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {kirim.status === "error" && (
              <Alert className="rounded-xl border-0 bg-rose-50 p-3 text-rose-900 [&>svg]:size-4">
                <AlertCircle aria-hidden="true" />
                <AlertTitle className="text-xs font-semibold">Belum terverifikasi</AlertTitle>
                <AlertDescription className="text-xs/relaxed text-rose-900/80">
                  <p>{kirim.pesan.replace(/\.$/, "")}. Pastikan jawaban berasal dari peserta, lalu kirim ulang.</p>
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" size="sm" disabled={busy} className="h-8 w-full rounded-lg text-xs">
              {busy ? (
                <>
                  <Spinner className="size-3.5" aria-hidden="true" />
                  Mengirim jawaban…
                </>
              ) : (
                <>
                  <Send className="size-3.5" aria-hidden="true" />
                  Kirim jawaban
                </>
              )}
            </Button>

            <p role="status" className="sr-only">
              {kirim.status === "error" ? `Belum terverifikasi: ${kirim.pesan}` : ""}
            </p>
          </form>
        )}
      </div>
    </Card>
  );
}
