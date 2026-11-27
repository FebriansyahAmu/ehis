"use client";

// ANT2.1 — Panel loket. Dua keadaan:
// • Tertutup → form "Buka loket" (Pos · Loket · Tanggal · Jenis pasien, dropdown Select shadcn).
//   Petugas = akun yang login (bukan teks tetap).
// • Terbuka → identitas loket + pasien yang SEDANG DIPANGGIL di loket ini (panggil ulang / respon
//   langsung dari sini) + "Panggil berikutnya" (antrean menunggu admisi paling lama, FIFO), riwayat
//   shift, dan tutup loket.
// Fokus dipindah ke judul panel sesudah buka/tutup karena kontrol pemicunya hilang dari DOM.
// Komponen shadcn: Card · Select · Label · Button · Badge.

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { BellRing, DoorClosed, DoorOpen, History, PhoneCall, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/shared/inputs";
import { KARTU } from "@/components/bpjs/shared/vclaimUi";
import { useSessionOptional } from "@/contexts/SessionContext";
import { cn } from "@/lib/ui/utils";
import { usePosStore, loketLabel } from "@/lib/antrean/posStore";
import { bukaLoket, tutupLoket, type JenisFilter, type LoketSession, type PanggilanRef } from "@/lib/antrean/loketStore";
import type { AntreanRecord } from "@/lib/antrean/types";
import { fmtJam, todayISO } from "./boardShared";

const JENIS_OPTS: { value: JenisFilter; label: string }[] = [
  { value: "Semua", label: "Semua pasien" },
  { value: "Baru", label: "Pasien baru" },
  { value: "Lama", label: "Pasien lama" },
];

export const PEMICU_SELECT = "h-8 w-full rounded-lg border-0 bg-slate-100 px-2.5 text-xs shadow-none focus-visible:bg-white focus-visible:ring-ring/40";
export const ITEM_SELECT = "text-xs";
const TOMBOL_EMERALD = "bg-emerald-600 text-white hover:bg-emerald-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-emerald-600";

export function LoketControlBar({
  session,
  shiftLogCount,
  dipanggil,
  dipanggilRef,
  berikutnya,
  jumlahMenunggu,
  pilihPosRef,
  onPanggil,
  onPanggilUlang,
  onRespon,
  onBukaRiwayat,
}: {
  session: LoketSession | null;
  shiftLogCount: number;
  /** Pasien berstatus Dipanggil yang terakhir dipanggil di loket aktif. */
  dipanggil: AntreanRecord | null;
  dipanggilRef?: PanggilanRef;
  /** Antrean menunggu admisi berikutnya (paling lama menunggu). */
  berikutnya: AntreanRecord | null;
  jumlahMenunggu: number;
  /** Pemicu dropdown Pos — difokus saat petugas mencoba aksi sebelum loket dibuka. */
  pilihPosRef: RefObject<HTMLButtonElement | null>;
  onPanggil: (rec: AntreanRecord) => void;
  onPanggilUlang: (rec: AntreanRecord) => void;
  onRespon: (rec: AntreanRecord) => void;
  onBukaRiwayat: () => void;
}) {
  const judulRef = useRef<HTMLHeadingElement>(null);
  const fokusJudul = useRef(false);
  const terbuka = session !== null;

  // Sesudah buka/tutup, kontrol pemicu hilang → pindahkan fokus ke judul panel yang baru.
  useEffect(() => {
    if (!fokusJudul.current) return;
    fokusJudul.current = false;
    judulRef.current?.focus();
  }, [terbuka]);

  if (session) {
    return (
      <LoketAktif
        session={session}
        judulRef={judulRef}
        shiftLogCount={shiftLogCount}
        dipanggil={dipanggil}
        dipanggilRef={dipanggilRef}
        berikutnya={berikutnya}
        jumlahMenunggu={jumlahMenunggu}
        onPanggil={onPanggil}
        onPanggilUlang={onPanggilUlang}
        onRespon={onRespon}
        onBukaRiwayat={onBukaRiwayat}
        onTutup={() => {
          fokusJudul.current = true;
          tutupLoket();
        }}
      />
    );
  }
  return (
    <FormBukaLoket
      judulRef={judulRef}
      pilihPosRef={pilihPosRef}
      onDibuka={() => {
        fokusJudul.current = true;
      }}
    />
  );
}

// ── Loket tertutup ─────────────────────────────────────────

function FormBukaLoket({
  judulRef,
  pilihPosRef,
  onDibuka,
}: {
  judulRef: RefObject<HTMLHeadingElement | null>;
  pilihPosRef: RefObject<HTMLButtonElement | null>;
  onDibuka: () => void;
}) {
  const id = useId();
  const posList = usePosStore();
  const petugas = useSessionOptional()?.session?.namaTampil ?? "Petugas admisi";
  const [posKode, setPosKode] = useState("");
  const [loketKode, setLoketKode] = useState("");
  const [tanggal, setTanggal] = useState(todayISO);
  const [jenis, setJenis] = useState<JenisFilter>("Semua");

  // Pilihan diturunkan dari store → tetap sah bila pos/loket dihapus di Pengaturan.
  const posObj = posList.find((p) => p.kode === posKode) ?? posList[0];
  const loketObj = posObj?.loket.find((l) => l.kode === loketKode) ?? posObj?.loket[0];
  const tanpaLoket = !posObj || posObj.loket.length === 0;

  function buka(e: FormEvent) {
    e.preventDefault();
    if (!posObj || !loketObj) return;
    onDibuka();
    bukaLoket({ pos: posObj.kode, loket: loketObj.kode, tanggal, jenisPasien: jenis, petugas });
  }

  return (
    <Card className={KARTU}>
      <form onSubmit={buka} aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <DoorClosed className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 id={`${id}-judul`} ref={judulRef} tabIndex={-1} className="text-sm font-semibold outline-none">
              Loket belum dibuka
            </h2>
            <p className="text-xs text-muted-foreground">
              Pilih tempat Anda bertugas. Panggil, respon kedatangan, dan batal aktif setelah loket dibuka atas nama{" "}
              <span className="font-medium text-foreground">{petugas}</span>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          <Kolom id={`${id}-pos`} label="Pos antrean">
            <Select
              value={posObj?.kode}
              onValueChange={(v) => {
                setPosKode(v);
                setLoketKode("");
              }}
            >
              <SelectTrigger id={`${id}-pos`} ref={pilihPosRef} size="sm" className={PEMICU_SELECT}>
                <SelectValue placeholder="Belum ada pos" />
              </SelectTrigger>
              <SelectContent position="popper">
                {posList.map((p) => (
                  <SelectItem key={p.kode} value={p.kode} className={ITEM_SELECT}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Kolom>

          <Kolom id={`${id}-loket`} label="Loket">
            <Select value={loketObj?.kode} onValueChange={setLoketKode} disabled={tanpaLoket}>
              <SelectTrigger id={`${id}-loket`} size="sm" className={PEMICU_SELECT} aria-describedby={tanpaLoket ? `${id}-tanpa-loket` : undefined}>
                <SelectValue placeholder="Belum ada loket" />
              </SelectTrigger>
              <SelectContent position="popper">
                {posObj?.loket.map((l) => (
                  <SelectItem key={l.kode} value={l.kode} className={ITEM_SELECT}>
                    {l.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Kolom>

          <Kolom id={`${id}-tgl`} label="Tanggal layanan">
            {/* cn DatePicker hanya menggabung kelas (tanpa tailwind-merge) → ringkas lewat `!`. */}
            <DatePicker
              id={`${id}-tgl`}
              value={tanggal}
              onChange={(v) => v && setTanggal(v)}
              variant="filled"
              clearable={false}
              className="h-8! rounded-lg! px-2.5! text-xs! tabular-nums"
            />
          </Kolom>

          <Kolom id={`${id}-jenis`} label="Jenis pasien">
            <Select value={jenis} onValueChange={(v) => setJenis(v as JenisFilter)}>
              <SelectTrigger id={`${id}-jenis`} size="sm" className={PEMICU_SELECT}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {JENIS_OPTS.map((j) => (
                  <SelectItem key={j.value} value={j.value} className={ITEM_SELECT}>
                    {j.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Kolom>

          <Button type="submit" size="sm" disabled={!loketObj} className={cn("h-8 text-xs", TOMBOL_EMERALD)}>
            <DoorOpen aria-hidden="true" />
            Buka loket
          </Button>
        </div>
        {tanpaLoket && (
          <p id={`${id}-tanpa-loket`} className="text-[11px] text-amber-800">
            Pos ini belum punya loket. Tambahkan loket di menu Pengaturan.
          </p>
        )}
      </form>
    </Card>
  );
}

function Kolom({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-[11px] font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ── Loket terbuka ──────────────────────────────────────────

function LoketAktif({
  session,
  judulRef,
  shiftLogCount,
  dipanggil,
  dipanggilRef,
  berikutnya,
  jumlahMenunggu,
  onPanggil,
  onPanggilUlang,
  onRespon,
  onBukaRiwayat,
  onTutup,
}: {
  session: LoketSession;
  judulRef: RefObject<HTMLHeadingElement | null>;
  shiftLogCount: number;
  dipanggil: AntreanRecord | null;
  dipanggilRef?: PanggilanRef;
  berikutnya: AntreanRecord | null;
  jumlahMenunggu: number;
  onPanggil: (rec: AntreanRecord) => void;
  onPanggilUlang: (rec: AntreanRecord) => void;
  onRespon: (rec: AntreanRecord) => void;
  onBukaRiwayat: () => void;
  onTutup: () => void;
}) {
  const id = useId();
  const jenis = JENIS_OPTS.find((j) => j.value === session.jenisPasien)?.label ?? session.jenisPasien;
  const recalls = dipanggilRef?.recalls ?? 0;

  return (
    <Card className={KARTU}>
      <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:gap-4">
        <div className="flex min-w-0 items-center gap-3 xl:w-72 xl:shrink-0">
          <span aria-hidden="true" className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <DoorOpen className="size-4" />
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-emerald-700">Loket dibuka</p>
            <h2 id={`${id}-judul`} ref={judulRef} tabIndex={-1} className="truncate text-sm font-semibold outline-none">
              {loketLabel(session.pos, session.loket)}
            </h2>
            <p className="truncate text-[11px] text-muted-foreground tabular-nums">
              {session.petugas} · {jenis} · sejak {fmtJam(session.openedAt)}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-slate-50 px-3 py-2">
          {dipanggil ? (
            <>
              <span className="text-xl leading-none font-semibold text-blue-800 tabular-nums">{dipanggil.nomorAntrean}</span>
              <div className="min-w-0 flex-1 basis-40">
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  Sedang dipanggil{dipanggilRef ? ` · ${fmtJam(dipanggilRef.calledAt)}` : ""}
                  {recalls > 0 && ` · ${recalls + 1}× dipanggil`}
                </p>
                <p className="truncate text-xs font-medium">{dipanggil.pasien.nama}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="xs" onClick={() => onPanggilUlang(dipanggil)} className="text-amber-800 hover:bg-amber-50 hover:text-amber-900">
                  <BellRing aria-hidden="true" />
                  Panggil ulang
                </Button>
                <Button type="button" size="xs" onClick={() => onRespon(dipanggil)} className={TOMBOL_EMERALD}>
                  <UserCheck aria-hidden="true" />
                  Respon
                  <span className="sr-only"> kedatangan {dipanggil.pasien.nama}</span>
                </Button>
              </div>
            </>
          ) : (
            <p className="py-1 text-xs text-muted-foreground">Belum ada pasien yang dipanggil di loket ini.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 xl:shrink-0">
          <Button
            type="button"
            size="xs"
            onClick={() => berikutnya && onPanggil(berikutnya)}
            aria-disabled={!berikutnya}
            aria-describedby={`${id}-menunggu`}
            className={TOMBOL_EMERALD}
          >
            <PhoneCall aria-hidden="true" />
            Panggil berikutnya
            {berikutnya && <span className="tabular-nums opacity-80">{berikutnya.nomorAntrean}</span>}
          </Button>
          <span id={`${id}-menunggu`} className="text-[11px] text-muted-foreground tabular-nums">
            {jumlahMenunggu > 0 ? `${jumlahMenunggu} menunggu` : "Tidak ada yang menunggu"}
          </span>
          <Button type="button" variant="ghost" size="xs" onClick={onBukaRiwayat} aria-haspopup="dialog">
            <History aria-hidden="true" />
            Riwayat shift
            <span className="text-muted-foreground tabular-nums">{shiftLogCount}</span>
          </Button>
          <Button type="button" variant="ghost" size="xs" onClick={onTutup} className="text-rose-700 hover:bg-rose-50 hover:text-rose-800">
            <DoorClosed aria-hidden="true" />
            Tutup loket
          </Button>
        </div>
      </section>
    </Card>
  );
}
