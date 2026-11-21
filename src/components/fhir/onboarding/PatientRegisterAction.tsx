"use client";

// Daftarkan pasien ke SatuSehat — Playbook MPI "Pasien dengan NIK": GET by NIK dulu, POST Create
// Patient HANYA bila tidak ditemukan (server yang menjalankan keduanya berurutan). SatuSehat
// mencocokkan nama/tanggal lahir/jenis kelamin/alamat dengan KTP di Dukcapil sebelum menerbitkan IHS.
// Konfirmasi INLINE 2 langkah (drawer sudah dialog modal — dialog bertumpuk berisiko bentrok focus
// trap). "Ya, daftarkan" muncul di baris BERBEDA dari pemicu (klik ganda tak langsung mengonfirmasi)
// dan fokus pindah ke Batal, yang membacakan konsekuensinya (aria-describedby).

import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, CircleCheck, CircleX, Info, TriangleAlert, UserPlus } from "lucide-react";
import { registerPatient, type PatientRegisterDTO } from "@/lib/api/fhir/patient";
import type { PatientCreateCheckDTO } from "@/lib/schemas/fhir/patient";
import { Button, Pill, errMsg } from "../fhirShared";
import { Callout } from "../resource/resourceUi";

type Phase = "idle" | "confirm" | "busy";

const DONE_TONE: Record<"created" | "resolved" | "cached", { tone: "emerald" | "sky" | "slate"; title: string }> = {
  created: { tone: "emerald", title: "Terdaftar di SatuSehat" },
  resolved: { tone: "sky", title: "Ternyata sudah terdaftar" },
  cached: { tone: "slate", title: "Sudah terpetakan" },
};

function CheckList({ items, tone }: { items: string[]; tone: "rose" | "amber" }) {
  const Icon = tone === "rose" ? CircleX : CircleAlert;
  return (
    // role="list": Safari membuang semantik list pada <ul> ber-display flex.
    <ul role="list" className="flex flex-col gap-1 text-[11px] leading-relaxed text-slate-600">
      {items.map((k) => (
        <li key={k} className="flex gap-1.5">
          <Icon size={12} className={tone === "rose" ? "mt-0.5 shrink-0 text-rose-500" : "mt-0.5 shrink-0 text-amber-500"} aria-hidden />
          <span>{k}</span>
        </li>
      ))}
    </ul>
  );
}

export function PatientRegisterAction({
  localId,
  nama,
  mode,
  check,
  onDone,
}: {
  localId: string;
  nama: string;
  mode: "mock" | "sandbox" | "prod" | null;
  /** Kesiapan dari detail; null sesudah terpetakan (panel hasil tetap tampil). */
  check: PatientCreateCheckDTO | null;
  /** Dipanggil sesudah request selesai (berhasil ataupun ditolak) — muat ulang detail & log. */
  onDone: (r: PatientRegisterDTO) => void;
}) {
  const titleId = useId();
  const descId = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<{ message: string; issues: string[]; kurang: string[] } | null>(null);
  const [done, setDone] = useState<PatientRegisterDTO | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const prevPhase = useRef<Phase>("idle");

  // Tombol yang difokus lenyap di tiap langkah → pindahkan fokus agar tak jatuh ke <body>.
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = phase;
    if (phase === "confirm") (prev === "busy" ? confirmRef : cancelRef).current?.focus();
    else if (phase === "idle" && prev === "confirm") triggerRef.current?.focus();
  }, [phase]);
  useEffect(() => { if (done) doneRef.current?.focus(); }, [done]);

  async function confirm() {
    if (phase === "busy") return;
    setPhase("busy");
    setError(null);
    try {
      const r = await registerPatient(localId);
      if (r.outcome === "created" || r.outcome === "resolved" || r.outcome === "cached") {
        setDone(r);
        setPhase("idle");
      } else {
        setError({ message: r.message, issues: r.issues ?? [], kurang: r.kurang ?? [] });
        setPhase("confirm");
      }
      onDone(r);
    } catch (e) {
      setError({ message: errMsg(e) ?? "Gagal mendaftarkan — coba lagi", issues: [], kurang: [] });
      setPhase("confirm");
    }
  }

  if (done && done.outcome !== "failed" && done.outcome !== "incomplete") {
    const cfg = DONE_TONE[done.outcome];
    return (
      <div ref={doneRef} tabIndex={-1} className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-teal-300">
        <Callout tone={cfg.tone} icon={done.outcome === "created" ? CircleCheck : Info}>
          <b>{cfg.title}</b> — {done.message}.
          {done.ihsId && <> Encounter dan resource lain pasien ini kini merujuk <span className="font-mono">Patient/{done.ihsId}</span>.</>}
        </Callout>
      </div>
    );
  }
  if (!check) return null;

  const siap = check.siap;
  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/40">
      <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-800">
            <UserPlus size={13} className="text-teal-700" aria-hidden />
            Daftarkan ke SatuSehat
            <Pill label="POST Patient" tone="sky" />
          </h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
            Untuk pasien yang belum punya Nomor IHS. Sistem tetap mencari by NIK dulu dan baru POST bila memang belum
            terdaftar. SatuSehat mencocokkan nama, tanggal lahir, jenis kelamin, dan alamat dengan KTP di Dukcapil.
          </p>
        </div>
        {phase === "idle" && (
          <Button ref={triggerRef} variant="secondary" icon={UserPlus} disabled={!siap} onClick={() => { setError(null); setPhase("confirm"); }}>
            Daftarkan…
          </Button>
        )}
      </div>

      {(check.kurang.length > 0 || check.saran.length > 0) && (
        <div className="flex flex-col gap-2 border-t border-teal-100 px-3 py-2.5">
          {check.kurang.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold text-rose-700">Belum bisa didaftarkan — lengkapi di data pasien (registrasi):</p>
              <CheckList items={check.kurang} tone="rose" />
            </div>
          )}
          {check.saran.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold text-amber-700">Sebaiknya dilengkapi (tidak wajib):</p>
              <CheckList items={check.saran} tone="amber" />
            </div>
          )}
        </div>
      )}

      {phase !== "idle" && (
        <div className="border-t border-teal-100 px-3 py-2.5">
          <p id={descId} className="text-[11px] leading-relaxed text-slate-600">
            Cari <b>{nama}</b> by NIK; bila tidak ditemukan, kirim POST Patient. Data yang tidak cocok dengan KTP akan
            ditolak SatuSehat dan peta tidak berubah.
            {mode === "prod" && <> Di Produksi ini membuat data di Master Patient Index nasional.</>}
            {mode === "sandbox" && <> Di Sandbox data dibuat di lingkungan uji bersama.</>}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
            <Button ref={cancelRef} variant="ghost" disabled={phase === "busy"} ariaDescribedby={descId} onClick={() => { setError(null); setPhase("idle"); }}>
              Batal
            </Button>
            <Button ref={confirmRef} icon={UserPlus} loading={phase === "busy"} onClick={() => void confirm()}>
              {phase === "busy" ? "Mendaftarkan…" : "Ya, daftarkan"}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="px-3 pb-2.5">
          <Callout tone="rose" icon={TriangleAlert}>
            {error.message}
            {(error.issues.length > 0 || error.kurang.length > 0) && (
              <ul role="list" className="mt-1 flex list-disc flex-col gap-0.5 pl-4">
                {[...error.kurang, ...error.issues].map((t) => <li key={t}>{t}</li>)}
              </ul>
            )}
          </Callout>
        </div>
      )}
    </div>
  );
}
